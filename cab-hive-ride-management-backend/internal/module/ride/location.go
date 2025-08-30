package ride

import (
	"cab-hive/internal/global/database"
	"cab-hive/internal/global/jwt"
	"cab-hive/internal/global/redis"
	"cab-hive/internal/global/response"
	"cab-hive/internal/model"
	"cab-hive/internal/module/order"
	"context"
	"encoding/json"
	"fmt"
	"math"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
	"gorm.io/gorm"
)

// DriverLocation 定义司机位置信息结构体
type DriverLocation struct {
	OpenID     string  `json:"open_id"`
	Latitude   float64 `json:"latitude"`
	Longitude  float64 `json:"longitude"`
	UpdateTime int64   `json:"update_time"`
}

// UploadLocationRequest 定义上传位置请求的结构体
type UploadLocationRequest struct {
	Latitude  float64 `json:"latitude" binding:"required"`
	Longitude float64 `json:"longitude" binding:"required"`
}

// UploadLocation 处理司机上传位置信息的请求
// 需要司机认证
func UploadLocation(c *gin.Context) {
	// 从上下文中获取载荷
	payloadInterface, exists := c.Get("payload")
	if !exists {
		response.Fail(c, response.ErrTokenInvalid)
		return
	}

	payload, ok := payloadInterface.(*jwt.Claims)
	if !ok {
		response.Fail(c, response.ErrTokenInvalid)
		return
	}

	// 检查用户角色是否为司机或管理员
	if payload.RoleID != 2 && payload.RoleID != 3 {
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	// 解析请求参数
	var req UploadLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

	// 创建位置信息
	location := DriverLocation{
		OpenID:     payload.OpenID,
		Latitude:   req.Latitude,
		Longitude:  req.Longitude,
		UpdateTime: time.Now().Unix(),
	}

	// 将位置信息存储到 Redis
	err := saveDriverLocation(location)
	if err != nil {
		response.Fail(c, response.ErrServerInternal.WithOrigin(err))
		return
	}

	// 检查司机是否有进行中的订单
	activeOrder, err := getDriverActiveOrder(payload.OpenID)
	if err != nil {
		log.Error("查询司机进行中订单时出错", "error", err)
		// 即使出错也继续执行，因为位置上传本身是成功的
	} else if activeOrder != nil {
		// 检查订单状态
		if activeOrder.Status == model.OrderStatusWaitingForPickup {
			// 如果订单状态是等待司机到达起点，则检查司机是否接近起点
			distance := calculateDistance(
				req.Latitude, req.Longitude,
				activeOrder.StartLocation.Latitude, activeOrder.StartLocation.Longitude)

			// 设置距离阈值（单位：公里），20米 = 0.02公里
			const distanceThreshold = 0.02 // 20米阈值

			// 如果距离小于阈值，则记录日志并更新订单状态
			if distance <= distanceThreshold {
				// 更新订单状态为司机已到达
				activeOrder.Status = model.OrderStatusDriverArrived
				if err := database.DB.Model(&model.Order{}).Where("id = ?", activeOrder.ID).Update("status", model.OrderStatusDriverArrived).Error; err != nil {
					log.Error("更新订单状态失败", "error", err, "order_id", activeOrder.ID)
				} else {
					// 更新Redis中的订单状态
					// 先从旧状态集合中移除
					if err := order.RemoveOrderFromRedis(activeOrder.ID, model.OrderStatusWaitingForPickup); err != nil {
						log.Error("从Redis移除订单失败", "error", err, "order_id", activeOrder.ID)
					}
					// 再添加到新状态集合中
					if err := order.AddOrderToRedisStatusSet(activeOrder); err != nil {
						log.Error("添加订单到Redis失败", "error", err, "order_id", activeOrder.ID)
					}
				}
			}
		} else {
			// 否则进行原来的司机偏离路线的检测
			// 计算司机当前位置与订单路线点的最短距离
			distance := calculateDistanceToRoutePoints(
				req.Latitude, req.Longitude,
				activeOrder.RoutePoints)

			// 设置距离阈值（单位：公里）
			const distanceThreshold = 50.0 // 50公里阈值

			// 如果距离超过阈值，则报警
			if distance > distanceThreshold {
				log.Warn("警告：司机当前位置距离订单路线过远",
					"driver_open_id", payload.OpenID,
					"distance", fmt.Sprintf("%.2f公里", distance),
					"threshold", fmt.Sprintf("%.2f公里", distanceThreshold))
			}
		}
	}

	// 返回成功响应
	response.Success(c, nil)
}

// GetDriverLocation 处理查询司机位置信息的请求
// 公开接口，任何认证用户都可以查询
func GetDriverLocation(c *gin.Context) {
	// 获取司机 ID 参数
	driverID := c.Param("id")
	if driverID == "" {
		response.Fail(c, response.ErrInvalidRequest.WithTips("司机ID不能为空"))
		return
	}

	// 从 Redis 获取司机位置信息
	location, err := getDriverLocation(driverID)
	if err != nil {
		response.Fail(c, response.ErrNotFound.WithTips("未找到司机位置信息"))
		return
	}

	// 返回成功响应
	response.Success(c, location)
}

// saveDriverLocation 将司机位置信息存储到 Redis
func saveDriverLocation(location DriverLocation) error {
	// 将位置信息序列化为 JSON
	locationJSON, err := json.Marshal(location)
	if err != nil {
		return err
	}

	// 构建 Redis key
	key := fmt.Sprintf("driver:location:%s", location.OpenID)

	// 存储到 Redis，设置过期时间（例如 1 小时）
	ctx := context.Background()
	return redis.RedisClient.Set(ctx, key, locationJSON, time.Hour).Err()
}

// getDriverLocation 从 Redis 获取司机位置信息
func getDriverLocation(driverID string) (*DriverLocation, error) {
	// 构建 Redis key
	key := fmt.Sprintf("driver:location:%s", driverID)

	// 从 Redis 获取数据
	ctx := context.Background()
	locationJSON, err := redis.RedisClient.Get(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	// 反序列化 JSON 数据
	var location DriverLocation
	err = json.Unmarshal([]byte(locationJSON), &location)
	if err != nil {
		return nil, err
	}

	return &location, nil
}

// getDriverActiveOrder 检查司机是否有进行中的订单
func getDriverActiveOrder(driverOpenID string) (*model.Order, error) {
	// 查询司机是否有进行中的订单
	// 进行中的订单状态包括: waiting_for_pickup, driver_arrived, in_progress
	var order model.Order
	err := database.DB.Where("driver_open_id = ? AND status IN (?, ?, ?)",
		driverOpenID,
		model.OrderStatusWaitingForPickup,
		model.OrderStatusDriverArrived,
		model.OrderStatusInProgress).
		First(&order).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// 没有找到进行中的订单
			return nil, nil
		}
		// 其他数据库错误
		return nil, err
	}

	return &order, nil
}

// calculateDistance 计算两个经纬度点之间的距离（使用Haversine公式）
// 返回距离（单位：公里）
func calculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadius = 6371.0 // 地球半径（单位：公里）

	// 将角度转换为弧度
	lat1Rad := lat1 * math.Pi / 180
	lon1Rad := lon1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	lon2Rad := lon2 * math.Pi / 180

	// 计算差值
	deltaLat := lat2Rad - lat1Rad
	deltaLon := lon2Rad - lon1Rad

	// Haversine公式
	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(deltaLon/2)*math.Sin(deltaLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	distance := earthRadius * c
	return distance
}

// calculateDistanceToRoutePoints 计算司机位置到订单路线点的最短距离
// 返回距离（单位：公里）
func calculateDistanceToRoutePoints(driverLat, driverLon float64, routePoints model.LocationPoints) float64 {
	// 如果路线点为空，返回最大距离
	if len(routePoints) == 0 {
		return math.MaxFloat64
	}

	// 初始化最短距离为最大值
	minDistance := math.MaxFloat64

	// 遍历所有路线点，计算到每个点的距离，找出最短距离
	for _, point := range routePoints {
		distance := calculateDistance(driverLat, driverLon, point.Latitude, point.Longitude)
		if distance < minDistance {
			minDistance = distance
		}
	}

	return minDistance
}

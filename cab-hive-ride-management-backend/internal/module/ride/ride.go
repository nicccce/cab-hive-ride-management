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
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
	"gorm.io/gorm"
	"math"
)

// RequestOrderResponse 定义请求订单的响应结构
type RequestOrderResponse struct {
	ID            uint                 `json:"id"`
	UserOpenID    string               `json:"user_open_id"`
	DriverOpenID  string               `json:"driver_open_id"`
	VehicleID     uint                 `json:"vehicle_id"`
	StartLocation model.Location       `json:"start_location"`
	EndLocation   model.Location       `json:"end_location"`
	RoutePoints   model.LocationPoints `json:"route_points"`
	StartTime     *string              `json:"start_time"`
	EndTime       *string              `json:"end_time"`
	Distance      float64              `json:"distance"`
	Duration      int                  `json:"duration"`
	Fare          float64              `json:"fare"`
	Tolls         float64              `json:"tolls"`
	Status        string               `json:"status"`
	PaymentTime   *string              `json:"payment_time"`
	Comment       string               `json:"comment"`
	CancelReason  string               `json:"cancel_reason"`
	Rating        int                  `json:"rating"`
	ReserveTime   *string              `json:"reserve_time"`
}

// RequestOrder 处理司机请求订单的请求
func RequestOrder(c *gin.Context) {
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

	// 检查用户角色是否为司机
	if payload.RoleID != 2 {
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	// 检查司机是否有未完成的订单
	unfinishedOrder, err := getDriverActiveOrder(payload.OpenID)

	// 如果找到了未完成的订单，拒绝请求新订单
	if unfinishedOrder != nil {
		response.Fail(c, response.ErrInvalidRequest.WithTips("司机有未完成的订单，无法请求新订单"))
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		// 如果是其他数据库错误，返回错误响应
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 从Redis中获取司机位置信息
	driverLocation, err := getDriverLocation(payload.OpenID)
	if err != nil {
		response.Fail(c, response.ErrNotFound.WithTips("未找到司机位置信息"))
		return
	}

	// 从Redis中匹配最近的订单
	matchedOrder, err := matchNearestOrder(driverLocation)
	if err != nil {
		response.Fail(c, response.ErrNotFound.WithTips("没有可接的订单"))
		return
	}

	// 转换为响应格式
	orderResp := RequestOrderResponse{
		ID:            matchedOrder.ID,
		UserOpenID:    matchedOrder.UserOpenID,
		DriverOpenID:  matchedOrder.DriverOpenID,
		VehicleID:     matchedOrder.VehicleID,
		StartLocation: matchedOrder.StartLocation,
		EndLocation:   matchedOrder.EndLocation,
		RoutePoints:   matchedOrder.RoutePoints,
		StartTime: func() *string {
			if matchedOrder.StartTime != nil {
				formatted := matchedOrder.StartTime.Format("2006/01/02 15:04:05")
				return &formatted
			}
			return nil
		}(),
		EndTime: func() *string {
			if matchedOrder.EndTime != nil {
				formatted := matchedOrder.EndTime.Format("2006/01/02 15:04:05")
				return &formatted
			}
			return nil
		}(),
		Distance: matchedOrder.Distance,
		Duration: matchedOrder.Duration,
		Fare:     matchedOrder.Fare,
		Tolls:    matchedOrder.Tolls,
		Status:   matchedOrder.Status,
		Comment:  matchedOrder.Comment,
		PaymentTime: func() *string {
			if matchedOrder.PaymentTime != nil {
				formatted := matchedOrder.PaymentTime.Format("2006/01/02 15:04:05")
				return &formatted
			}
			return nil
		}(),
		CancelReason: matchedOrder.CancelReason,
		Rating:       matchedOrder.Rating,
		ReserveTime: func() *string {
			if matchedOrder.ReserveTime != nil {
				formatted := matchedOrder.ReserveTime.Format("2006/01/02 15:04:05")
				return &formatted
			}
			return nil
		}(),
	}

	// 返回成功响应
	response.Success(c, orderResp)
}

// TakeOrderRequest 定义接单请求的结构体
type TakeOrderRequest struct {
	OrderID   uint `json:"order_id" binding:"required"`
	VehicleID uint `json:"vehicle_id" binding:"required"`
}

// TakeOrder 处理司机接单的请求
func TakeOrder(c *gin.Context) {
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

	// 检查用户角色是否为司机
	if payload.RoleID != 2 {
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	// 检查司机是否有未完成的订单
	unfinishedOrder, err := getDriverActiveOrder(payload.OpenID)

	// 如果找到了未完成的订单，拒绝请求新订单
	if unfinishedOrder != nil {
		response.Fail(c, response.ErrInvalidRequest.WithTips("司机有未完成的订单，无法请求新订单"))
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		// 如果是其他数据库错误，返回错误响应
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 解析请求参数
	var req TakeOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

	// 查找订单
	var orderModel model.Order
	if err := database.DB.Where("id = ? AND status = ?", req.OrderID, model.OrderStatusWaitingForDriver).First(&orderModel).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Fail(c, response.ErrNotFound.WithTips("订单不存在或状态不正确"))
		} else {
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
		}
		return
	}

	// 更新订单状态和司机信息
	orderModel.DriverOpenID = payload.OpenID
	orderModel.Status = model.OrderStatusWaitingForPickup

	// 保存订单到数据库
	if err := database.DB.Save(&orderModel).Error; err != nil {
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 更新Redis中的订单状态
	if err := order.RemoveOrderFromRedis(orderModel.ID, model.OrderStatusWaitingForDriver); err != nil {
		// 注意：这里不返回错误，因为订单已经成功保存到数据库
		// Redis操作失败不应该影响主要业务流程
	}

	if err := order.AddOrderToRedisStatusSet(&orderModel); err != nil {
		// 注意：这里不返回错误，因为订单已经成功保存到数据库
		// Redis操作失败不应该影响主要业务流程
	}

	// 返回成功响应
	response.Success(c, nil)
}

// matchNearestOrder 匹配距离司机最近的订单
func matchNearestOrder(driverLocation *DriverLocation) (*model.Order, error) {
	// 从Redis中获取等待司机接单的订单集合
	ctx := context.Background()
	redisClient := redis.RedisClient

	// 获取等待司机接单的订单ID集合
	orderIDs, err := redisClient.SMembers(ctx, "ride_orders:"+model.OrderStatusWaitingForDriver).Result()
	if err != nil {
		return nil, err
	}

	// 如果没有等待接单的订单，返回错误
	if len(orderIDs) == 0 {
		return nil, errors.New("没有等待接单的订单")
	}

	// 查找最近的订单
	var nearestOrder *model.Order
	minDistance := math.MaxFloat64

	// 遍历所有等待接单的订单
	for _, orderIDStr := range orderIDs {
		// 获取订单详细信息
		orderKey := fmt.Sprintf("ride_order:%s", orderIDStr)
		orderJSON, err := redisClient.Get(ctx, orderKey).Result()
		if err != nil {
			continue // 跳过无法获取的订单
		}

		// 反序列化订单数据
		var orderModel model.Order
		if err := json.Unmarshal([]byte(orderJSON), &orderModel); err != nil {
			continue // 跳过无法解析的订单
		}

		// 计算司机与订单路线点的最短距离
		distance := calculateDistanceToRoutePoints(
			driverLocation.Latitude, driverLocation.Longitude,
			orderModel.RoutePoints)

		// 更新最近的订单
		if distance < minDistance {
			minDistance = distance
			nearestOrder = &orderModel
		}
	}

	// 如果没有找到合适的订单，返回错误
	if nearestOrder == nil {
		return nil, errors.New("没有找到合适的订单")
	}

	return nearestOrder, nil
}

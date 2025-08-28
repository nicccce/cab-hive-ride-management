// Package ride provides the implementation of ride order management functionality.
// This includes creating immediate orders, retrieving order details, and managing order status in Redis.
package ride

import (
	"cab-hive/internal/global/database"
	"cab-hive/internal/global/jwt"
	"cab-hive/internal/global/redis"
	"cab-hive/internal/global/response"
	"cab-hive/internal/model"
	"context"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
	"gorm.io/gorm"
)

// CreateImmediateOrderRequest 定义创建立即出发订单的请求结构
type CreateImmediateOrderRequest struct {
	ID            uint            `json:"id"`
	Points        []model.LocationPoint `json:"points"`
	Distance      int             `json:"distance"`
	Duration      int             `json:"duration"`
	Tolls         float64         `json:"tolls"`
	Tags          []string        `json:"tags"`
	IsRecommended bool            `json:"isRecommended"`
	Restriction   Restriction     `json:"restriction"`
	Steps         []model.RouteStep     `json:"steps"`
	RawData       RawData         `json:"rawData"`
	StartLocation model.Location  `json:"startLocation"`
	EndLocation   model.Location  `json:"endLocation"`
}

// Restriction 定义限制信息结构
type Restriction struct {
	Status int `json:"status"`
}

// RawData 定义原始数据结构
type RawData struct {
	Mode              string          `json:"mode"`
	Distance          int             `json:"distance"`
	Duration          int             `json:"duration"`
	TrafficLightCount int             `json:"traffic_light_count"`
	Toll              int             `json:"toll"`
	Restriction       Restriction     `json:"restriction"`
	Polyline          []float64       `json:"polyline"`
	Steps             []model.RouteStep     `json:"steps"`
	Tags              []string        `json:"tags"`
	TaxiFare          TaxiFare        `json:"taxi_fare"`
}

// TaxiFare 定义出租车费用结构
type TaxiFare struct {
	Fare float64 `json:"fare"`
}

// CreateImmediateOrderResponse 定义创建立即出发订单的响应结构
type CreateImmediateOrderResponse struct {
	OrderID uint `json:"order_id"` // 订单ID
}

// OrderResponse 定义订单信息响应的结构体
type OrderResponse struct {
	ID             uint              `json:"id"`
	CreateTime     int64             `json:"create_time"`
	UpdateTime     int64             `json:"update_time"`
	UserOpenID     string            `json:"user_open_id"`
	DriverOpenID   string            `json:"driver_open_id"`
	VehicleID      uint              `json:"vehicle_id"`
	StartLocation  model.Location    `json:"start_location"`
	EndLocation    model.Location    `json:"end_location"`
	RoutePoints    []model.LocationPoint   `json:"route_points"`
	RouteData      model.RouteData   `json:"route_data"`
	StartTime      *string           `json:"start_time"`
	EndTime        *string           `json:"end_time"`
	Distance       float64           `json:"distance"`
	Duration       int               `json:"duration"`
	Fare           float64           `json:"fare"`
	Tolls          float64           `json:"tolls"`
	Status         string            `json:"status"`
	Comment        string            `json:"comment"`
	PaymentStatus  string            `json:"payment_status"`
	PaymentTime    *string           `json:"payment_time"`
	CancelReason   string            `json:"cancel_reason"`
	DriverRating   int               `json:"driver_rating"`
	UserRating     int               `json:"user_rating"`
	IsRecommended  bool              `json:"is_recommended"`
}

// CreateImmediateOrder 处理前端传来的立即出发订单内容
func CreateImmediateOrder(c *gin.Context) {
	// 定义请求结构体并绑定 JSON 数据
	var req CreateImmediateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Error("绑定创建订单请求失败", "error", err)
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

	// 从上下文中获取载荷
	payloadInterface, exists := c.Get("payload")
	if !exists {
		log.Error("无法获取载荷信息")
		response.Fail(c, response.ErrTokenInvalid)
		return
	}

	payload, ok := payloadInterface.(*jwt.Claims)
	if !ok {
		log.Error("载荷类型错误")
		response.Fail(c, response.ErrTokenInvalid)
		return
	}

	// 验证用户是否有权限创建订单
	if payload.RoleID != 1 && payload.RoleID != 2 {
		log.Error("用户角色无权限创建订单", "role_id", payload.RoleID)
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	// 转换路线数据
	routeData := model.RouteData{
		Distance:          req.RawData.Distance,
		Duration:          req.RawData.Duration,
		TrafficLightCount: req.RawData.TrafficLightCount,
		Toll:              req.RawData.Toll,
		RestrictionStatus: req.RawData.Restriction.Status,
		Polyline:          req.RawData.Polyline,
		Steps:             req.RawData.Steps,
		Tags:              req.RawData.Tags,
	}

	// 创建订单对象
	order := model.RideOrder{
		UserOpenID:        payload.OpenID,
		StartLocation:     req.StartLocation,
		EndLocation:       req.EndLocation,
		RoutePoints:       req.Points,
		RouteData:         routeData,
		Distance:          float64(req.Distance) / 1000, // 转换为公里
		Duration:          req.Duration,
		Fare:              req.RawData.TaxiFare.Fare,
		Tolls:             req.Tolls,
		Status:            model.OrderStatusWaitingForDriver, // 初始状态为等待司机接单
		PaymentStatus:     model.PaymentStatusPending,        // 初始支付状态为待支付
		IsRecommended:     req.IsRecommended,
	}

	// 保存订单到数据库
	if err := database.DB.Create(&order).Error; err != nil {
		log.Error("创建订单失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 将订单ID添加到Redis中对应状态的集合
	// 注意：结束待付款和已完结状态不需要在Redis中维护
	if err := AddOrderToRedisStatusSet(order.ID, order.Status); err != nil {
		log.Error("添加订单到Redis失败", "error", err, "order_id", order.ID)
		// 注意：这里不返回错误，因为订单已经成功保存到数据库
		// Redis操作失败不应该影响主要业务流程
	}

	// 构造响应数据
	resp := CreateImmediateOrderResponse{
		OrderID: order.ID,
	}

	// 返回成功响应
	log.Info("创建订单成功", "order_id", order.ID)
	response.Success(c, resp)
}

// RemoveOrderFromRedis 从Redis中移除订单
// 当订单状态改变时调用此函数
func RemoveOrderFromRedis(orderID uint, status string) error {
	redisClient := redis.RedisClient
	ctx := context.Background()

	// 从对应状态的集合中移除订单ID
	key := "ride_orders:" + status
	if err := redisClient.SRem(ctx, key, orderID).Err(); err != nil {
		return err
	}

	return nil
}

// AddOrderToRedisStatusSet 将订单添加到Redis中指定状态的集合
// 当订单状态改变时调用此函数
func AddOrderToRedisStatusSet(orderID uint, status string) error {
	redisClient := redis.RedisClient
	ctx := context.Background()

	// 结束待付款和已完结状态不需要在Redis中维护
	if status == model.OrderStatusWaitingForPayment || status == model.OrderStatusCompleted {
		return nil
	}

	// 添加订单ID到对应状态的集合
	key := "ride_orders:" + status
	if err := redisClient.SAdd(ctx, key, orderID).Err(); err != nil {
		return err
	}

	return nil
}

// GetOrder 处理查询订单信息请求
func GetOrder(c *gin.Context) {
	// 获取订单ID
	orderID := c.Param("id")
	if orderID == "" {
		log.Error("订单ID参数不能为空")
		response.Fail(c, response.ErrInvalidRequest)
		return
	}

	// 从ID中提取数字部分
	var orderIDNum uint
	fmt.Sscanf(orderID, "%d", &orderIDNum)

	// 从上下文中获取用户信息
	payload, exists := c.Get("payload")
	if !exists {
		log.Error("无法获取用户信息")
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	// 断言 payload 为 jwt.Claims 类型
	claims, ok := payload.(*jwt.Claims)
	if !ok {
		log.Error("用户信息类型错误")
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	// 查找订单
	var order model.RideOrder
	query := database.DB.Where("id = ?", orderIDNum)

	// 如果不是管理员，只查询当前用户的订单
	if claims.RoleID != 3 {
		query = query.Where("user_open_id = ?", claims.OpenID)
	}

	if err := query.First(&order).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Error("订单记录不存在", "id", orderIDNum)
			response.Fail(c, response.ErrNotFound)
		} else {
			log.Error("数据库查询失败", "error", err)
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
		}
		return
	}

	// 转换为响应格式
	orderResp := OrderResponse{
		ID:            order.ID,
		CreateTime:    order.CreateTime(),
		UpdateTime:    order.UpdateTime(),
		UserOpenID:    order.UserOpenID,
		DriverOpenID:  order.DriverOpenID,
		VehicleID:     order.VehicleID,
		StartLocation: order.StartLocation,
		EndLocation:   order.EndLocation,
		RoutePoints:   order.RoutePoints,
		RouteData:     order.RouteData,
		StartTime: func() *string {
			if order.StartTime != nil {
				formatted := order.StartTime.Format(time.RFC3339)
				return &formatted
			}
			return nil
		}(),
		EndTime: func() *string {
			if order.EndTime != nil {
				formatted := order.EndTime.Format(time.RFC3339)
				return &formatted
			}
			return nil
		}(),
		Distance:      order.Distance,
		Duration:      order.Duration,
		Fare:          order.Fare,
		Tolls:         order.Tolls,
		Status:        order.Status,
		Comment:       order.Comment,
		PaymentStatus: func() string {
			if order.PaymentStatus == "" {
				return "pending"
			}
			return order.PaymentStatus
		}(),
		PaymentTime: func() *string {
			if order.PaymentTime != nil {
				formatted := order.PaymentTime.Format(time.RFC3339)
				return &formatted
			}
			return nil
		}(),
		CancelReason:  order.CancelReason,
		DriverRating:  order.DriverRating,
		UserRating:    order.UserRating,
		IsRecommended: order.IsRecommended,
	}

	// 返回成功响应
	log.Info("查询订单详情成功", "id", orderIDNum)
	response.Success(c, orderResp)
}

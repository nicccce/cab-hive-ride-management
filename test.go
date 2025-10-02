






// Package order provides the implementation of order order management functionality.
// This includes creating immediate orders, retrieving order details, and managing order status in Redis.
package order

import (
	"cab-hive/internal/global/database"
	"cab-hive/internal/global/jwt"
	"cab-hive/internal/global/redis"
	"cab-hive/internal/global/response"
	"cab-hive/internal/model"
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
	go_redis "github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// CreateImmediateOrderRequest 定义创建立即出发订单的请求结构
type CreateImmediateOrderRequest struct {
	Points        []model.LocationPoint `json:"points"`
	Distance      int                   `json:"distance"`
	Duration      int                   `json:"duration"`
	Tolls         float64               `json:"tolls"`
	Tags          []string              `json:"tags"`
	Steps         []model.RouteStep     `json:"steps"`
	StartLocation model.Location        `json:"startLocation"`
	EndLocation   model.Location        `json:"endLocation"`
}

// CreateReserveOrderRequest 定义创建预约订单的请求结构
type CreateReserveOrderRequest struct {
	Points        []model.LocationPoint `json:"points"`
	Distance      int                   `json:"distance"`
	Duration      int                   `json:"duration"`
	Tolls         float64               `json:"tolls"`
	Tags          []string              `json:"tags"`
	Steps         []model.RouteStep     `json:"steps"`
	StartLocation model.Location        `json:"startLocation"`
	EndLocation   model.Location        `json:"endLocation"`
	ReserveTime   string                `json:"reserveTime"` // 预约时间
}

// Restriction 定义限制信息结构
type Restriction struct {
	Status int `json:"status"`
}

// RawData 定义原始数据结构
type RawData struct {
	Mode              string            `json:"mode"`
	Distance          int               `json:"distance"`
	Duration          int               `json:"duration"`
	TrafficLightCount int               `json:"traffic_light_count"`
	Toll              int               `json:"toll"`
	Restriction       Restriction       `json:"restriction"`
	Polyline          []float64         `json:"polyline"`
	Steps             []model.RouteStep `json:"steps"`
	Tags              []string          `json:"tags"`
	TaxiFare          TaxiFare          `json:"taxi_fare"`
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
	ReserveTime   *string              `json:"reserve_time"` // 预约时间
}

// OrderListResponse 定义订单列表响应的结构体
type OrderListResponse struct {
	Orders     []OrderResponse `json:"orders"`
	Pagination Pagination      `json:"pagination"`
}

// Pagination 定义分页信息的结构体
type Pagination struct {
	CurrentPage int   `json:"current_page"`
	PageSize    int   `json:"page_size"`
	TotalCount  int64 `json:"total_count"`
	TotalPages  int   `json:"total_pages"`
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

	// 检查用户是否有未完成的订单
	var unfinishedOrder model.Order
	err := database.DB.Where("user_open_id = ? AND status NOT IN (?, ?, ?)",
		payload.OpenID, model.OrderStatusCompleted, model.OrderStatusCancelled, model.OrderStatusReserved).
		First(&unfinishedOrder).Error

	// 如果找到了未完成的订单，拒绝创建新订单
	if err == nil {
		log.Error("用户有未完成的订单，拒绝创建新订单", "user_open_id", payload.OpenID, "order_id", unfinishedOrder.ID)
		response.Fail(c, response.ErrInvalidRequest.WithTips("用户有未完成的订单，无法创建新订单"))
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		// 如果是其他数据库错误，返回错误响应
		log.Error("数据库查询失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 创建订单对象
	now := time.Now()
	order := model.Order{
		UserOpenID:    payload.OpenID,
		StartLocation: req.StartLocation,
		EndLocation:   req.EndLocation,
		RoutePoints:   model.LocationPoints(req.Points),
		StartTime:     &now,
		Distance:      float64(req.Distance) / 1000, // 转换为公里
		Duration:      req.Duration,
		Fare:          req.Tolls,
		Status:        model.OrderStatusWaitingForDriver, // 初始状态为等待司机接单
	}

	// 保存订单到数据库
	if err := database.DB.Create(&order).Error; err != nil {
		log.Error("创建订单失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 将订单ID和内容添加到Redis中
	// 注意：结束待付款和已完结状态不需要在Redis中维护
	if err := AddOrderToRedisStatusSet(&order); err != nil {
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

// RemoveOrderFromRedis 从Redis中移除订单，包括状态集合、订单内容和地理位置索引
// 当订单状态改变时调用此函数
func RemoveOrderFromRedis(orderID uint, status string) error {
	redisClient := redis.RedisClient
	ctx := context.Background()

	// 开始事务
	pipe := redisClient.TxPipeline()

	// 1. 从对应状态的集合中移除订单ID
	statusKey := "ride_orders:" + status
	pipe.SRem(ctx, statusKey, orderID)

	// 2. 删除订单内容
	orderKey := fmt.Sprintf("ride_order:%d", orderID)
	pipe.Del(ctx, orderKey)

	// 3. 从地理位置索引中移除订单ID
	geoKey := "ride_orders_by_start_location"
	pipe.ZRem(ctx, geoKey, fmt.Sprintf("%d", orderID))

	// 执行事务
	if _, err := pipe.Exec(ctx); err != nil {
		return err
	}

	return nil
}

// AddOrderToRedisStatusSet 将订单添加到Redis中指定状态的集合，并存储订单内容和地理位置索引
// 当订单状态改变时调用此函数
func AddOrderToRedisStatusSet(order *model.Order) error {
	redisClient := redis.RedisClient
	ctx := context.Background()

	// 结束待付款和已完结状态不需要在Redis中维护
	if order.Status == model.OrderStatusWaitingForPayment || order.Status == model.OrderStatusCompleted {
		return nil
	}

	// 开始事务
	pipe := redisClient.TxPipeline()

	// 1. 添加订单ID到对应状态的集合
	statusKey := "ride_orders:" + order.Status
	pipe.SAdd(ctx, statusKey, order.ID)

	// 2. 存储订单内容到Hash
	orderKey := fmt.Sprintf("ride_order:%d", order.ID)
	orderBytes, err := json.Marshal(order)
	if err != nil {
		return err
	}
	pipe.Set(ctx, orderKey, string(orderBytes), 24*time.Hour) // 一天过期，过期后自动删除

	// 3. 添加订单ID和起始位置到地理位置索引
	geoKey := "ride_orders_by_start_location"
	pipe.GeoAdd(ctx, geoKey, &go_redis.GeoLocation{
		Name:      fmt.Sprintf("%d", order.ID),
		Longitude: order.StartLocation.Longitude,
		Latitude:  order.StartLocation.Latitude,
	})

	// 执行事务
	if _, err := pipe.Exec(ctx); err != nil {
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
	var order model.Order
	query := database.DB.Where("id = ?", orderID)

	// 如果不是管理员，查询相关订单
	if claims.RoleID != 3 {
		if claims.RoleID == 2 {
			// 司机角色，查询分配给该司机的订单或该司机作为用户创建的订单
			query = query.Where("driver_open_id = ? OR user_open_id = ?", claims.OpenID, claims.OpenID)
		} else {
			// 用户角色，查询该用户的订单
			query = query.Where("user_open_id = ?", claims.OpenID)
		}
	}

	if err := query.First(&order).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Error("订单记录不存在", "id", orderID)
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
		UserOpenID:    order.UserOpenID,
		DriverOpenID:  order.DriverOpenID,
		VehicleID:     order.VehicleID,
		StartLocation: order.StartLocation,
		EndLocation:   order.EndLocation,
		RoutePoints:   order.RoutePoints,
		StartTime: func() *string {
			if order.StartTime != nil {
				formatted := order.StartTime.Format("2006/01/02 15:04:05")
				return &formatted
			}
			return nil
		}(),
		EndTime: func() *string {
			if order.EndTime != nil {
				formatted := order.EndTime.Format("2006/01/02 15:04:05")
				return &formatted
			}
			return nil
		}(),
		Distance: order.Distance,
		Duration: order.Duration,
		Fare:     order.Fare,
		Status:   order.Status,
		Comment:  order.Comment,
		PaymentTime: func() *string {
			if order.PaymentTime != nil {
				formatted := order.PaymentTime.Format("2006/01/02 15:04:05")
				return &formatted
			}
			return nil
		}(),
		CancelReason: order.CancelReason,
		Rating:       order.Rating,
		ReserveTime: func() *string {
			if order.ReserveTime != nil {
				formatted := order.ReserveTime.Format("2006/01/02 15:04:05")
				return &formatted
			}
			return nil
		}(),
	}

	// 返回成功响应
	log.Info("查询订单详情成功", "id", orderID)
	response.Success(c, orderResp)
}

// GetUnfinishedOrder 处理查询用户未完成订单请求
func GetUnfinishedOrder(c *gin.Context) {
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

	// 查询用户未完成的订单
	// 未完成订单指的是状态不是"completed"也不是"cancelled"也不是"reserved"的订单
	var order model.Order
	err := database.DB.Where("user_open_id = ? AND status NOT IN (?, ?, ?)",
		claims.OpenID, model.OrderStatusCompleted, model.OrderStatusCancelled, model.OrderStatusReserved).
		First(&order).Error

	// 如果没有找到未完成的订单，返回空
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Info("用户没有未完成的订单", "user_open_id", claims.OpenID)
			response.Success(c, nil)
			return
		} else {
			log.Error("数据库查询失败", "error", err)
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
			return
		}
	}

	// 转换为响应格式
	orderResp := OrderResponse{
		ID:            order.ID,
		UserOpenID:    order.UserOpenID,
		DriverOpenID:  order.DriverOpenID,
		VehicleID:     order.VehicleID,
		StartLocation: order.StartLocation,
		EndLocation:   order.EndLocation,
		RoutePoints:   order.RoutePoints,
		StartTime: func() *string {
			if order.StartTime != nil {
				formatted := order.StartTime.Format("2006/01/02 15:04:05")
				return &formatted
			}
			return nil
		}(),
		EndTime: func() *string {
			if order.EndTime != nil {
				formatted := order.EndTime.Format("2006/01/02 15:04:05")
				return &formatted
			}
			return nil
		}(),
		Distance: order.Distance,
		Duration: order.Duration,
		Fare:     order.Fare,
		Status:   order.Status,
		Comment:  order.Comment,
		PaymentTime: func() *string {
			if order.PaymentTime != nil {
				formatted := order.PaymentTime.Format("2006/01/02 15:04:05")
				return &formatted
			}
			return nil
		}(),
		CancelReason: order.CancelReason,
		Rating:       order.Rating,
		ReserveTime: func() *string {
			if order.ReserveTime != nil {
				formatted := order.ReserveTime.Format("2006/01/02 15:04:05")
				return &formatted
			}
			return nil
		}(),
	}

	// 返回成功响应
	log.Info("查询用户未完成订单成功", "user_open_id", claims.OpenID, "order_id", order.ID)
	response.Success(c, orderResp)
}

// GetDriverUnfinishedOrder 处理查询司机未完成订单请求
func GetDriverUnfinishedOrder(c *gin.Context) {
	// 从上下文中获取司机信息
	payload, exists := c.Get("payload")
	if !exists {
		log.Error("无法获取司机信息")
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	// 断言 payload 为 jwt.Claims 类型
	claims, ok := payload.(*jwt.Claims)
	if !ok {
		log.Error("司机信息类型错误")
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	// 查询司机未完成的订单
	// 未完成订单指的是状态不是"completed"也不是"cancelled"的订单
	var order model.Order
	err := database.DB.Where("driver_open_id = ? AND status IN (?, ?, ?)",
		claims.OpenID,
		model.OrderStatusWaitingForPickup,
		model.OrderStatusDriverArrived,
		model.OrderStatusInProgress).
		First(&order).Error

	// 如果没有找到未完成的订单，返回空
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Info("司机没有未完成的订单", "driver_open_id", claims.OpenID)
			response.Success(c, nil)
			return
		} else {
			log.Error("数据库查询失败", "error", err)
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
			return
		}
	}

	// 转换为响应格式
	orderResp := OrderResponse{
		ID:            order.ID,
		UserOpenID:    order.UserOpenID,
		DriverOpenID:  order.DriverOpenID,
		VehicleID:     order.VehicleID,
		StartLocation: order.StartLocation,
		EndLocation:   order.EndLocation,
		RoutePoints:   order.RoutePoints,
		StartTime: func() *string {
			if order.StartTime != nil {
				formatted := order.StartTime.Format("2006/01/02 15:04:05")
				return &formatted
			}
			return nil
		}(),
		EndTime: func() *string {
			if order.EndTime != nil {
				formatted := order.EndTime.Format("2006/01/02 15:04:05")
				return &formatted
			}
			return nil
		}(),
		Distance: order.Distance,
		Duration: order.Duration,
		Fare:     order.Fare,
		Status:   order.Status,
		Comment:  order.Comment,
		PaymentTime: func() *string {
			if order.PaymentTime != nil {
				formatted := order.PaymentTime.Format("2006/01/02 15:04:05")
				return &formatted
			}
			return nil
		}(),
		CancelReason: order.CancelReason,
		Rating:       order.Rating,
		ReserveTime: func() *string {
			if order.ReserveTime != nil {
				formatted := order.ReserveTime.Format("2006/01/02 15:04:05")
				return &formatted
			}
			return nil
		}(),
	}

	// 返回成功响应
	log.Info("查询司机未完成订单成功", "driver_open_id", claims.OpenID, "order_id", order.ID)
	response.Success(c, orderResp)
}

// CancelOrder 处理取消订单请求
func CancelOrder(c *gin.Context) {
	// 获取订单ID
	orderID := c.Param("id")
	if orderID == "" {
		log.Error("订单ID参数不能为空")
		response.Fail(c, response.ErrInvalidRequest)
		return
	}

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
	var order model.Order
	if err := database.DB.Where("id = ?", orderID).First(&order).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Error("订单记录不存在", "id", orderID)
			response.Fail(c, response.ErrNotFound)
		} else {
			log.Error("数据库查询失败", "error", err)
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
		}
		return
	}

	// 验证订单是否属于当前用户
	if order.UserOpenID != claims.OpenID {
		log.Error("订单不属于当前用户", "order_user_open_id", order.UserOpenID, "user_open_id", claims.OpenID)
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	// 验证订单状态是否为等待司机接单
	if order.Status != model.OrderStatusWaitingForDriver {
		log.Error("订单状态不是等待司机接单，无法取消", "order_status", order.Status)
		response.Fail(c, response.ErrInvalidRequest.WithTips("订单状态不是等待司机接单，无法取消"))
		return
	}

	// 更新订单状态为已取消
	now := time.Now()
	order.Status = model.OrderStatusCancelled
	order.CancelReason = "用户取消"
	order.EndTime = &now

	if err := database.DB.Save(&order).Error; err != nil {
		log.Error("更新订单状态失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 从Redis中移除订单
	if err := RemoveOrderFromRedis(order.ID, model.OrderStatusWaitingForDriver); err != nil {
		log.Error("从Redis移除订单失败", "error", err, "order_id", order.ID)
		// 注意：这里不返回错误，因为订单已经成功更新到数据库
	}

	// 返回成功响应
	log.Info("取消订单成功", "order_id", order.ID)
	response.Success(c, nil)
}

// GetUserOrders 处理查询用户所有订单请求（支持分页和条件查询）
func GetUserOrders(c *gin.Context) {
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

	// 获取查询参数
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")
	status := c.Query("status")
	startTime := c.Query("start_time")
	endTime := c.Query("end_time")

	// 解析分页参数
	pageNum := 1
	size := 10
	fmt.Sscanf(page, "%d", &pageNum)
	fmt.Sscanf(pageSize, "%d", &size)

	// 构建查询条件
	query := database.DB.Model(&model.Order{}).Where("user_open_id = ?", claims.OpenID)

	// 添加状态查询条件
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 添加时间范围查询条件
	if startTime != "" {
		query = query.Where("start_time >= ?", startTime)
	}
	if endTime != "" {
		query = query.Where("start_time <= ?", endTime)
	}

	// 计算总数
	var total int64
	query.Count(&total)

	// 计算偏移量
	offset := (pageNum - 1) * size

	// 查询订单列表
	var orders []model.Order
	if err := query.Offset(offset).Limit(size).Order("id DESC").Find(&orders).Error; err != nil {
		log.Error("查询用户订单列表失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 转换为响应格式
	orderList := make([]OrderResponse, len(orders))
	for i, order := range orders {
		orderList[i] = OrderResponse{
			ID:            order.ID,
			UserOpenID:    order.UserOpenID,
			DriverOpenID:  order.DriverOpenID,
			VehicleID:     order.VehicleID,
			StartLocation: order.StartLocation,
			EndLocation:   order.EndLocation,
			RoutePoints:   order.RoutePoints,
			StartTime: func() *string {
				if order.StartTime != nil {
					formatted := order.StartTime.Format("2006/01/02 15:04:05")
					return &formatted
				}
				return nil
			}(),
			EndTime: func() *string {
				if order.EndTime != nil {
					formatted := order.EndTime.Format("2006/01/02 15:04:05")
					return &formatted
				}
				return nil
			}(),
			Distance: order.Distance,
			Duration: order.Duration,
			Fare:     order.Fare,
			Status:   order.Status,
			Comment:  order.Comment,
			PaymentTime: func() *string {
				if order.PaymentTime != nil {
					formatted := order.PaymentTime.Format("2006/01/02 15:04:05")
					return &formatted
				}
				return nil
			}(),
			CancelReason: order.CancelReason,
			Rating:       order.Rating,
			ReserveTime: func() *string {
				if order.ReserveTime != nil {
					formatted := order.ReserveTime.Format("2006/01/02 15:04:05")
					return &formatted
				}
				return nil
			}(),
		}
	}

	// 计算总页数
	totalPages := int((total + int64(size) - 1) / int64(size))

	// 构造响应数据
	resp := OrderListResponse{
		Orders: orderList,
		Pagination: Pagination{
			CurrentPage: pageNum,
			PageSize:    size,
			TotalCount:  total,
			TotalPages:  totalPages,
		},
	}

	// 返回成功响应
	log.Info("查询用户订单列表成功", "user_open_id", claims.OpenID, "total", total)
	response.Success(c, resp)
}

// CreateReserveOrder 处理前端传来的预约订单内容
func CreateReserveOrder(c *gin.Context) {
	// 定义请求结构体并绑定 JSON 数据
	var req CreateReserveOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Error("绑定创建预约订单请求失败", "error", err)
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

	// 解析预约时间
	reserveTime, err := time.Parse("2006-01-02 15:04:05", req.ReserveTime)
	if err != nil {
		log.Error("解析预约时间失败", "error", err)
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

	// 检查预约时间是否在当前时间之后
	if reserveTime.Before(time.Now()) {
		log.Error("预约时间不能早于当前时间")
		response.Fail(c, response.ErrInvalidRequest.WithTips("预约时间不能早于当前时间"))
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

	// 检查用户是否有未完成的订单
	var unfinishedOrder model.Order
	err = database.DB.Where("user_open_id = ? AND status NOT IN (?, ?, ?)",
		payload.OpenID, model.OrderStatusCompleted, model.OrderStatusCancelled, model.OrderStatusReserved).
		First(&unfinishedOrder).Error

	// 如果找到了未完成的订单，拒绝创建新订单
	if err == nil {
		log.Error("用户有未完成的订单，拒绝创建新订单", "user_open_id", payload.OpenID, "order_id", unfinishedOrder.ID)
		response.Fail(c, response.ErrInvalidRequest.WithTips("用户有未完成的订单，无法创建新订单"))
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		// 如果是其他数据库错误，返回错误响应
		log.Error("数据库查询失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 创建订单对象
	order := model.Order{
		UserOpenID:    payload.OpenID,
		StartLocation: req.StartLocation,
		EndLocation:   req.EndLocation,
		RoutePoints:   model.LocationPoints(req.Points),
		ReserveTime:   &reserveTime,
		Distance:      float64(req.Distance) / 1000, // 转换为公里
		Duration:      req.Duration,
		Fare:          req.Tolls,
		Status:        model.OrderStatusReserved, // 初始状态为预约中
	}

	// 保存订单到数据库
	if err := database.DB.Create(&order).Error; err != nil {
		log.Error("创建预约订单失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 将订单ID和内容添加到Redis中
	// 注意：结束待付款和已完结状态不需要在Redis中维护
	if err := AddOrderToRedisStatusSet(&order); err != nil {
		log.Error("添加预约订单到Redis失败", "error", err, "order_id", order.ID)
		// 注意：这里不返回错误，因为订单已经成功保存到数据库
		// Redis操作失败不应该影响主要业务流程
	}

	// 构造响应数据
	resp := CreateImmediateOrderResponse{
		OrderID: order.ID,
	}

	// 返回成功响应
	log.Info("创建预约订单成功", "order_id", order.ID)
	response.Success(c, resp)
}

// GetDriverOrders 处理查询司机所有订单请求（支持分页和条件查询）
func GetDriverOrders(c *gin.Context) {
	// 从上下文中获取司机信息
	payload, exists := c.Get("payload")
	if !exists {
		log.Error("无法获取司机信息")
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	// 断言 payload 为 jwt.Claims 类型
	claims, ok := payload.(*jwt.Claims)
	if !ok {
		log.Error("司机信息类型错误")
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	// 获取查询参数
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")
	status := c.Query("status")
	startTime := c.Query("start_time")
	endTime := c.Query("end_time")

	// 解析分页参数
	pageNum := 1
	size := 10
	fmt.Sscanf(page, "%d", &pageNum)
	fmt.Sscanf(pageSize, "%d", &size)

	// 构建查询条件
	query := database.DB.Model(&model.Order{}).Where("driver_open_id = ?", claims.OpenID)

	// 添加状态查询条件
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 添加时间范围查询条件
	if startTime != "" {
		query = query.Where("start_time >= ?", startTime)
	}
	if endTime != "" {
		query = query.Where("start_time <= ?", endTime)
	}

	// 计算总数
	var total int64
	query.Count(&total)

	// 计算偏移量
	offset := (pageNum - 1) * size

	// 查询订单列表
	var orders []model.Order
	if err := query.Offset(offset).Limit(size).Order("id DESC").Find(&orders).Error; err != nil {
		log.Error("查询司机订单列表失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 转换为响应格式
	orderList := make([]OrderResponse, len(orders))
	for i, order := range orders {
		orderList[i] = OrderResponse{
			ID:            order.ID,
			UserOpenID:    order.UserOpenID,
			DriverOpenID:  order.DriverOpenID,
			VehicleID:     order.VehicleID,
			StartLocation: order.StartLocation,
			EndLocation:   order.EndLocation,
			RoutePoints:   order.RoutePoints,
			StartTime: func() *string {
				if order.StartTime != nil {
					formatted := order.StartTime.Format("2006/01/02 15:04:05")
					return &formatted
				}
				return nil
			}(),
			EndTime: func() *string {
				if order.EndTime != nil {
					formatted := order.EndTime.Format("2006/01/02 15:04:05")
					return &formatted
				}
				return nil
			}(),
			Distance: order.Distance,
			Duration: order.Duration,
			Fare:     order.Fare,
			Status:   order.Status,
			Comment:  order.Comment,
			PaymentTime: func() *string {
				if order.PaymentTime != nil {
					formatted := order.PaymentTime.Format("2006/01/02 15:04:05")
					return &formatted
				}
				return nil
			}(),
			CancelReason: order.CancelReason,
			Rating:       order.Rating,
			ReserveTime: func() *string {
				if order.ReserveTime != nil {
					formatted := order.ReserveTime.Format("2006/01/02 15:04:05")
					return &formatted
				}
				return nil
			}(),
		}
	}

	// 计算总页数
	totalPages := int((total + int64(size) - 1) / int64(size))

	// 构造响应数据
	resp := OrderListResponse{
		Orders: orderList,
		Pagination: Pagination{
			CurrentPage: pageNum,
			PageSize:    size,
			TotalCount:  total,
			TotalPages:  totalPages,
		},
	}

	// 返回成功响应
	log.Info("查询司机订单列表成功", "driver_open_id", claims.OpenID, "total", total)
	response.Success(c, resp)
}

// GetAllOrders 处理管理员查询所有订单请求（支持分页和条件查询）
func GetAllOrders(c *gin.Context) {
	// 获取查询参数
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")
	status := c.Query("status")
	userOpenID := c.Query("user_open_id")
	driverOpenID := c.Query("driver_open_id")
	startTime := c.Query("start_time")
	endTime := c.Query("end_time")

	// 解析分页参数
	pageNum := 1
	size := 10
	fmt.Sscanf(page, "%d", &pageNum)
	fmt.Sscanf(pageSize, "%d", &size)

	// 构建查询条件
	query := database.DB.Model(&model.Order{})

	// 添加状态查询条件
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 添加用户OpenID查询条件
	if userOpenID != "" {
		query = query.Where("user_open_id = ?", userOpenID)
	}

	// 添加司机OpenID查询条件
	if driverOpenID != "" {
		query = query.Where("driver_open_id = ?", driverOpenID)
	}

	// 添加时间范围查询条件
	if startTime != "" {
		query = query.Where("start_time >= ?", startTime)
	}
	if endTime != "" {
		query = query.Where("start_time <= ?", endTime)
	}

	// 计算总数
	var total int64
	query.Count(&total)

	// 计算偏移量
	offset := (pageNum - 1) * size

	// 查询订单列表
	var orders []model.Order
	if err := query.Offset(offset).Limit(size).Order("id DESC").Find(&orders).Error; err != nil {
		log.Error("查询所有订单列表失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 转换为响应格式
	orderList := make([]OrderResponse, len(orders))
	for i, order := range orders {
		orderList[i] = OrderResponse{
			ID:            order.ID,
			UserOpenID:    order.UserOpenID,
			DriverOpenID:  order.DriverOpenID,
			VehicleID:     order.VehicleID,
			StartLocation: order.StartLocation,
			EndLocation:   order.EndLocation,
			RoutePoints:   order.RoutePoints,
			StartTime: func() *string {
				if order.StartTime != nil {
					formatted := order.StartTime.Format("2006/01/02 15:04:05")
					return &formatted
				}
				return nil
			}(),
			EndTime: func() *string {
				if order.EndTime != nil {
					formatted := order.EndTime.Format("2006/01/02 15:04:05")
					return &formatted
				}
				return nil
			}(),
			Distance: order.Distance,
			Duration: order.Duration,
			Fare:     order.Fare,
			Status:   order.Status,
			Comment:  order.Comment,
			PaymentTime: func() *string {
				if order.PaymentTime != nil {
					formatted := order.PaymentTime.Format("2006/01/02 15:04:05")
					return &formatted
				}
				return nil
			}(),
			CancelReason: order.CancelReason,
			Rating:       order.Rating,
			ReserveTime: func() *string {
				if order.ReserveTime != nil {
					formatted := order.ReserveTime.Format("2006/01/02 15:04:05")
					return &formatted
				}
				return nil
			}(),
		}
	}

	// 计算总页数
	totalPages := int((total + int64(size) - 1) / int64(size))

	// 构造响应数据
	resp := OrderListResponse{
		Orders: orderList,
		Pagination: Pagination{
			CurrentPage: pageNum,
			PageSize:    size,
			TotalCount:  total,
			TotalPages:  totalPages,
		},
	}

	// 返回成功响应
	log.Info("查询所有订单列表成功", "total", total)
	response.Success(c, resp)
}

type T struct {
	Id     int `json:"id"`
	Points []struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
	} `json:"points"`
	Distance      int           `json:"distance"`
	Duration      int           `json:"duration"`
	Tolls         int           `json:"tolls"`
	Tags          []interface{} `json:"tags"`
	IsRecommended bool          `json:"isRecommended"`
	Restriction   struct {
		Status int `json:"status"`
	} `json:"restriction"`
	Steps []struct {
		Instruction     string `json:"instruction"`
		PolylineIdx     []int  `json:"polyline_idx"`
		RoadName        string `json:"road_name"`
		DirDesc         string `json:"dir_desc"`
		Distance        int    `json:"distance"`
		ActDesc         string `json:"act_desc"`
		AccessorialDesc string `json:"accessorial_desc"`
	} `json:"steps"`
	RawData struct {
		Mode              string `json:"mode"`
		Distance          int    `json:"distance"`
		Duration          int    `json:"duration"`
		TrafficLightCount int    `json:"traffic_light_count"`
		Toll              int    `json:"toll"`
		Restriction       struct {
			Status int `json:"status"`
		} `json:"restriction"`
		Polyline []float64 `json:"polyline"`
		Steps    []struct {
			Instruction     string `json:"instruction"`
			PolylineIdx     []int  `json:"polyline_idx"`
			RoadName        string `json:"road_name"`
			DirDesc         string `json:"dir_desc"`
			Distance        int    `json:"distance"`
			ActDesc         string `json:"act_desc"`
			AccessorialDesc string `json:"accessorial_desc"`
		} `json:"steps"`
		Tags     []interface{} `json:"tags"`
		TaxiFare struct {
			Fare int `json:"fare"`
		} `json:"taxi_fare"`
	} `json:"rawData"`
	StartLocation struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
		Name      string  `json:"name"`
	} `json:"startLocation"`
	EndLocation struct {
		Name      string  `json:"name"`
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
		Address   string  `json:"address"`
		Province  string  `json:"province"`
		City      string  `json:"city"`
		District  string  `json:"district"`
	} `json:"endLocation"`
}



func vectorSearch(query string, threshold float64) ([]KnowledgeItem, error) {
    // 生成查询向量
    embedding, err := openAI.GenerateEmbedding(query)
    if err != nil {
        return nil, err
    }
    
    // 执行向量搜索
    var results []KnowledgeItem
    err = db.Raw(`
        SELECT id, content, 
               1 - (embedding <=> ?) AS similarity
        FROM knowledge_vectors
        WHERE 1 - (embedding <=> ?) > ?
        ORDER BY similarity DESC
        LIMIT 5
    `, pgvector.NewVector(embedding), threshold).Scan(&results).Error
    
    return results, err
}





pipe := redisClient.TxPipeline()
pipe.SRem("ride_orders:waiting_for_driver", orderID)
pipe.SAdd("ride_orders:in_progress", orderID)
pipe.Set(fmt.Sprintf("ride_order:%s", orderID), jsonData, 24*time.Hour)
_, err := pipe.Exec()







func updateOrderStatus(orderID string, newStatus string) error {
    // 1. 更新数据库
    if err := db.UpdateOrderStatus(orderID, newStatus); err != nil {
        log.Error("DB update failed", err)
        return err
    }
    
    // 2. 更新缓存
    if err := cache.UpdateOrderStatus(orderID, newStatus); err != nil {
        log.Warn("Cache update failed", err)
        // 继续执行，不阻断主流程
    }
    
    return nil
}


const basePromptTemplate = 
`作为{{.Platform}}的AI客服，您的身份是{{.Role}}。
当前时间：{{.Time}}
用户信息：{{.UserProfile}}

对话历史：
{{.History}}

请回答以下问题：
{{.Query}}`

type Conversation struct {
    MaxTokens    int
    Messages     []Message
    TotalTokens  int
}

func (c *Conversation) AddMessage(msg Message) error {
    tokens := estimateTokens(msg.Content)
    if c.TotalTokens+tokens > c.MaxTokens {
        return errors.New("exceed token limit")
    }
    
    c.Messages = append(c.Messages, msg)
    c.TotalTokens += tokens
    
    // 修剪超出部分
    for c.TotalTokens > c.MaxTokens && len(c.Messages) > 0 {
        removed := c.Messages[0]
        c.Messages = c.Messages[1:]
        c.TotalTokens -= estimateTokens(removed.Content)
    }
    
    return nil
}




// DynamicPromptBuilder 动态Prompt构建器
type DynamicPromptBuilder struct {
    UserService    UserService
    OrderService   OrderService
    ConfigService  ConfigService
    KnowledgeBase  KnowledgeBase
}

// BuildPrompt 构建完整Prompt
func (b *DynamicPromptBuilder) BuildPrompt(ctx context.Context, userID string, message string) (string, error) {
    // 获取用户信息
    user, err := b.UserService.GetUser(ctx, userID)
    if err != nil {
        return "", fmt.Errorf("获取用户信息失败: %w", err)
    }

    // 获取用户最近订单
    orders, err := b.OrderService.GetRecentOrders(ctx, userID, 3)
    if err != nil {
        return "", fmt.Errorf("获取订单信息失败: %w", err)
    }

    // 获取对话历史
    history, err := b.UserService.GetChatHistory(ctx, userID, 5)
    if err != nil {
        return "", fmt.Errorf("获取对话历史失败: %w", err)
    }

    // 获取系统配置
    config := b.ConfigService.GetConfig()

    // 构建Prompt模板
    prompt := b.buildTemplate(user, orders, history, message, config)
    
    // 知识库增强
    if enhanced, err := b.enhanceWithKnowledge(message); err == nil {
        prompt += "\n\n相关背景知识：" + enhanced
    }

    return prompt, nil
}

// buildTemplate 构建基础Prompt模板
func (b *DynamicPromptBuilder) buildTemplate(user User, orders []Order, history []ChatMessage, message string, config Config) string {
    var builder strings.Builder

    // 系统角色设定
    builder.WriteString(fmt.Sprintf("你是一个专业的网约车服务平台（%s）的AI客服助手。\n", config.PlatformName))
    builder.WriteString("当前系统版本：" + config.Version + "\n")
    builder.WriteString(fmt.Sprintf("当前时间：%s\n\n", time.Now().Format("2006-01-02 15:04:05")))

    // 用户上下文
    builder.WriteString("## 用户信息\n")
    builder.WriteString(fmt.Sprintf("- 用户ID：%s\n", user.ID))
    builder.WriteString(fmt.Sprintf("- 用户类型：%s\n", user.Type))
    if user.Type == "driver" {
        builder.WriteString(fmt.Sprintf("- 司机评分：%.1f/5.0\n", user.DriverRating))
    }

    // 订单上下文
    if len(orders) > 0 {
        builder.WriteString("\n## 最近订单\n")
        for _, order := range orders {
            builder.WriteString(fmt.Sprintf("- 订单ID：%s 状态：%s 时间：%s\n", 
                order.ID, order.Status, order.CreatedAt.Format("2006-01-02 15:04")))
        }
    }

    // 对话历史
    if len(history) > 0 {
        builder.WriteString("\n## 对话历史\n")
        for _, msg := range history {
            builder.WriteString(fmt.Sprintf("%s [%s]: %s\n", 
                msg.Timestamp.Format("15:04"), msg.Role, msg.Content))
        }
    }

    // 当前问题
    builder.WriteString("\n## 当前问题\n")
    builder.WriteString(message)

    return builder.String()
}

// enhanceWithKnowledge 知识库增强
func (b *DynamicPromptBuilder) enhanceWithKnowledge(query string) (string, error) {
    // 生成查询向量
    embedding, err := b.KnowledgeBase.GenerateEmbedding(query)
    if err != nil {
        return "", fmt.Errorf("生成向量失败: %w", err)
    }

    // 查询相关知识
    results, err := b.KnowledgeBase.Search(embedding, 0.7, 3)
    if err != nil {
        return "", fmt.Errorf("知识检索失败: %w", err)
    }

    if len(results) == 0 {
        return "", nil
    }

    var builder strings.Builder
    builder.WriteString("以下是与问题相关的知识库内容：\n")
    for _, item := range results {
        builder.WriteString(fmt.Sprintf("- %s (相似度: %.2f)\n", item.Content, item.Similarity))
    }

    return builder.String(), nil
}





















// 获取分布式锁（带重试机制）
func AcquireLock(ctx context.Context, key string, value string, ttl time.Duration) (bool, error) {
    for i := 0; i < 3; i++ {
        ok, err := redisClient.SetNX(ctx, key, value, ttl).Result()
        if err == nil && ok {
            return true, nil
        }
        time.Sleep(time.Duration(math.Pow(2, float64(i))) * time.Millisecond)
    }
    return false, errors.New("acquire lock failed")
}

// 释放锁（Lua脚本保证原子性）
func ReleaseLock(ctx context.Context, key string, value string) error {
    script := `
    if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
    else
        return 0
    end`
    _, err := redisClient.Eval(ctx, script, []string{key}, value).Result()
    return err
}


func TakeOrder(c *gin.Context) {
    req := parseRequest(c)
    
    // 获取订单锁
    orderLock := fmt.Sprintf("order:lock:%d", req.OrderID)
    lockValue := generateLockValue()
    
    acquired, err := AcquireLock(c, orderLock, lockValue, 30*time.Second)
    if !acquired || err != nil {
        response.Fail(c, response.ErrConcurrentConflict)
        return
    }
    defer ReleaseLock(c, orderLock, lockValue)
    
    // 检查订单状态
    order, err := orderService.GetOrder(req.OrderID)
    if err != nil || order.Status != model.OrderStatusWaiting {
        response.Fail(c, response.ErrOrderNotAvailable)
        return
    }
    
    // 更新订单状态（事务处理）
    if err := orderService.AssignOrder(req.OrderID, req.DriverID); err != nil {
        response.Fail(c, response.ErrSystemError)
        return
    }
    
    response.Success(c)
}


func retryOperation(fn func() error, maxRetries int) error {
    var err error
    for i := 0; i < maxRetries; i++ {
        if err = fn(); err == nil {
            return nil
        }
        backoff := time.Duration(i+1) * 100 * time.Millisecond
        time.Sleep(backoff)
    }
    return err
}



// 设置TTL
const (
    defaultLockTTL = 30 * time.Second
    lockRenewInterval = 10 * time.Second
)

// 锁续期协程
go func() {
    ticker := time.NewTicker(lockRenewInterval)
    defer ticker.Stop()
    for range ticker.C {
        if !redisClient.Expire(ctx, lockKey, defaultLockTTL).Val() {
            break
        }
    }
}()



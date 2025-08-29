package ride

import (
	"cab-hive/internal/global/jwt"
	"cab-hive/internal/global/redis"
	"cab-hive/internal/global/response"
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
)

// DriverLocation 定义司机位置信息结构体
type DriverLocation struct {
	OpenID      string  `json:"open_id"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	UpdateTime  int64   `json:"update_time"`
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
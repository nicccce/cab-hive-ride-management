package admin

import (
	"cab-hive/internal/global/database"
	"cab-hive/internal/global/redis"
	"cab-hive/internal/model"
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/pkg/errors"
	"gorm.io/gorm"
)

// CheckOrderTimeout 检查订单超时情况
func CheckOrderTimeout() {
	// 从Redis中获取所有状态为OrderStatusInProgress的订单
	ctx := context.Background()
	redisClient := redis.RedisClient

	// 获取进行中订单的ID集合
	orderIDs, err := redisClient.SMembers(ctx, "ride_orders:"+model.OrderStatusInProgress).Result()
	if err != nil {
		log.Error("获取Redis中进行中的订单失败", "error", err)
		return
	}

	// 如果没有进行中的订单，直接返回
	if len(orderIDs) == 0 {
		return
	}

	// 检查每个订单的超时情况
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

		// 检查订单是否超时
		if isOrderTimeout(&orderModel) {
			// 创建预警信息
			content := fmt.Sprintf("订单 %d 超时，司机 %s 超过10分钟未更新位置",
				orderModel.ID, orderModel.DriverOpenID)
			if err := CreateAlert(orderModel.ID, content, "order_timeout"); err != nil {
				log.Error("创建订单超时预警失败", "error", err)
			}
		}
	}
}

// isOrderTimeout 检查订单是否超时
func isOrderTimeout(order *model.Order) bool {
	// 获取司机OpenID
	driverOpenID := order.DriverOpenID
	if driverOpenID == "" {
		return false
	}

	// 从Redis中获取司机位置信息
	driverLocationKey := fmt.Sprintf("driver:location:%s", driverOpenID)
	ctx := context.Background()
	redisClient := redis.RedisClient

	locationJSON, err := redisClient.Get(ctx, driverLocationKey).Result()
	if err != nil {
		// 如果Redis中没有司机位置信息，则使用订单开始时间
		if order.StartTime != nil {
			// 检查订单开始时间是否超过10分钟
			return time.Since(*order.StartTime) > 10*time.Minute
		}
		return false
	}

	// 反序列化司机位置信息
	var driverLocation struct {
		UpdateTime int64 `json:"update_time"`
	}
	if err := json.Unmarshal([]byte(locationJSON), &driverLocation); err != nil {
		// 如果解析失败，则使用订单开始时间
		if order.StartTime != nil {
			return time.Since(*order.StartTime) > 10*time.Minute
		}
		return false
	}

	// 检查司机位置更新时间是否超过10分钟
	lastUpdateTime := time.Unix(driverLocation.UpdateTime, 0)
	return time.Since(lastUpdateTime) > 10*time.Minute
}
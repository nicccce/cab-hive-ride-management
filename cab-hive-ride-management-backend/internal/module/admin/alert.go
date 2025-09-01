package admin

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
	"gorm.io/gorm"
)

// AlertResponse 预警信息响应结构
type AlertResponse struct {
	ID          uint      `json:"id"`
	OrderID     uint      `json:"order_id"`
	Content     string    `json:"content"`
	AlertTime   time.Time `json:"alert_time"`
	IsProcessed bool      `json:"is_processed"`
	ProcessNote string    `json:"process_note"`
	AlertType   string    `json:"alert_type"`
}

// AlertListResponse 预警列表响应结构
type AlertListResponse struct {
	Alerts     []AlertResponse `json:"alerts"`
	Pagination Pagination      `json:"pagination"`
}

// Pagination 分页信息结构
type Pagination struct {
	CurrentPage int   `json:"current_page"`
	PageSize    int   `json:"page_size"`
	TotalCount  int64 `json:"total_count"`
	TotalPages  int   `json:"total_pages"`
}

// CreateAlert 创建预警信息
func CreateAlert(orderID uint, content string, alertType string) error {
	// 检查是否已存在未处理的预警
	var existingAlert model.Alert
	err := database.DB.Where("order_id = ? AND is_processed = false", orderID).First(&existingAlert).Error

	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		// 数据库查询出错
		return err
	}

	// 如果存在未处理的预警，则更新它
	if err == nil {
		// 更新现有预警
		existingAlert.Content = content
		existingAlert.AlertTime = time.Now()
		existingAlert.AlertType = alertType
		if err := database.DB.Save(&existingAlert).Error; err != nil {
			return err
		}
		// 不需要添加到Redis，因为已经存在
		return nil
	}

	// 创建新的预警
	alert := model.Alert{
		OrderID:     orderID,
		Content:     content,
		AlertTime:   time.Now(),
		IsProcessed: false,
		AlertType:   alertType,
	}

	// 保存到数据库
	if err := database.DB.Create(&alert).Error; err != nil {
		return err
	}

	// 添加到Redis
	redisClient := redis.RedisClient
	ctx := context.Background()
	alertKey := fmt.Sprintf("alert:%d", alert.ID)
	alertJSON, err := json.Marshal(alert)
	if err != nil {
		// 如果序列化失败，只记录日志，不中断主流程
		log.Error("序列化预警信息失败", "error", err)
		return nil
	}

	// 添加到Redis预警集合
	if err := redisClient.SAdd(ctx, "alerts:unprocessed", alert.ID).Err(); err != nil {
		log.Error("添加预警到Redis集合失败", "error", err)
	}

	// 存储预警详细信息
	if err := redisClient.Set(ctx, alertKey, string(alertJSON), 24*time.Hour).Err(); err != nil {
		log.Error("存储预警详细信息到Redis失败", "error", err)
	}

	return nil
}

// GetAlert 获取单个预警详细信息
func GetAlert(c *gin.Context) {
	// 获取预警ID参数
	alertID := c.Param("id")
	if alertID == "" {
		response.Fail(c, response.ErrInvalidRequest.WithTips("预警ID不能为空"))
		return
	}

	// 查询预警信息
	var alert model.Alert
	if err := database.DB.Where("id = ?", alertID).First(&alert).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Fail(c, response.ErrNotFound.WithTips("预警信息不存在"))
		} else {
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
		}
		return
	}

	// 转换为响应格式
	alertResp := AlertResponse{
		ID:          alert.ID,
		OrderID:     alert.OrderID,
		Content:     alert.Content,
		AlertTime:   alert.AlertTime,
		IsProcessed: alert.IsProcessed,
		ProcessNote: alert.ProcessNote,
		AlertType:   alert.AlertType,
	}

	// 返回成功响应
	response.Success(c, alertResp)
}

// GetAlerts 获取预警列表（支持分页和条件查询）
func GetAlerts(c *gin.Context) {
	// 获取查询参数
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")
	isProcessed := c.Query("is_processed")
	alertType := c.Query("alert_type")

	// 解析分页参数
	pageNum := 1
	size := 10
	fmt.Sscanf(page, "%d", &pageNum)
	fmt.Sscanf(pageSize, "%d", &size)

	// 构建查询条件
	query := database.DB.Model(&model.Alert{})

	// 添加处理状态查询条件
	if isProcessed != "" {
		if isProcessed == "true" {
			query = query.Where("is_processed = ?", true)
		} else if isProcessed == "false" {
			query = query.Where("is_processed = ?", false)
		}
	}

	// 添加预警类型查询条件
	if alertType != "" {
		query = query.Where("alert_type = ?", alertType)
	}

	// 计算总数
	var total int64
	query.Count(&total)

	// 计算偏移量
	offset := (pageNum - 1) * size

	// 查询预警列表
	var alerts []model.Alert
	if err := query.Offset(offset).Limit(size).Order("id DESC").Find(&alerts).Error; err != nil {
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 转换为响应格式
	alertList := make([]AlertResponse, len(alerts))
	for i, alert := range alerts {
		alertList[i] = AlertResponse{
			ID:          alert.ID,
			OrderID:     alert.OrderID,
			Content:     alert.Content,
			AlertTime:   alert.AlertTime,
			IsProcessed: alert.IsProcessed,
			ProcessNote: alert.ProcessNote,
			AlertType:   alert.AlertType,
		}
	}

	// 计算总页数
	totalPages := int((total + int64(size) - 1) / int64(size))

	// 构造响应数据
	resp := AlertListResponse{
		Alerts: alertList,
		Pagination: Pagination{
			CurrentPage: pageNum,
			PageSize:    size,
			TotalCount:  total,
			TotalPages:  totalPages,
		},
	}

	// 返回成功响应
	response.Success(c, resp)
}

// ProcessAlert 处理预警
func ProcessAlert(c *gin.Context) {
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

	// 检查用户角色是否为管理员
	if payload.RoleID != 3 {
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	// 获取预警ID参数
	alertID := c.Param("id")
	if alertID == "" {
		response.Fail(c, response.ErrInvalidRequest.WithTips("预警ID不能为空"))
		return
	}

	// 解析请求参数
	var req struct {
		ProcessNote string `json:"process_note"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

	// 查询预警信息
	var alert model.Alert
	if err := database.DB.Where("id = ?", alertID).First(&alert).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Fail(c, response.ErrNotFound.WithTips("预警信息不存在"))
		} else {
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
		}
		return
	}

	// 更新预警处理状态
	alert.IsProcessed = true
	alert.ProcessNote = req.ProcessNote
	if err := database.DB.Save(&alert).Error; err != nil {
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 从Redis中移除预警
	redisClient := redis.RedisClient
	ctx := context.Background()
	if err := redisClient.SRem(ctx, "alerts:unprocessed", alert.ID).Err(); err != nil {
		log.Error("从Redis移除预警失败", "error", err)
	}

	alertKey := fmt.Sprintf("alert:%d", alert.ID)
	if err := redisClient.Del(ctx, alertKey).Err(); err != nil {
		log.Error("从Redis删除预警详细信息失败", "error", err)
	}

	// 返回成功响应
	response.Success(c, nil)
}

// GetRedisAlerts 获取Redis中的预警列表并清空
func GetRedisAlerts(c *gin.Context) {
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

	// 检查用户角色是否为管理员
	if payload.RoleID != 3 {
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	redisClient := redis.RedisClient
	ctx := context.Background()

	// 获取Redis中的预警ID集合
	alertIDs, err := redisClient.SMembers(ctx, "alerts:unprocessed").Result()
	if err != nil {
		response.Fail(c, response.ErrServerInternal.WithOrigin(err))
		return
	}

	// 获取预警详细信息
	var alerts []model.Alert
	for _, alertIDStr := range alertIDs {
		alertKey := fmt.Sprintf("alert:%s", alertIDStr)
		alertJSON, err := redisClient.Get(ctx, alertKey).Result()
		if err != nil {
			continue // 跳过无法获取的预警
		}

		// 反序列化预警数据
		var alert model.Alert
		if err := json.Unmarshal([]byte(alertJSON), &alert); err != nil {
			continue // 跳过无法解析的预警
		}

		alerts = append(alerts, alert)
	}

	// 清空Redis中的预警集合
	if err := redisClient.Del(ctx, "alerts:unprocessed").Err(); err != nil {
		log.Error("清空Redis预警集合失败", "error", err)
	}

	// 删除所有预警详细信息
	for _, alertIDStr := range alertIDs {
		alertKey := fmt.Sprintf("alert:%s", alertIDStr)
		if err := redisClient.Del(ctx, alertKey).Err(); err != nil {
			log.Error("删除Redis预警详细信息失败", "alert_id", alertIDStr, "error", err)
		}
	}

	// 转换为响应格式
	alertList := make([]AlertResponse, len(alerts))
	for i, alert := range alerts {
		alertList[i] = AlertResponse{
			ID:          alert.ID,
			OrderID:     alert.OrderID,
			Content:     alert.Content,
			AlertTime:   alert.AlertTime,
			IsProcessed: alert.IsProcessed,
			ProcessNote: alert.ProcessNote,
			AlertType:   alert.AlertType,
		}
	}

	// 返回成功响应
	response.Success(c, alertList)
}

// CheckOrderTimeoutAPI 检查订单超时情况的API接口
func CheckOrderTimeoutAPI(c *gin.Context) {
	// 调用检查订单超时的函数
	CheckOrderTimeout()

	// 返回成功响应
	response.Success(c, nil)
}

package feedback

import (
	"cab-hive/internal/global/database"
	"cab-hive/internal/global/jwt"
	"cab-hive/internal/global/response"
	"cab-hive/internal/model"
	"fmt"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// FeedbackResponse 定义反馈信息响应的结构体
type FeedbackResponse struct {
	ID          uint   `json:"id"`
	UserOpenID  string `json:"user_open_id"`
	OrderID     uint   `json:"order_id"`
	Type        string `json:"type"`
	Level       int    `json:"level"`
	Title       string `json:"title"`
	Content     string `json:"content"`
	Status      string `json:"status"`
	Reply       string `json:"reply"`
	ReplyUserID *uint  `json:"reply_user_id"`
	CreateTime  int64  `json:"create_time"`
	UpdateTime  int64  `json:"update_time"`
}

// CreateFeedbackRequest 定义创建反馈请求的结构体
type CreateFeedbackRequest struct {
	OrderID uint   `json:"order_id" binding:"required"`
	Type    string `json:"type" binding:"required"`
	Level   int    `json:"level" binding:"required,min=1,max=5"`
	Title   string `json:"title" binding:"required,max=100"`
	Content string `json:"content" binding:"required"`
}

// ReplyFeedbackRequest 定义回复反馈请求的结构体
type ReplyFeedbackRequest struct {
	Reply string `json:"reply" binding:"required"`
}

// UpdateFeedbackStatusRequest 定义更新反馈状态请求的结构体
type UpdateFeedbackStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

// CreateFeedback 处理用户创建反馈请求
func CreateFeedback(c *gin.Context) {
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

	// 解析请求参数
	var req CreateFeedbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Error("请求参数解析失败", "error", err)
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

	// 验证订单是否属于该用户
	var order model.Order
	if err := database.DB.Where("id = ? AND user_open_id = ?", req.OrderID, claims.OpenID).First(&order).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			log.Error("订单不存在或不属于该用户", "order_id", req.OrderID, "user_open_id", claims.OpenID)
			response.Fail(c, response.ErrNotFound)
			return
		}
		log.Error("查询订单失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 创建反馈
	feedback := model.Feedback{
		UserOpenID: claims.OpenID,
		OrderID:    req.OrderID,
		Type:       req.Type,
		Level:      req.Level,
		Title:      req.Title,
		Content:    req.Content,
		Status:     model.FeedbackStatusOpen,
	}

	if err := database.DB.Create(&feedback).Error; err != nil {
		log.Error("创建反馈失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 返回成功响应
	log.Info("创建反馈成功", "feedback_id", feedback.ID)
	response.Success(c, gin.H{"id": feedback.ID})
}

// GetUserFeedbackList 处理用户查看自己的反馈列表请求
func GetUserFeedbackList(c *gin.Context) {
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
	feedbackType := c.Query("type")

	// 解析分页参数
	pageNum := 1
	size := 10
	fmt.Sscanf(page, "%d", &pageNum)
	fmt.Sscanf(pageSize, "%d", &size)

	// 构建查询条件
	query := database.DB.Model(&model.Feedback{}).Where("user_open_id = ?", claims.OpenID)

	// 添加查询条件
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if feedbackType != "" {
		query = query.Where("type = ?", feedbackType)
	}

	// 计算总数
	var total int64
	query.Count(&total)

	// 计算偏移量
	offset := (pageNum - 1) * size

	// 查询反馈列表
	var feedbacks []model.Feedback
	if err := query.Offset(offset).Limit(size).Order("created_at DESC").Find(&feedbacks).Error; err != nil {
		log.Error("查询反馈列表失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 转换为响应格式
	feedbackList := make([]FeedbackResponse, len(feedbacks))
	for i, f := range feedbacks {
		feedbackList[i] = FeedbackResponse{
			ID:          f.ID,
			UserOpenID:  f.UserOpenID,
			OrderID:     f.OrderID,
			Type:        f.Type,
			Level:       f.Level,
			Title:       f.Title,
			Content:     f.Content,
			Status:      f.Status,
			Reply:       f.Reply,
			ReplyUserID: f.ReplyUserID,
			CreateTime:  f.CreateTime(),
			UpdateTime:  f.UpdateTime(),
		}
	}

	// 计算总页数
	totalPages := int((total + int64(size) - 1) / int64(size))

	// 构造响应数据
	resp := map[string]interface{}{
		"feedbacks": feedbackList,
		"pagination": map[string]interface{}{
			"current_page": pageNum,
			"page_size":    size,
			"total_count":  total,
			"total_pages":  totalPages,
		},
	}

	// 返回成功响应
	log.Info("查询用户反馈列表成功", "total", total)
	response.Success(c, resp)
}

// GetUserFeedbackDetail 处理用户查看自己的反馈详情请求
func GetUserFeedbackDetail(c *gin.Context) {
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

	// 从URL参数获取反馈ID
	feedbackID := c.Param("id")
	if feedbackID == "" {
		log.Error("反馈ID不能为空")
		response.Fail(c, response.ErrInvalidRequest)
		return
	}

	// 转换反馈ID为整数
	id, err := strconv.ParseUint(feedbackID, 10, 64)
	if err != nil {
		log.Error("反馈ID格式错误", "feedback_id", feedbackID)
		response.Fail(c, response.ErrInvalidRequest)
		return
	}

	// 查询反馈详情
	var feedback model.Feedback
	if err := database.DB.Where("id = ? AND user_open_id = ?", id, claims.OpenID).First(&feedback).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			log.Error("反馈不存在或不属于该用户", "feedback_id", id, "user_open_id", claims.OpenID)
			response.Fail(c, response.ErrNotFound)
			return
		}
		log.Error("查询反馈详情失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 构造响应数据
	feedbackResp := FeedbackResponse{
		ID:          feedback.ID,
		UserOpenID:  feedback.UserOpenID,
		OrderID:     feedback.OrderID,
		Type:        feedback.Type,
		Level:       feedback.Level,
		Title:       feedback.Title,
		Content:     feedback.Content,
		Status:      feedback.Status,
		Reply:       feedback.Reply,
		ReplyUserID: feedback.ReplyUserID,
		CreateTime:  feedback.CreateTime(),
		UpdateTime:  feedback.UpdateTime(),
	}

	// 返回成功响应
	log.Info("查询用户反馈详情成功", "feedback_id", feedback.ID)
	response.Success(c, feedbackResp)
}

// GetAdminFeedbackList 处理管理员查看所有反馈列表请求
func GetAdminFeedbackList(c *gin.Context) {
	// 获取查询参数
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")
	status := c.Query("status")
	feedbackType := c.Query("type")
	userOpenID := c.Query("user_open_id")
	orderID := c.Query("order_id")

	// 解析分页参数
	pageNum := 1
	size := 10
	fmt.Sscanf(page, "%d", &pageNum)
	fmt.Sscanf(pageSize, "%d", &size)

	// 构建查询条件
	query := database.DB.Model(&model.Feedback{})

	// 添加查询条件
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if feedbackType != "" {
		query = query.Where("type = ?", feedbackType)
	}
	if userOpenID != "" {
		query = query.Where("user_open_id = ?", userOpenID)
	}
	if orderID != "" {
		query = query.Where("order_id = ?", orderID)
	}

	// 计算总数
	var total int64
	query.Count(&total)

	// 计算偏移量
	offset := (pageNum - 1) * size

	// 查询反馈列表
	var feedbacks []model.Feedback
	if err := query.Offset(offset).Limit(size).Order("created_at DESC").Find(&feedbacks).Error; err != nil {
		log.Error("查询反馈列表失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 转换为响应格式
	feedbackList := make([]FeedbackResponse, len(feedbacks))
	for i, f := range feedbacks {
		feedbackList[i] = FeedbackResponse{
			ID:          f.ID,
			UserOpenID:  f.UserOpenID,
			OrderID:     f.OrderID,
			Type:        f.Type,
			Level:       f.Level,
			Title:       f.Title,
			Content:     f.Content,
			Status:      f.Status,
			Reply:       f.Reply,
			ReplyUserID: f.ReplyUserID,
			CreateTime:  f.CreateTime(),
			UpdateTime:  f.UpdateTime(),
		}
	}

	// 计算总页数
	totalPages := int((total + int64(size) - 1) / int64(size))

	// 构造响应数据
	resp := map[string]interface{}{
		"feedbacks": feedbackList,
		"pagination": map[string]interface{}{
			"current_page": pageNum,
			"page_size":    size,
			"total_count":  total,
			"total_pages":  totalPages,
		},
	}

	// 返回成功响应
	log.Info("管理员查询反馈列表成功", "total", total)
	response.Success(c, resp)
}

// GetAdminFeedbackDetail 处理管理员查看反馈详情请求
func GetAdminFeedbackDetail(c *gin.Context) {
	// 从URL参数获取反馈ID
	feedbackID := c.Param("id")
	if feedbackID == "" {
		log.Error("反馈ID不能为空")
		response.Fail(c, response.ErrInvalidRequest)
		return
	}

	// 转换反馈ID为整数
	id, err := strconv.ParseUint(feedbackID, 10, 64)
	if err != nil {
		log.Error("反馈ID格式错误", "feedback_id", feedbackID)
		response.Fail(c, response.ErrInvalidRequest)
		return
	}

	// 查询反馈详情
	var feedback model.Feedback
	if err := database.DB.Where("id = ?", id).First(&feedback).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			log.Error("反馈不存在", "feedback_id", id)
			response.Fail(c, response.ErrNotFound)
			return
		}
		log.Error("查询反馈详情失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 构造响应数据
	feedbackResp := FeedbackResponse{
		ID:          feedback.ID,
		UserOpenID:  feedback.UserOpenID,
		OrderID:     feedback.OrderID,
		Type:        feedback.Type,
		Level:       feedback.Level,
		Title:       feedback.Title,
		Content:     feedback.Content,
		Status:      feedback.Status,
		Reply:       feedback.Reply,
		ReplyUserID: feedback.ReplyUserID,
		CreateTime:  feedback.CreateTime(),
		UpdateTime:  feedback.UpdateTime(),
	}

	// 返回成功响应
	log.Info("管理员查询反馈详情成功", "feedback_id", feedback.ID)
	response.Success(c, feedbackResp)
}

// ReplyFeedback 处理管理员回复反馈请求
func ReplyFeedback(c *gin.Context) {
	// 从上下文中获取管理员信息
	payload, exists := c.Get("payload")
	if !exists {
		log.Error("无法获取管理员信息")
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	// 断言 payload 为 jwt.Claims 类型
	claims, ok := payload.(*jwt.Claims)
	if !ok {
		log.Error("管理员信息类型错误")
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	// 从URL参数获取反馈ID
	feedbackID := c.Param("id")
	if feedbackID == "" {
		log.Error("反馈ID不能为空")
		response.Fail(c, response.ErrInvalidRequest)
		return
	}

	// 转换反馈ID为整数
	id, err := strconv.ParseUint(feedbackID, 10, 64)
	if err != nil {
		log.Error("反馈ID格式错误", "feedback_id", feedbackID)
		response.Fail(c, response.ErrInvalidRequest)
		return
	}

	// 解析请求参数
	var req ReplyFeedbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Error("请求参数解析失败", "error", err)
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

	// 更新反馈的回复信息
	updates := map[string]interface{}{
		"reply":         req.Reply,
		"reply_user_id": claims.Payload.RoleID, // 这里应该是管理员ID，暂时用RoleID代替
		"status":        model.FeedbackStatusProcessing,
	}

	if err := database.DB.Model(&model.Feedback{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		log.Error("回复反馈失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 返回成功响应
	log.Info("回复反馈成功", "feedback_id", id)
	response.Success(c, nil)
}

// UpdateFeedbackStatus 处理管理员更新反馈状态请求
func UpdateFeedbackStatus(c *gin.Context) {
	// 从URL参数获取反馈ID
	feedbackID := c.Param("id")
	if feedbackID == "" {
		log.Error("反馈ID不能为空")
		response.Fail(c, response.ErrInvalidRequest)
		return
	}

	// 转换反馈ID为整数
	id, err := strconv.ParseUint(feedbackID, 10, 64)
	if err != nil {
		log.Error("反馈ID格式错误", "feedback_id", feedbackID)
		response.Fail(c, response.ErrInvalidRequest)
		return
	}

	// 解析请求参数
	var req UpdateFeedbackStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Error("请求参数解析失败", "error", err)
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

	// 验证状态值是否有效
	validStatus := map[string]bool{
		model.FeedbackStatusOpen:       true,
		model.FeedbackStatusProcessing: true,
		model.FeedbackStatusClosed:     true,
	}

	if !validStatus[req.Status] {
		log.Error("无效的反馈状态", "status", req.Status)
		response.Fail(c, response.ErrInvalidRequest)
		return
	}

	// 更新反馈状态
	if err := database.DB.Model(&model.Feedback{}).Where("id = ?", id).Update("status", req.Status).Error; err != nil {
		log.Error("更新反馈状态失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 返回成功响应
	log.Info("更新反馈状态成功", "feedback_id", id, "status", req.Status)
	response.Success(c, nil)
}
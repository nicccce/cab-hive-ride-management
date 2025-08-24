package user

import (
	"cab-hive/internal/global/database"
	"cab-hive/internal/global/jwt"
	"cab-hive/internal/global/response"
	"cab-hive/internal/model"
	"fmt"

	"github.com/gin-gonic/gin"
)

// UserResponse 定义用户信息响应的结构体
type UserResponse struct {
	ID        uint   `json:"id"`
	RoleID    int    `json:"role_id"`
	NickName  string `json:"nick_name"`
	AvatarURL string `json:"avatar_url"`
	OpenID    string `json:"open_id"`
}

// UpdateProfileRequest 定义更新用户信息请求的结构体
type UpdateProfileRequest struct {
	NickName  string `json:"nick_name"`
	AvatarURL string `json:"avatar_url"`
}

// GetAllUsers 处理查询所有用户请求
func GetAllUsers(c *gin.Context) {
	// 获取查询参数
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")
	nickName := c.Query("nick_name")
	openID := c.Query("open_id")

	// 解析分页参数
	pageNum := 1
	size := 10
	fmt.Sscanf(page, "%d", &pageNum)
	fmt.Sscanf(pageSize, "%d", &size)

	// 构建查询条件
	query := database.DB.Model(&model.User{})

	// 添加查询条件
	if nickName != "" {
		query = query.Where("nick_name LIKE ?", "%"+nickName+"%")
	}
	if openID != "" {
		query = query.Where("open_id = ?", openID)
	}

	// 计算总数
	var total int64
	query.Count(&total)

	// 计算偏移量
	offset := (pageNum - 1) * size

	// 查询用户列表
	var users []model.User
	if err := query.Offset(offset).Limit(size).Find(&users).Error; err != nil {
		log.Error("查询用户列表失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 转换为响应格式
	userList := make([]UserResponse, len(users))
	for i, u := range users {
		userList[i] = UserResponse{
			ID:        u.ID,
			RoleID:    u.RoleID,
			NickName:  u.NickName,
			AvatarURL: u.AvatarURL,
			OpenID:    u.OpenID,
		}
	}

	// 计算总页数
	totalPages := int((total + int64(size) - 1) / int64(size))

	// 构造响应数据
	resp := map[string]interface{}{
		"users": userList,
		"pagination": map[string]interface{}{
			"current_page": pageNum,
			"page_size":    size,
			"total_count":  total,
			"total_pages":  totalPages,
		},
	}

	// 返回成功响应
	log.Info("查询用户列表成功", "total", total)
	response.Success(c, resp)
}

// GetProfile 处理查询当前用户个人信息请求
func GetProfile(c *gin.Context) {
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

	// 根据 OpenID 查询用户信息
	var user model.User
	if err := database.DB.Where("open_id = ?", claims.OpenID).First(&user).Error; err != nil {
		log.Error("查询用户信息失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 构造响应数据
	userResp := UserResponse{
		ID:        user.ID,
		RoleID:    user.RoleID,
		NickName:  user.NickName,
		AvatarURL: user.AvatarURL,
		OpenID:    user.OpenID,
	}

	// 返回成功响应
	log.Info("查询用户个人信息成功", "user_id", user.ID)
	response.Success(c, userResp)
}


// UpdateProfile 处理更新当前用户个人信息请求
func UpdateProfile(c *gin.Context) {
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
	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Error("请求参数解析失败", "error", err)
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

	// 构建更新字段映射
	updates := make(map[string]interface{})
	if req.NickName != "" {
		updates["nick_name"] = req.NickName
	}
	if req.AvatarURL != "" {
		updates["avatar_url"] = req.AvatarURL
	}

	// 如果没有需要更新的字段，则直接返回成功
	if len(updates) == 0 {
		log.Info("没有需要更新的字段")
		response.Success(c, nil)
		return
	}

	// 更新用户信息
	if err := database.DB.Model(&model.User{}).Where("open_id = ?", claims.OpenID).Updates(updates).Error; err != nil {
		log.Error("更新用户信息失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 返回成功响应
	log.Info("更新用户个人信息成功", "open_id", claims.OpenID)
	response.Success(c, nil)
}

// ResetProfile 处理重置当前用户个人信息请求（将昵称和头像重置为默认值）
func ResetProfile(c *gin.Context) {
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

	// 构建更新字段映射
	updates := map[string]interface{}{
		"nick_name":  "默认昵称",
		"avatar_url": "https://avatars.githubusercontent.com/u/161929724",
	}

	// 更新用户信息
	if err := database.DB.Model(&model.User{}).Where("open_id = ?", claims.OpenID).Updates(updates).Error; err != nil {
		log.Error("重置用户信息失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 返回成功响应
	log.Info("重置用户个人信息成功", "open_id", claims.OpenID)
	response.Success(c, nil)
}

// AdminResetUserProfile 处理管理员重置用户个人信息请求（将指定用户的昵称和头像重置为默认值）
func AdminResetUserProfile(c *gin.Context) {
	// 从URL参数获取用户ID
	userID := c.Param("id")
	if userID == "" {
		log.Error("用户ID不能为空")
		response.Fail(c, response.ErrInvalidRequest)
		return
	}

	// 构建更新字段映射
	updates := map[string]interface{}{
		"nick_name":  "默认昵称",
		"avatar_url": "https://avatars.githubusercontent.com/u/161929724",
	}

	// 更新用户信息
	if err := database.DB.Model(&model.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		log.Error("管理员重置用户信息失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 返回成功响应
	log.Info("管理员重置用户个人信息成功", "user_id", userID)
	response.Success(c, nil)
}

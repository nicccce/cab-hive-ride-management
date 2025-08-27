package driver

import (
	"cab-hive/internal/global/database"
	"cab-hive/internal/global/jwt"
	"cab-hive/internal/global/response"
	"cab-hive/internal/model"
	"cab-hive/internal/module/vehicle"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
	"gorm.io/gorm"
)

// DriverResponse 定义司机信息响应的结构体
type DriverResponse struct {
	ID              uint   `json:"id"`
	OpenID          string `json:"open_id"`
	LicenseNumber   string `json:"license_number"`
	Name            string `json:"name"`
	Phone           string `json:"phone"`
	LicenseImageURL string `json:"license_image_url"`
	Status          string `json:"status"`
}

// PendingDriverResponse 定义待审核司机信息响应的结构体
type PendingDriverResponse struct {
	ID              uint   `json:"id"`
	OpenID          string `json:"open_id"`
	LicenseNumber   string `json:"license_number"`
	Name            string `json:"name"`
	Phone           string `json:"phone"`
	LicenseImageURL string `json:"license_image_url"`
	Status          string `json:"status"`
	Comment         string `json:"comment"`
	SubmitTime      string `json:"submit_time"`
	ReviewTime      string `json:"review_time"`
}

// DriverRegisterRequest 定义司机注册请求的结构体
type DriverRegisterRequest struct {
	LicenseNumber   string `json:"license_number" binding:"required"`    // 司机的驾照编号
	LicenseImageURL string `json:"license_image_url" binding:"required"` // 驾照图片URL
	Name            string `json:"name" binding:"required"`              // 司机姓名
	Phone           string `json:"phone" binding:"required"`             // 司机电话号码
}

// DriverUpdateRequest 定义管理员更新司机信息的请求结构体
type DriverUpdateRequest struct {
	LicenseNumber   string `json:"license_number" binding:"required"`    // 司机的驾照编号
	Name            string `json:"name" binding:"required"`              // 司机姓名
	Phone           string `json:"phone" binding:"required"`             // 司机电话号码
	LicenseImageURL string `json:"license_image_url" binding:"required"` // 驾照图片URL
	Status          string `json:"status" binding:"required"`            // 状态: pending, approved, rejected
	Comment         string `json:"comment"`                              // 管理员审核备注
}

// DriverSelfUpdateRequest 定义司机自我更新信息的请求结构体
type DriverSelfUpdateRequest struct {
	Name            string `json:"name"`              // 司机姓名
	Phone           string `json:"phone"`             // 司机电话号码
	LicenseImageURL string `json:"license_image_url"` // 驾照图片URL
}

// DriverRegisterResponse 定义司机注册响应的结构体
type DriverRegisterResponse struct {
	Status              string `json:"status"`                // 状态
	DriverID            string `json:"driver_id"`             // 司机ID
	EstimatedReviewTime string `json:"estimated_review_time"` // 预计审核时间
}

// ReviewRequest 定义审核请求的结构体
type ReviewRequest struct {
	Action  string `json:"action" binding:"required"` // 审核操作: approve, reject
	Comment string `json:"comment"`                   // 审核备注
}

// DriverRegister 处理司机注册请求
func DriverRegister(c *gin.Context) {
	// 定义请求结构体并绑定 JSON 数据
	var req DriverRegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Error("绑定司机注册请求失败", "error", err)
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

	// 检查驾照编号是否已存在
	var existingDriver model.Driver
	err := database.DB.Where("license_number = ?", req.LicenseNumber).First(&existingDriver).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Error("数据库查询失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 如果驾照编号已存在，返回错误
	if err == nil {
		log.Error("驾照编号已存在", "license_number", req.LicenseNumber)
		response.Fail(c, response.ErrAlreadyExists.WithTips("驾照编号已存在"))
		return
	}
	// 检查是否已有待审核记录（包括其他用户提交的）
	var existingDriverReview model.DriverReview
	err = database.DB.Where("license_number = ? AND status = ?", req.LicenseNumber, "pending").First(&existingDriverReview).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Error("数据库查询失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 如果驾照编号已存在且正在审核中，返回错误
	if err == nil {
		log.Error("驾照编号已存在且正在审核中", "license_number", req.LicenseNumber)
		response.Fail(c, response.ErrAlreadyExists.WithTips("驾照编号已存在且正在审核中"))
		return
	}

	// 删除该用户已有的待审核记录
	database.DB.Where("open_id = ? AND status = ?", payload.OpenID, "pending").Delete(&model.DriverReview{})

	// 创建司机审核记录而不是直接创建司机记录
	driverReview := model.DriverReview{
		OpenID:          payload.OpenID,
		LicenseNumber:   req.LicenseNumber,
		Name:            req.Name,
		Phone:           req.Phone,
		LicenseImageURL: req.LicenseImageURL,
		Status:          "pending",
		ActionType:      "register",
	}

	if err := database.DB.Create(&driverReview).Error; err != nil {
		log.Error("创建司机审核记录失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 构造响应数据
	resp := DriverRegisterResponse{
		Status:              "pending",
		DriverID:            fmt.Sprintf("review_%d", driverReview.ID),
		EstimatedReviewTime: "24小时内",
	}

	// 返回成功响应
	log.Info("司机注册提交成功，等待审核", "review_id", driverReview.ID)
	response.Success(c, resp)
}

// DriverSelfUpdateHandler 处理司机自我更新信息请求
func DriverSelfUpdateHandler(c *gin.Context) {
	// 解析请求参数
	var req DriverSelfUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
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

	// 查找司机
	var driver model.Driver
	if err := database.DB.Where("open_id = ?", payload.OpenID).First(&driver).Error; err != nil {
		response.Fail(c, response.ErrNotFound)
		return
	}

	// 删除该用户已有的待审核记录
	database.DB.Where("open_id = ? AND status = ?", payload.OpenID, "pending").Delete(&model.DriverReview{})

	// 创建司机信息更新审核记录
	driverReview := model.DriverReview{
		OpenID:          payload.OpenID,
		LicenseNumber:   driver.LicenseNumber, // 保持原有驾照编号
		Name:            req.Name,
		Phone:           req.Phone,
		LicenseImageURL: req.LicenseImageURL,
		Status:          "pending",
		ActionType:      "update",
		DriverID:        driver.ID, // 关联到现有司机记录
	}

	// 如果字段为空，则使用原有值
	if req.Name == "" {
		driverReview.Name = driver.Name
	}
	if req.Phone == "" {
		driverReview.Phone = driver.Phone
	}
	if req.LicenseImageURL == "" {
		driverReview.LicenseImageURL = driver.LicenseImageURL
	}

	// 保存审核记录
	if err := database.DB.Create(&driverReview).Error; err != nil {
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 返回成功响应
	response.Success(c, nil)
}

// GetAllDrivers 处理查询所有司机请求
func GetAllDrivers(c *gin.Context) {
	// 获取查询参数
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")
	name := c.Query("name")
	phone := c.Query("phone")
	licenseNumber := c.Query("license_number")
	status := c.Query("status")

	// 解析分页参数
	pageNum := 1
	size := 10
	fmt.Sscanf(page, "%d", &pageNum)
	fmt.Sscanf(pageSize, "%d", &size)

	// 构建查询条件
	query := database.DB.Model(&model.Driver{})

	// 添加查询条件
	if name != "" {
		query = query.Where("name LIKE ?", "%"+name+"%")
	}
	if phone != "" {
		query = query.Where("phone LIKE ?", "%"+phone+"%")
	}
	if licenseNumber != "" {
		query = query.Where("license_number = ?", licenseNumber)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 计算总数
	var total int64
	query.Count(&total)

	// 计算偏移量
	offset := (pageNum - 1) * size

	// 查询司机列表
	var drivers []model.Driver
	if err := query.Offset(offset).Limit(size).Find(&drivers).Error; err != nil {
		log.Error("查询司机列表失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 转换为响应格式
	driverList := make([]DriverResponse, len(drivers))
	for i, d := range drivers {
		driverList[i] = DriverResponse{
			ID:              d.ID,
			OpenID:          d.OpenID,
			LicenseNumber:   d.LicenseNumber,
			Name:            d.Name,
			Phone:           d.Phone,
			LicenseImageURL: d.LicenseImageURL,
			Status:          d.Status,
		}
	}

	// 计算总页数
	totalPages := int((total + int64(size) - 1) / int64(size))

	// 构造响应数据
	resp := map[string]interface{}{
		"drivers": driverList,
		"pagination": map[string]interface{}{
			"current_page": pageNum,
			"page_size":    size,
			"total_count":  total,
			"total_pages":  totalPages,
		},
	}

	// 返回成功响应
	log.Info("查询司机列表成功", "total", total)
	response.Success(c, resp)
}

// GetDriver 处理查询司机信息请求
func GetDriver(c *gin.Context) {
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

	// 获取要查询的司机ID参数
	DriverID := c.Param("id")

	// 查询司机信息
	var driver model.Driver
	query := database.DB.Model(&model.Driver{})

	// 如果没有传id参数，则查询当前用户作为司机的信息
	if DriverID == "" {
		query = query.Where("open_id = ?", claims.OpenID)
	} else {
		// 如果提供了司机ID参数，则添加ID查询条件
		query = query.Where("id = ?", DriverID)
	}

	// 执行查询
	if err := query.First(&driver).Error; err != nil {
		// 如果没有找到记录，返回空数据而不是错误
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Info("未找到司机信息")
			response.Success(c, nil)
			return
		}
		log.Error("查询司机信息失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 构造响应数据
	driverResp := DriverResponse{
		ID:              driver.ID,
		OpenID:          driver.OpenID,
		LicenseNumber:   driver.LicenseNumber,
		Name:            driver.Name,
		Phone:           driver.Phone,
		LicenseImageURL: driver.LicenseImageURL,
		Status:          driver.Status,
	}

	// 返回成功响应
	log.Info("查询司机信息成功", "driver_id", driver.ID)
	response.Success(c, driverResp)
}

// BanDriver 处理封禁司机请求
func BanDriver(c *gin.Context) {
	// 获取要封禁的司机ID参数
	DriverID := c.Param("id")
	if DriverID == "" {
		log.Error("司机ID参数不能为空")
		response.Fail(c, response.ErrInvalidRequest)
		return
	}

	// 更新司机状态为 banned
	var driver model.Driver
	if err := database.DB.Model(&driver).Where("id = ?", DriverID).Update("status", "banned").Error; err != nil {
		log.Error("封禁司机失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 返回成功响应
	log.Info("封禁司机成功", "driver_id", DriverID)
	response.Success(c, nil)
}

// UnbanDriver 处理解封司机请求
func UnbanDriver(c *gin.Context) {
	// 获取要解封的司机ID参数
	DriverID := c.Param("id")
	if DriverID == "" {
		log.Error("司机ID参数不能为空")
		response.Fail(c, response.ErrInvalidRequest)
		return
	}

	// 更新司机状态为 approved
	var driver model.Driver
	if err := database.DB.Model(&driver).Where("id = ?", DriverID).Update("status", "approved").Error; err != nil {
		log.Error("解封司机失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 返回成功响应
	log.Info("解封司机成功", "driver_id", DriverID)
	response.Success(c, nil)
}

// GetPendingDrivers 处理查询待审核司机信息请求
func GetPendingDrivers(c *gin.Context) {
	// 获取查询参数
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")
	name := c.Query("name")
	licenseNumber := c.Query("license_number")
	status := c.Query("status")

	// 解析分页参数
	pageNum := 1
	size := 10
	fmt.Sscanf(page, "%d", &pageNum)
	fmt.Sscanf(pageSize, "%d", &size)

	// 构建查询条件
	query := database.DB.Model(&model.DriverReview{}).Where("status = ?", "pending")

	// 添加查询条件
	if name != "" {
		query = query.Where("name LIKE ?", "%"+name+"%")
	}
	if licenseNumber != "" {
		query = query.Where("license_number = ?", licenseNumber)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 计算总数
	var total int64
	query.Count(&total)

	// 计算偏移量
	offset := (pageNum - 1) * size

	// 查询待审核司机列表
	var driverReviews []model.DriverReview
	if err := query.Offset(offset).Limit(size).Find(&driverReviews).Error; err != nil {
		log.Error("查询待审核司机列表失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 转换为响应格式
	driverList := make([]PendingDriverResponse, len(driverReviews))
	for i, dr := range driverReviews {
		driverList[i] = PendingDriverResponse{
			ID:              dr.ID,
			OpenID:          dr.OpenID,
			LicenseNumber:   dr.LicenseNumber,
			Name:            dr.Name,
			Phone:           dr.Phone,
			LicenseImageURL: dr.LicenseImageURL,
			Status:          dr.Status,
			Comment:         dr.Comment,
			SubmitTime:      dr.CreatedAt.Format(time.RFC3339),
			ReviewTime: func() string {
				if dr.ReviewTime != nil {
					return dr.ReviewTime.Format(time.RFC3339)
				}
				return ""
			}(),
		}
	}

	// 计算总页数
	totalPages := int((total + int64(size) - 1) / int64(size))

	// 构造响应数据
	resp := map[string]interface{}{
		"drivers": driverList,
		"pagination": map[string]interface{}{
			"current_page": pageNum,
			"page_size":    size,
			"total_count":  total,
			"total_pages":  totalPages,
		},
	}

	// 返回成功响应
	log.Info("查询待审核司机列表成功", "total", total)
	response.Success(c, resp)
}

// GetPendingDriver 处理查询单个待审核司机信息详情请求
func GetPendingDriver(c *gin.Context) {
	// 获取司机审核ID
	reviewID := c.Param("id")

	// 从ID中提取数字部分
	var reviewIDNum uint
	fmt.Sscanf(reviewID, "%d", &reviewIDNum)

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

	// 查找司机审核记录
	var driverReview model.DriverReview
	query := database.DB.Where("id = ?", reviewIDNum)

	// 如果不是管理员，只查询当前用户的审核记录
	if claims.RoleID != 3 {
		query = query.Where("open_id = ?", claims.OpenID)
	}

	if err := query.First(&driverReview).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Error("待审核司机记录不存在", "id", reviewIDNum)
			response.Fail(c, response.ErrNotFound)
		} else {
			log.Error("数据库查询失败", "error", err)
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
		}
		return
	}

	// 转换为响应格式
	driverResp := PendingDriverResponse{
		ID:              driverReview.ID,
		OpenID:          driverReview.OpenID,
		LicenseNumber:   driverReview.LicenseNumber,
		Name:            driverReview.Name,
		Phone:           driverReview.Phone,
		LicenseImageURL: driverReview.LicenseImageURL,
		Status:          driverReview.Status,
		Comment:         driverReview.Comment,
		SubmitTime:      driverReview.CreatedAt.Format(time.RFC3339),
		ReviewTime: func() string {
			if driverReview.ReviewTime != nil {
				return driverReview.ReviewTime.Format(time.RFC3339)
			}
			return ""
		}(),
	}

	// 返回成功响应
	log.Info("查询待审核司机详情成功", "id", reviewIDNum)
	response.Success(c, driverResp)
}

// GetSelfPendingDrivers 处理司机查询自己的所有司机审核信息列表请求
func GetSelfPendingDrivers(c *gin.Context) {
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
	name := c.Query("name")
	licenseNumber := c.Query("license_number")
	status := c.Query("status")

	// 解析分页参数
	pageNum := 1
	size := 10
	fmt.Sscanf(page, "%d", &pageNum)
	fmt.Sscanf(pageSize, "%d", &size)

	// 构建查询条件，只查询当前用户的审核记录
	query := database.DB.Model(&model.DriverReview{}).Where("open_id = ?", claims.OpenID)

	// 添加条件查询
	if name != "" {
		query = query.Where("name LIKE ?", "%"+name+"%")
	}
	if licenseNumber != "" {
		query = query.Where("license_number = ?", licenseNumber)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 计算总数
	var total int64
	query.Count(&total)

	// 计算偏移量
	offset := (pageNum - 1) * size

	// 查询司机审核列表
	var driverReviews []model.DriverReview
	if err := query.Offset(offset).Limit(size).Find(&driverReviews).Error; err != nil {
		log.Error("查询司机审核列表失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 转换为响应格式
	driverList := make([]PendingDriverResponse, len(driverReviews))
	for i, dr := range driverReviews {
		driverList[i] = PendingDriverResponse{
			ID:              dr.ID,
			OpenID:          dr.OpenID,
			LicenseNumber:   dr.LicenseNumber,
			Name:            dr.Name,
			Phone:           dr.Phone,
			LicenseImageURL: dr.LicenseImageURL,
			Status:          dr.Status,
			Comment:         dr.Comment,
			SubmitTime:      dr.CreatedAt.Format(time.RFC3339),
			ReviewTime: func() string {
				if dr.ReviewTime != nil {
					return dr.ReviewTime.Format(time.RFC3339)
				}
				return ""
			}(),
		}
	}

	// 计算总页数
	totalPages := int((total + int64(size) - 1) / int64(size))

	// 构造响应数据
	resp := map[string]interface{}{
		"drivers": driverList,
		"pagination": map[string]interface{}{
			"current_page": pageNum,
			"page_size":    size,
			"total_count":  total,
			"total_pages":  totalPages,
		},
	}

	// 返回成功响应
	log.Info("查询司机自己的所有司机审核列表成功", "total", total)
	response.Success(c, resp)
}

// ReviewDriver 处理审核司机信息请求
func ReviewDriver(c *gin.Context) {
	// 获取司机审核ID
	reviewID := c.Param("id")

	// 定义请求结构体并绑定 JSON 数据
	var req ReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Error("绑定审核司机请求失败", "error", err)
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

	// 从ID中提取数字部分
	var reviewIDNum uint
	fmt.Sscanf(reviewID, "%d", &reviewIDNum)

	// 查找司机审核记录
	var driverReview model.DriverReview
	if err := database.DB.Where("id = ?", reviewIDNum).First(&driverReview).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Error("司机审核记录不存在", "id", reviewIDNum)
			response.Fail(c, response.ErrNotFound)
		} else {
			log.Error("数据库查询失败", "error", err)
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
		}
		return
	}

	// 检查状态是否为pending
	if driverReview.Status != "pending" {
		log.Error("司机审核记录状态不为pending", "status", driverReview.Status)
		response.Fail(c, response.ErrInvalidRequest.WithTips("审核记录状态不为pending"))
		return
	}

	// 更新审核记录状态
	driverReview.Status = req.Action
	driverReview.Comment = req.Comment

	if err := database.DB.Save(&driverReview).Error; err != nil {
		log.Error("更新司机审核记录失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 如果审核通过，创建或更新司机记录
	if req.Action == "approved" {
		if driverReview.ActionType == "register" {
			// 创建新司机记录
			driver := model.Driver{
				OpenID:          driverReview.OpenID,
				LicenseNumber:   driverReview.LicenseNumber,
				Name:            driverReview.Name,
				Phone:           driverReview.Phone,
				LicenseImageURL: driverReview.LicenseImageURL,
				Status:          "approved",
			}

			if err := database.DB.Create(&driver).Error; err != nil {
				log.Error("创建司机记录失败", "error", err)
				response.Fail(c, response.ErrDatabase.WithOrigin(err))
				return
			}
		} else if driverReview.ActionType == "update" {
			// 更新现有司机记录
			var driver model.Driver
			if err := database.DB.Where("id = ?", driverReview.DriverID).First(&driver).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					log.Error("司机记录不存在", "id", driverReview.DriverID)
					response.Fail(c, response.ErrNotFound)
				} else {
					log.Error("数据库查询失败", "error", err)
					response.Fail(c, response.ErrDatabase.WithOrigin(err))
				}
				return
			}

			driver.LicenseNumber = driverReview.LicenseNumber
			driver.Name = driverReview.Name
			driver.Phone = driverReview.Phone
			driver.LicenseImageURL = driverReview.LicenseImageURL
			driver.Status = "approved"
			now := time.Now()
			driverReview.ReviewTime = &now

			if err := database.DB.Save(&driver).Error; err != nil {
				log.Error("更新司机记录失败", "error", err)
				response.Fail(c, response.ErrDatabase.WithOrigin(err))
				return
			}
		}

		// 同步更新用户的角色ID为2（司机）
		var user model.User
		if err := database.DB.Where("open_id = ?", driverReview.OpenID).First(&user).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				log.Error("用户记录不存在", "open_id", driverReview.OpenID)
				response.Fail(c, response.ErrNotFound)
			} else {
				log.Error("数据库查询失败", "error", err)
				response.Fail(c, response.ErrDatabase.WithOrigin(err))
			}
			return
		}

		user.RoleID = 2 // 设置为司机角色
		if err := database.DB.Save(&user).Error; err != nil {
			log.Error("更新用户角色ID失败", "error", err)
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
			return
		}
	} else if req.Action == "rejected" {
		// 如果审核拒绝，不需要创建或更新司机记录
		// 只需要更新审核记录状态和备注
		// 审核时间对于拒绝也同样需要记录
		now := time.Now()
		driverReview.ReviewTime = &now
	}

	// 返回成功响应
	log.Info("司机审核成功", "id", reviewIDNum, "action", req.Action)
	response.Success(c, nil)
}

// GetDriverVehicles 处理获取司机名下车辆列表请求
func GetDriverVehicles(c *gin.Context) {
	// 获取司机ID
	DriverID := c.Param("id")

	// 查找司机
	var driver model.Driver
	if err := database.DB.Where("id = ?", DriverID).First(&driver).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Fail(c, response.ErrNotFound)
		} else {
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
		}
		return
	}

	// 查询该司机名下的所有车辆
	var vehicles []model.Vehicle
	if err := database.DB.Where("driver_id = ?", driver.OpenID).Find(&vehicles).Error; err != nil {
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 转换为响应格式
	vehicleList := make([]vehicle.VehicleResponse, len(vehicles))
	for i, v := range vehicles {
		// 查找司机信息
		var driver model.Driver
		driverName := ""
		driverPhone := ""
		if err := database.DB.Where("open_id = ?", v.DriverID).First(&driver).Error; err != nil {
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				response.Fail(c, response.ErrDatabase.WithOrigin(err))
				return
			}
			// 如果未找到司机记录，driverName和driverPhone将保持为空字符串
		} else {
			driverName = driver.Name
			driverPhone = driver.Phone
		}

		vehicleList[i] = vehicle.VehicleResponse{
			ID:                fmt.Sprintf("vehicle_%d", v.ID),
			DriverID:          fmt.Sprintf("driver_%d", v.DriverID),
			DriverName:        driverName,
			DriverPhone:       driverPhone,
			PlateNumber:       v.PlateNumber,
			VehicleType:       v.VehicleType,
			Brand:             v.Brand,
			Model:             v.ModelName,
			Color:             v.Color,
			Year:              v.Year,
			RegistrationImage: v.RegistrationImage,
			InsuranceExpiry:   v.InsuranceExpiry.Format(time.RFC3339),
			Status:            v.Status,
			Comment:           v.Comment,
			SubmitTime:        v.SubmitTime.Format(time.RFC3339),
			ReviewTime: func() string {
				if v.ReviewTime != nil {
					return v.ReviewTime.Format(time.RFC3339)
				}
				return ""
			}(),
			Reviewer: v.Reviewer,
		}
	}

	// 构造响应数据
	resp := map[string]interface{}{
		"vehicles": vehicleList,
	}

	// 返回成功响应
	response.Success(c, resp)
}

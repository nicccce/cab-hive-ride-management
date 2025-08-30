package vehicle

import (
	"cab-hive/internal/global/database"
	"cab-hive/internal/global/jwt"
	"cab-hive/internal/global/response"
	"cab-hive/internal/model"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
	"gorm.io/gorm"
)

// VehicleRequest 定义车辆信息提交请求的结构体
type VehicleRequest struct {
	PlateNumber       string `json:"plate_number" binding:"required"`       // 车牌号码
	VehicleType       string `json:"vehicle_type" binding:"required"`       // 车辆类型
	Brand             string `json:"brand" binding:"required"`              // 车辆品牌
	Model             string `json:"model" binding:"required"`              // 车辆型号
	Color             string `json:"color" binding:"required"`              // 车辆颜色
	Year              int    `json:"year" binding:"required"`               // 制造年份
	RegistrationImage string `json:"registration_image" binding:"required"` // 行驶证图片URL
	InsuranceExpiry   string `json:"insurance_expiry" binding:"required"`   // 保险到期日期
}

// VehicleAuditRequest 定义车辆审核请求的结构体
type VehicleAuditRequest struct {
	Action  string `json:"action" binding:"required"` // 审核操作: approve, reject
	Comment string `json:"comment"`                   // 审核备注
}

// VehicleResponse 定义车辆信息响应的结构体
type VehicleResponse struct {
	ID                uint   `json:"id"`                 // 车辆ID
	DriverID          string `json:"driver_id"`          // 司机ID
	DriverName        string `json:"driver_name"`        // 司机姓名
	DriverPhone       string `json:"driver_phone"`       // 司机电话
	PlateNumber       string `json:"plate_number"`       // 车牌号码
	VehicleType       string `json:"vehicle_type"`       // 车辆类型
	Brand             string `json:"brand"`              // 车辆品牌
	Model             string `json:"model"`              // 车辆型号
	Color             string `json:"color"`              // 车辆颜色
	Year              int    `json:"year"`               // 制造年份
	RegistrationImage string `json:"registration_image"` // 行驶证图片URL
	InsuranceExpiry   string `json:"insurance_expiry"`   // 保险到期日期
	Status            string `json:"status"`             // 状态
	Comment           string `json:"comment"`            // 管理员审核备注
	SubmitTime        string `json:"submit_time"`        // 提交时间
	ReviewTime        string `json:"review_time"`        // 审核时间
	Reviewer          string `json:"reviewer"`           // 审核人
}

// SubmitVehicle 处理提交车辆信息请求
func SubmitVehicle(c *gin.Context) {
	// 定义请求结构体并绑定 JSON 数据
	var req VehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

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

	// 解析保险到期日期
	insuranceExpiry, err := time.Parse("2006-01-02", req.InsuranceExpiry)
	if err != nil {
		response.Fail(c, response.ErrInvalidRequest.WithTips("保险到期日期格式错误"))
		return
	}

	// 检查车牌号码是否已存在
	var existingVehicle model.Vehicle
	err = database.DB.Where("plate_number = ?", req.PlateNumber).First(&existingVehicle).Error
	// 如果车牌号码已存在，返回错误
	if err == nil {
		response.Fail(c, response.ErrAlreadyExists.WithTips("车牌号码已存在"))
		return
	}

	// 创建车辆审核记录而不是直接创建车辆记录
	vehicleReview := model.VehicleReview{
		DriverID:          payload.OpenID,
		PlateNumber:       req.PlateNumber,
		VehicleType:       req.VehicleType,
		Brand:             req.Brand,
		ModelName:         req.Model,
		Color:             req.Color,
		Year:              req.Year,
		RegistrationImage: req.RegistrationImage,
		InsuranceExpiry:   insuranceExpiry,
		Status:            "pending",
		ActionType:        "submit",
	}

	if err := database.DB.Create(&vehicleReview).Error; err != nil {
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 构造响应数据
	resp := map[string]interface{}{
		"vehicle_id":    vehicleReview.ID,
		"status":        "pending",
		"verify_status": "verifying",
		"submit_time":   time.Now().UTC().Format(time.RFC3339),
	}

	// 返回成功响应
	response.Success(c, resp)
}

// PendingVehicleResponse 定义待审核车辆信息响应的结构体
type PendingVehicleResponse struct {
	ID                uint   `json:"id"`
	DriverID          string `json:"driver_id"`
	PlateNumber       string `json:"plate_number"`
	VehicleType       string `json:"vehicle_type"`
	Brand             string `json:"brand"`
	ModelName         string `json:"model_name"`
	Color             string `json:"color"`
	Year              int    `json:"year"`
	RegistrationImage string `json:"registration_image"`
	InsuranceExpiry   string `json:"insurance_expiry"`
	Status            string `json:"status"`
	Comment           string `json:"comment"`
	SubmitTime        string `json:"submit_time"`
}

// ReviewRequest 定义审核请求的结构体
type ReviewRequest struct {
	Action  string `json:"action" binding:"required"` // 审核操作: approve, reject
	Comment string `json:"comment"`                   // 审核备注
}

// GetPendingVehicles 处理查询待审核车辆信息请求
func GetPendingVehicles(c *gin.Context) {
	// 获取查询参数
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")
	plateNumber := c.Query("plate_number")
	brand := c.Query("brand")
	modelName := c.Query("model_name")
	status := c.Query("status")

	// 解析分页参数
	pageNum := 1
	size := 10
	fmt.Sscanf(page, "%d", &pageNum)
	fmt.Sscanf(pageSize, "%d", &size)

	// 构建查询条件
	query := database.DB.Model(&model.VehicleReview{}).Where("status = ?", "pending")

	// 添加查询条件
	if plateNumber != "" {
		query = query.Where("plate_number LIKE ?", "%"+plateNumber+"%")
	}
	if brand != "" {
		query = query.Where("brand LIKE ?", "%"+brand+"%")
	}
	if modelName != "" {
		query = query.Where("model_name LIKE ?", "%"+modelName+"%")
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 计算总数
	var total int64
	query.Count(&total)

	// 计算偏移量
	offset := (pageNum - 1) * size

	// 查询待审核车辆列表
	var vehicleReviews []model.VehicleReview
	if err := query.Offset(offset).Limit(size).Find(&vehicleReviews).Error; err != nil {
		log.Error("查询待审核车辆列表失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 转换为响应格式
	vehicleList := make([]PendingVehicleResponse, len(vehicleReviews))
	for i, vr := range vehicleReviews {
		vehicleList[i] = PendingVehicleResponse{
			ID:                vr.ID,
			DriverID:          vr.DriverID,
			PlateNumber:       vr.PlateNumber,
			VehicleType:       vr.VehicleType,
			Brand:             vr.Brand,
			ModelName:         vr.ModelName,
			Color:             vr.Color,
			Year:              vr.Year,
			RegistrationImage: vr.RegistrationImage,
			InsuranceExpiry:   vr.InsuranceExpiry.Format("2006-01-02"),
			Status:            vr.Status,
			Comment:           vr.Comment,
			SubmitTime:        vr.CreatedAt.Format(time.RFC3339),
		}
	}

	// 计算总页数
	totalPages := int((total + int64(size) - 1) / int64(size))

	// 构造响应数据
	resp := map[string]interface{}{
		"vehicles": vehicleList,
		"pagination": map[string]interface{}{
			"current_page": pageNum,
			"page_size":    size,
			"total_count":  total,
			"total_pages":  totalPages,
		},
	}

	// 返回成功响应
	log.Info("查询待审核车辆列表成功", "total", total)
	response.Success(c, resp)
}

// GetPendingVehicle 处理查询单个待审核车辆信息详情请求
func GetPendingVehicle(c *gin.Context) {
	// 获取车辆审核ID
	reviewID := c.Param("id")

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

	// 查找车辆审核记录
	var vehicleReview model.VehicleReview
	query := database.DB.Where("id = ?", reviewID)

	// 如果不是管理员，只查询当前用户的审核记录
	if claims.RoleID != 3 {
		query = query.Where("driver_id = ?", claims.OpenID)
	}

	if err := query.First(&vehicleReview).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Error("待审核车辆记录不存在", "id", reviewID)
			response.Fail(c, response.ErrNotFound)
		} else {
			log.Error("数据库查询失败", "error", err)
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
		}
		return
	}

	// 转换为响应格式
	vehicleResp := PendingVehicleResponse{
		ID:                vehicleReview.ID,
		DriverID:          vehicleReview.DriverID,
		PlateNumber:       vehicleReview.PlateNumber,
		VehicleType:       vehicleReview.VehicleType,
		Brand:             vehicleReview.Brand,
		ModelName:         vehicleReview.ModelName,
		Color:             vehicleReview.Color,
		Year:              vehicleReview.Year,
		RegistrationImage: vehicleReview.RegistrationImage,
		InsuranceExpiry:   vehicleReview.InsuranceExpiry.Format("2006-01-02"),
		Status:            vehicleReview.Status,
		Comment:           vehicleReview.Comment,
		SubmitTime:        vehicleReview.CreatedAt.Format(time.RFC3339),
	}

	// 返回成功响应
	log.Info("查询待审核车辆详情成功", "id", reviewID)
	response.Success(c, vehicleResp)
}

// GetSelfPendingVehicles 处理司机查询自己的所有车辆审核信息列表请求
func GetSelfPendingVehicles(c *gin.Context) {
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
	plateNumber := c.Query("plate_number")
	brand := c.Query("brand")
	modelName := c.Query("model_name")
	status := c.Query("status")

	// 解析分页参数
	pageNum := 1
	size := 10
	fmt.Sscanf(page, "%d", &pageNum)
	fmt.Sscanf(pageSize, "%d", &size)

	// 构建查询条件，只查询当前用户的审核记录
	query := database.DB.Model(&model.VehicleReview{}).Where("driver_id = ?", claims.OpenID)

	// 添加条件查询
	if plateNumber != "" {
		query = query.Where("plate_number LIKE ?", "%"+plateNumber+"%")
	}
	if brand != "" {
		query = query.Where("brand LIKE ?", "%"+brand+"%")
	}
	if modelName != "" {
		query = query.Where("model_name LIKE ?", "%"+modelName+"%")
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 计算总数
	var total int64
	query.Count(&total)

	// 计算偏移量
	offset := (pageNum - 1) * size

	// 查询车辆审核列表
	var vehicleReviews []model.VehicleReview
	if err := query.Offset(offset).Limit(size).Find(&vehicleReviews).Error; err != nil {
		log.Error("查询车辆审核列表失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 转换为响应格式
	vehicleList := make([]PendingVehicleResponse, len(vehicleReviews))
	for i, vr := range vehicleReviews {
		vehicleList[i] = PendingVehicleResponse{
			ID:                vr.ID,
			DriverID:          vr.DriverID,
			PlateNumber:       vr.PlateNumber,
			VehicleType:       vr.VehicleType,
			Brand:             vr.Brand,
			ModelName:         vr.ModelName,
			Color:             vr.Color,
			Year:              vr.Year,
			RegistrationImage: vr.RegistrationImage,
			InsuranceExpiry:   vr.InsuranceExpiry.Format("2006-01-02"),
			Status:            vr.Status,
			Comment:           vr.Comment,
			SubmitTime:        vr.CreatedAt.Format(time.RFC3339),
		}
	}

	// 计算总页数
	totalPages := int((total + int64(size) - 1) / int64(size))

	// 构造响应数据
	resp := map[string]interface{}{
		"vehicles": vehicleList,
		"pagination": map[string]interface{}{
			"current_page": pageNum,
			"page_size":    size,
			"total_count":  total,
			"total_pages":  totalPages,
		},
	}

	// 返回成功响应
	log.Info("查询司机自己的所有车辆审核列表成功", "total", total)
	response.Success(c, resp)
}

// ReviewVehicle 处理审核车辆信息请求
func ReviewVehicle(c *gin.Context) {
	// 获取车辆审核ID
	reviewID := c.Param("id")

	// 定义请求结构体并绑定 JSON 数据
	var req ReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Error("绑定审核车辆请求失败", "error", err)
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

	// 查找车辆审核记录
	var vehicleReview model.VehicleReview
	if err := database.DB.Where("id = ?", reviewID).First(&vehicleReview).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Error("车辆审核记录不存在", "id", reviewID)
			response.Fail(c, response.ErrNotFound)
		} else {
			log.Error("数据库查询失败", "error", err)
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
		}
		return
	}
	
	// 检查状态是否为pending
	if vehicleReview.Status != "pending" {
		log.Error("车辆审核记录状态不为pending", "status", vehicleReview.Status)
		response.Fail(c, response.ErrInvalidRequest.WithTips("审核记录状态不为pending"))
		return
	}
	
	// 更新审核记录状态
	vehicleReview.Status = req.Action
	vehicleReview.Comment = req.Comment
	
	if err := database.DB.Save(&vehicleReview).Error; err != nil {
		log.Error("更新车辆审核记录失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}
	
	// 如果审核通过，创建或更新车辆记录
	if req.Action == "approved" {
		if vehicleReview.ActionType == "submit" {
			// 创建新车辆记录
			vehicle := model.Vehicle{
				DriverID:          vehicleReview.DriverID,
				PlateNumber:       vehicleReview.PlateNumber,
				VehicleType:       vehicleReview.VehicleType,
				Brand:             vehicleReview.Brand,
				ModelName:         vehicleReview.ModelName,
				Color:             vehicleReview.Color,
				Year:              vehicleReview.Year,
				RegistrationImage: vehicleReview.RegistrationImage,
				InsuranceExpiry:   vehicleReview.InsuranceExpiry,
				Status:            "approved",
				SubmitTime:        time.Now(),
			}
			now := time.Now()
			vehicleReview.ReviewTime = now
	
			if err := database.DB.Create(&vehicle).Error; err != nil {
				log.Error("创建车辆记录失败", "error", err)
				response.Fail(c, response.ErrDatabase.WithOrigin(err))
				return
			}
		} else if vehicleReview.ActionType == "update" {
			// 更新现有车辆记录
			var vehicle model.Vehicle
			if err := database.DB.Where("id = ?", vehicleReview.VehicleID).First(&vehicle).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					log.Error("车辆记录不存在", "id", vehicleReview.VehicleID)
					response.Fail(c, response.ErrNotFound)
				} else {
					log.Error("数据库查询失败", "error", err)
					response.Fail(c, response.ErrDatabase.WithOrigin(err))
				}
				return
			}
	
			vehicle.PlateNumber = vehicleReview.PlateNumber
			vehicle.VehicleType = vehicleReview.VehicleType
			vehicle.Brand = vehicleReview.Brand
			vehicle.ModelName = vehicleReview.ModelName
			vehicle.Color = vehicleReview.Color
			vehicle.Year = vehicleReview.Year
			vehicle.RegistrationImage = vehicleReview.RegistrationImage
			vehicle.InsuranceExpiry = vehicleReview.InsuranceExpiry
			vehicle.Status = "approved"
			now := time.Now()
			vehicle.ReviewTime = &now
			vehicleReview.ReviewTime = now
	
			if err := database.DB.Save(&vehicle).Error; err != nil {
				log.Error("更新车辆记录失败", "error", err)
				response.Fail(c, response.ErrDatabase.WithOrigin(err))
				return
			}
		}
	} else if req.Action == "rejected" {
		// 如果审核拒绝，不需要创建或更新车辆记录
		// 只需要更新审核记录状态和备注
		// 审核时间对于拒绝也同样需要记录
		now := time.Now()
		vehicleReview.ReviewTime = now
	}
	
	// 返回成功响应
	log.Info("车辆审核成功", "id", reviewID, "action", req.Action)
	response.Success(c, nil)
}

// GetVehicles 处理获取车辆列表请求
func GetVehicles(c *gin.Context) {
	// 获取查询参数
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")
	plateNumber := c.Query("plate_number")
	brand := c.Query("brand")
	modelName := c.Query("model_name")
	status := c.Query("status")

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

	// 解析分页参数
	pageNum := 1
	size := 10
	fmt.Sscanf(page, "%d", &pageNum)
	fmt.Sscanf(pageSize, "%d", &size)

	// 构建查询条件
	query := database.DB.Model(&model.Vehicle{})

	// 如果不是管理员，只查询当前用户的车辆
	if payload.RoleID != 3 {
		query = query.Where("driver_id = ?", payload.OpenID)
	}

	// 添加查询条件
	if plateNumber != "" {
		query = query.Where("plate_number LIKE ?", "%"+plateNumber+"%")
	}
	if brand != "" {
		query = query.Where("brand LIKE ?", "%"+brand+"%")
	}
	if modelName != "" {
		query = query.Where("model_name LIKE ?", "%"+modelName+"%")
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// 计算总数
	var total int64
	query.Count(&total)

	// 计算偏移量
	offset := (pageNum - 1) * size

	// 查询车辆列表
	var vehicles []model.Vehicle
	if err := query.Offset(offset).Limit(size).Find(&vehicles).Error; err != nil {
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 转换为响应格式
	vehicleList := make([]VehicleResponse, len(vehicles))
	for i, v := range vehicles {
		// 查找司机信息
		var driver model.Driver
		driverName := ""
		driverPhone := ""
		if err := database.DB.Where("open_id = ?", v.DriverID).First(&driver).Error; err != nil {
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				log.Error("数据库查询失败", "error", err)
				continue // 跳过这个车辆，继续处理下一个
			}
			// 如果未找到司机记录，driverName和driverPhone将保持为空字符串
		} else {
			driverName = driver.Name
			driverPhone = driver.Phone
		}

		vehicleList[i] = VehicleResponse{
			ID:                v.ID,
			DriverID:          v.DriverID,
			DriverName:        driverName,
			DriverPhone:       driverPhone,
			PlateNumber:       v.PlateNumber,
			VehicleType:       v.VehicleType,
			Brand:             v.Brand,
			Model:             v.ModelName,
			Color:             v.Color,
			Year:              v.Year,
			RegistrationImage: v.RegistrationImage,
			InsuranceExpiry:   v.InsuranceExpiry.Format("2006-01-02"),
			Status:            v.Status,
			Comment:           v.Comment,
			SubmitTime:        v.SubmitTime.Format(time.RFC3339),
			ReviewTime: func() string {
				if v.ReviewTime != nil {
					return v.ReviewTime.Format("2006-01-02")
				}
				return ""
			}(),
			Reviewer: v.Reviewer,
		}
	}

	// 计算总页数
	totalPages := int((total + int64(size) - 1) / int64(size))

	// 构造响应数据
	resp := map[string]interface{}{
		"vehicles": vehicleList,
		"pagination": map[string]interface{}{
			"current_page": pageNum,
			"page_size":    size,
			"total_count":  total,
			"total_pages":  totalPages,
		},
	}

	// 返回成功响应
	response.Success(c, resp)
}

// UpdateVehicle 处理更新车辆信息请求
func UpdateVehicle(c *gin.Context) {
	// 获取车辆ID
	vehicleID := c.Param("vehicle_id")

	// 定义请求结构体并绑定 JSON 数据
	var req VehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

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

	// 解析保险到期日期
	insuranceExpiry, err := time.Parse("2006-01-02", req.InsuranceExpiry)
	if err != nil {
		response.Fail(c, response.ErrInvalidRequest.WithTips("保险到期日期格式错误"))
		return
	}

	// 查找车辆
	var vehicle model.Vehicle
	if err := database.DB.Where("id = ?", vehicleID).First(&vehicle).Error; err != nil {
		response.Fail(c, response.ErrNotFound)
		return
	}

	// 检查车辆是否属于当前司机
	if vehicle.DriverID != payload.OpenID {
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	// 删除该司机已有的待审核记录
	database.DB.Where("driver_id = ? AND status = ?", payload.RoleID, "pending").Delete(&model.VehicleReview{})

	// 创建车辆信息更新审核记录
	vehicleReview := model.VehicleReview{
		DriverID:          payload.OpenID,
		PlateNumber:       req.PlateNumber,
		VehicleType:       req.VehicleType,
		Brand:             req.Brand,
		ModelName:         req.Model,
		Color:             req.Color,
		Year:              req.Year,
		RegistrationImage: req.RegistrationImage,
		InsuranceExpiry:   insuranceExpiry,
		Status:            "pending",
		ActionType:        "update",
		VehicleID:         vehicle.ID, // 关联到现有车辆记录
	}

	// 保存审核记录
	if err := database.DB.Create(&vehicleReview).Error; err != nil {
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 构造响应数据
	resp := map[string]interface{}{
		"vehicle_id":    vehicleReview.ID,
		"status":        "pending",
		"verify_status": "verifying",
		"submit_time":   time.Now().UTC().Format(time.RFC3339),
	}

	// 返回成功响应
	response.Success(c, resp)
}

// GetVehicle 处理获取单个车辆信息请求
func GetVehicle(c *gin.Context) {
	// 获取车辆ID
	vehicleID := c.Param("vehicle_id")

	// 查找车辆
	var vehicle model.Vehicle
	if err := database.DB.Where("id = ?", vehicleID).First(&vehicle).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Fail(c, response.ErrNotFound)
		} else {
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
		}
		return
	}

	// 允许所有用户查看车辆信息
	// 移除了权限检查，任何登录用户都可以查看车辆详情

	// 查找司机信息
	var driver model.Driver
	driverName := ""
	driverPhone := ""
	if err := database.DB.Where("open_id = ?", vehicle.DriverID).First(&driver).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
			return
		}
		// 如果未找到司机记录，driverName和driverPhone将保持为空字符串
	} else {
		driverName = driver.Name
		driverPhone = driver.Phone
	}

	// 转换为响应格式
	resp := VehicleResponse{
		ID:                vehicle.ID,
		DriverID:          vehicle.DriverID,
		DriverName:        driverName,
		DriverPhone:       driverPhone,
		PlateNumber:       vehicle.PlateNumber,
		VehicleType:       vehicle.VehicleType,
		Brand:             vehicle.Brand,
		Model:             vehicle.ModelName,
		Color:             vehicle.Color,
		Year:              vehicle.Year,
		RegistrationImage: vehicle.RegistrationImage,
		InsuranceExpiry:   vehicle.InsuranceExpiry.Format("2006-01-02"),
		Status:            vehicle.Status,
		Comment:           vehicle.Comment,
		SubmitTime:        vehicle.SubmitTime.Format(time.RFC3339),
		ReviewTime: func() string {
			if vehicle.ReviewTime != nil {
				return vehicle.ReviewTime.Format("2006-01-02")
			}
			return ""
		}(),
		Reviewer: vehicle.Reviewer,
	}

	// 返回成功响应
	response.Success(c, resp)
}

// DeleteVehicle 处理删除车辆请求
func DeleteVehicle(c *gin.Context) {
	// 获取车辆ID
	vehicleID := c.Param("vehicle_id")

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

	// 查找车辆
	var vehicle model.Vehicle
	if err := database.DB.Where("id = ?", vehicleID).First(&vehicle).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			response.Fail(c, response.ErrNotFound)
		} else {
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
		}
		return
	}

	// 检查权限：用户只能删除自己的车辆，管理员可以删除任何车辆
	if payload.RoleID != 3 && vehicle.DriverID != payload.OpenID {
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	// 删除车辆
	if err := database.DB.Delete(&vehicle).Error; err != nil {
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 返回成功响应
	response.Success(c, nil)
}

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
	ID          string `json:"id"`           // 车辆ID
	DriverID    string `json:"driver_id"`    // 司机ID
	DriverName  string `json:"driver_name"`  // 司机姓名
	PlateNumber string `json:"plate_number"` // 车牌号码
	VehicleType string `json:"vehicle_type"` // 车辆类型
	Brand       string `json:"brand"`        // 车辆品牌
	Model       string `json:"model"`        // 车辆型号
	Status      string `json:"status"`       // 状态
	SubmitTime  string `json:"submit_time"`  // 提交时间
	ReviewTime  string `json:"review_time"`  // 审核时间
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
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 如果车牌号码已存在，返回错误
	if err == nil {
		response.Fail(c, response.ErrAlreadyExists.WithTips("车牌号码已存在"))
		return
	}

	// 删除该司机已有的待审核记录
	database.DB.Where("driver_id = ? AND status = ?", payload.RoleID, "pending").Delete(&model.VehicleReview{})

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
		"vehicle_id":    fmt.Sprintf("vehicle_%d", vehicleReview.ID),
		"status":        "pending",
		"verify_status": "verifying",
		"submit_time":   time.Now().UTC().Format(time.RFC3339),
	}

	// 返回成功响应
	response.Success(c, resp)
}

// GetVehicles 处理获取车辆列表请求
func GetVehicles(c *gin.Context) {
	// 获取查询参数
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")

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

	query = query.Where("open_id = ?", &payload.OpenID)

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
		vehicleList[i] = VehicleResponse{
			ID:          fmt.Sprintf("vehicle_%d", v.ID),
			DriverID:    fmt.Sprintf("driver_%d", v.DriverID),
			PlateNumber: v.PlateNumber,
			VehicleType: v.VehicleType,
			Brand:       v.Brand,
			Model:       v.ModelName,
			Status:      v.Status,
			SubmitTime:  v.SubmitTime.Format(time.RFC3339),
			ReviewTime: func() string {
				if v.ReviewTime != nil {
					return v.ReviewTime.Format(time.RFC3339)
				}
				return ""
			}(),
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

	// 从vehicle_id中提取数字部分
	var vehicleIDNum uint
	fmt.Sscanf(vehicleID, "vehicle_%d", &vehicleIDNum)

	// 查找车辆
	var vehicle model.Vehicle
	if err := database.DB.Where("id = ?", vehicleIDNum).First(&vehicle).Error; err != nil {
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
		"vehicle_id":    fmt.Sprintf("vehicle_%d", vehicleReview.ID),
		"status":        "pending",
		"verify_status": "verifying",
		"submit_time":   time.Now().UTC().Format(time.RFC3339),
	}

	// 返回成功响应
	response.Success(c, resp)
}

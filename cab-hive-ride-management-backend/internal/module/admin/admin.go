package admin

import (
	"cab-hive/internal/global/database"
	"cab-hive/internal/global/response"
	"cab-hive/internal/model"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
	"gorm.io/gorm"
)

// UserResponse 定义用户信息响应的结构体
type UserResponse struct {
	ID       uint   `json:"id"`
	RoleID   int    `json:"role_id"`
	NickName string `json:"nick_name"`
	OpenID   string `json:"open_id"`
}

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

// GetAllUsers 处理查询所有用户请求
func GetAllUsers(c *gin.Context) {
	// 获取查询参数
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")

	// 解析分页参数
	pageNum := 1
	size := 10
	fmt.Sscanf(page, "%d", &pageNum)
	fmt.Sscanf(pageSize, "%d", &size)

	// 构建查询条件
	query := database.DB.Model(&model.User{})

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
			ID:       u.ID,
			RoleID:   u.RoleID,
			NickName: u.NickName,
			OpenID:   u.OpenID,
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

// GetAllDrivers 处理查询所有司机请求
func GetAllDrivers(c *gin.Context) {
	// 获取查询参数
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")

	// 解析分页参数
	pageNum := 1
	size := 10
	fmt.Sscanf(page, "%d", &pageNum)
	fmt.Sscanf(pageSize, "%d", &size)

	// 构建查询条件
	query := database.DB.Model(&model.Driver{})

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

// GetPendingDrivers 处理查询待审核司机信息请求
func GetPendingDrivers(c *gin.Context) {
	// 获取查询参数
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")

	// 解析分页参数
	pageNum := 1
	size := 10
	fmt.Sscanf(page, "%d", &pageNum)
	fmt.Sscanf(pageSize, "%d", &size)

	// 构建查询条件
	query := database.DB.Model(&model.DriverReview{}).Where("status = ?", "pending")

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

// GetPendingVehicles 处理查询待审核车辆信息请求
func GetPendingVehicles(c *gin.Context) {
	// 获取查询参数
	page := c.DefaultQuery("page", "1")
	pageSize := c.DefaultQuery("page_size", "10")

	// 解析分页参数
	pageNum := 1
	size := 10
	fmt.Sscanf(page, "%d", &pageNum)
	fmt.Sscanf(pageSize, "%d", &size)

	// 构建查询条件
	query := database.DB.Model(&model.VehicleReview{}).Where("status = ?", "pending")

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
			InsuranceExpiry:   vr.InsuranceExpiry.Format(time.RFC3339),
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

	// 从ID中提取数字部分
	var reviewIDNum uint
	fmt.Sscanf(reviewID, "%d", &reviewIDNum)

	// 查找车辆审核记录
	var vehicleReview model.VehicleReview
	if err := database.DB.Where("id = ?", reviewIDNum).First(&vehicleReview).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Error("车辆审核记录不存在", "id", reviewIDNum)
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
	log.Info("车辆审核成功", "id", reviewIDNum, "action", req.Action)
	response.Success(c, nil)
}

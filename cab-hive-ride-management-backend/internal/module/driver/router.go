package driver

import (
	"cab-hive/internal/global/middleware"

	"github.com/gin-gonic/gin"
)

// InitRouter 初始化司机模块的路由
func (m *ModuleDriver) InitRouter(r *gin.RouterGroup) {
	// 注册司机相关路由

	// 司机注册接口 - 需要用户认证
	// 接口地址: POST /api/auth/driver/register
	r.POST("/auth/driver/register", middleware.Auth(1), DriverRegister)

	// 司机自我更新信息接口 - 需要用户认证
	// 接口地址: POST /api/auth/driver/self-update
	r.PUT("/auth/driver/self-update", middleware.Auth(1), DriverSelfUpdateHandler)

	// 获取所有司机列表 - 需要用户认证（信息公开）
	// 接口地址: GET /api/users/drivers
	r.GET("/users/drivers", middleware.Auth(1), GetAllDrivers)

	// 获取司机信息 - 需要用户认证
	// 接口地址: GET /api/users/drivers/info
	r.GET("/users/drivers/info", middleware.Auth(1), GetDriver)
	// 接口地址: GET /api/users/drivers/info/:id
	r.GET("/users/drivers/info/:id", middleware.Auth(1), GetDriver)

	// 封禁司机 - 需要管理员认证
	// 接口地址: PUT /api/users/drivers/:id/ban
	r.PUT("/users/drivers/:id/ban", middleware.Auth(3), BanDriver)

	// 解封司机 - 需要管理员认证
	// 接口地址: PUT /api/users/drivers/:id/unban
	r.PUT("/users/drivers/:id/unban", middleware.Auth(3), UnbanDriver)

	// 获取待审核司机列表 - 需要管理员认证
	// 接口地址: GET /api/admin/drivers/pending
	r.GET("/admin/drivers/pending", middleware.Auth(3), GetPendingDrivers)

	// 获取待审核司机详情 - 需要用户或管理员认证
	// 接口地址: GET /api/users/drivers/pending/:id
	r.GET("/users/drivers/pending/:id", middleware.Auth(1), GetPendingDriver)

	// 审核司机 - 需要管理员认证
	// 接口地址: POST /api/admin/drivers/review/:id
	r.POST("/admin/drivers/review/:id", middleware.Auth(3), ReviewDriver)

	// 获取司机名下车辆列表 - 需要用户认证
	// 接口地址: GET /api/users/drivers/:id/vehicles
	r.GET("/users/drivers/:id/vehicles", middleware.Auth(1), GetDriverVehicles)

	// 获取司机自己的所有司机审核信息列表 - 需要用户认证
	// 接口地址: GET /api/users/drivers/self/pending
	r.GET("/users/drivers/self/pending", middleware.Auth(1), GetSelfPendingDrivers)
}

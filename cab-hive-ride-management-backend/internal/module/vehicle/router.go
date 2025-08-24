package vehicle

import (
	"cab-hive/internal/global/middleware"

	"github.com/gin-gonic/gin"
)

// InitRouter 初始化车辆模块的路由
// 将车辆相关的 HTTP 端点挂载到指定的路由组
// 该方法会在模块初始化时被调用
// 参数:
//   - r: gin.RouterGroup，表示父路由组，用于挂载子路由
func (v *ModuleVehicle) InitRouter(r *gin.RouterGroup) {
	// 定义车辆模块的路由组，所有车辆相关端点以 /vehicles 为前缀
	vehicleGroup := r.Group("/vehicles")

	// 需要司机或管理员权限的端点
	vehicleGroup.Use(middleware.Auth(2))
	{
		// 注册提交车辆信息端点
		vehicleGroup.POST("", SubmitVehicle)

		// 注册获取车辆列表端点
		vehicleGroup.GET("", GetVehicles)

		// 注册获取单个车辆信息端点
		vehicleGroup.GET("/:vehicle_id", GetVehicle)

		// 注册获取单个待审核车辆信息详情端点
		vehicleGroup.GET("/pending/:id", GetPendingVehicle)

		// 注册更新车辆信息端点
		vehicleGroup.PUT("/:vehicle_id", UpdateVehicle)

		// 注册获取司机自己的所有车辆审核信息列表端点
		// 接口地址: GET /api/users/vehicles/self/pending
		vehicleGroup.GET("/self/pending", GetSelfPendingVehicles)

		// 注册删除车辆端点
		vehicleGroup.DELETE("/:vehicle_id", DeleteVehicle)
	}

	// 需要管理员权限的端点
	adminVehicleGroup := r.Group("/admin/vehicles")
	adminVehicleGroup.Use(middleware.Auth(3))
	{
		// 查询待审核车辆信息
		adminVehicleGroup.GET("/pending", GetPendingVehicles)

		// 查询单个待审核车辆信息详情
		adminVehicleGroup.GET("/pending/:id", GetPendingVehicle)

		// 审核车辆信息
		adminVehicleGroup.POST("/review/:id", ReviewVehicle)

		// 删除车辆
		adminVehicleGroup.DELETE("/:vehicle_id", DeleteVehicle)
	}
}

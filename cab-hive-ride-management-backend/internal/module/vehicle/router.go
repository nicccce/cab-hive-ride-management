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

		// 注册更新车辆信息端点
		vehicleGroup.PUT("/:vehicle_id", UpdateVehicle)
	}
}

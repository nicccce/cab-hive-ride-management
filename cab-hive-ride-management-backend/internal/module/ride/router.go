package ride

import (
	"cab-hive/internal/global/middleware"

	"github.com/gin-gonic/gin"
)

// InitRouter 初始化乘车模块的路由
// 将乘车相关的 HTTP 端点挂载到指定的路由组
// 该方法会在模块初始化时被调用
// 参数:
//   - r: gin.RouterGroup，表示父路由组，用于挂载子路由
func (m *ModuleRide) InitRouter(r *gin.RouterGroup) {
	// 定义乘车模块的路由组，所有乘车相关端点以 /rides 为前缀
	rideGroup := r.Group("/rides")
	
	// 司机位置相关路由 - 需要司机或管理员权限
	rideGroup.Use(middleware.Auth(2))
	{
		// 司机上传位置
		rideGroup.POST("/location", UploadLocation)
		// 司机请求订单
		rideGroup.GET("/order/request", RequestOrder)
		// 司机接单
		rideGroup.POST("/order/take", TakeOrder)
	}
	
	// 获取司机位置 - 需要用户认证（信息公开）
	rideGroup.Use(middleware.Auth(1))
	{
		// 获取司机位置
		rideGroup.GET("/location/:id", GetDriverLocation)
	}
	
	// 管理员路由 - 需要管理呈权限
	rideGroup.Use(middleware.Auth(3))
	{
		// 处理预约订单
		rideGroup.POST("/orders/process-reserve", ProcessReserveOrders)
	}
}

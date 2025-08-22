package admin

import (
	"cab-hive/internal/global/middleware"

	"github.com/gin-gonic/gin"
)

// InitRouter 初始化管理模块的路由
// 将管理相关的 HTTP 端点挂载到指定的路由组
// 该方法会在模块初始化时被调用
// 参数:
//   - r: gin.RouterGroup，表示父路由组，用于挂载子路由
func (u *ModuleAdmin) InitRouter(r *gin.RouterGroup) {
	// 定义管理模块的路由组，所有管理相关端点以 /admin 为前缀
	adminGroup := r.Group("/admin")

	// 添加管理员权限验证中间件，只有角色ID为3的管理员才能访问
	adminGroup.Use(middleware.Auth(3))
	{
		// 查询所有用户
		adminGroup.GET("/users", GetAllUsers)
		
		// 查询所有司机
		adminGroup.GET("/drivers", GetAllDrivers)
		
		// 查询待审核司机信息
		adminGroup.GET("/drivers/pending", GetPendingDrivers)
		
		// 查询待审核车辆信息
		adminGroup.GET("/vehicles/pending", GetPendingVehicles)
		
		// 审核司机信息
		adminGroup.POST("/drivers/review/:id", ReviewDriver)
		
		// 审核车辆信息
		adminGroup.POST("/vehicles/review/:id", ReviewVehicle)
	}
}
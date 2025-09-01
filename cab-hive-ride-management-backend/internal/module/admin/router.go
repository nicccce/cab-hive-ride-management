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
		// 预警相关路由
		adminGroup.GET("/alerts/:id", GetAlert)                 // 获取单个预警详细信息
		adminGroup.GET("/alerts", GetAlerts)                    // 获取预警列表
		adminGroup.POST("/alerts/:id/process", ProcessAlert)    // 处理预警
		adminGroup.GET("/alerts/redis", GetRedisAlerts)         // 获取Redis中的预警列表并清空
	}
}
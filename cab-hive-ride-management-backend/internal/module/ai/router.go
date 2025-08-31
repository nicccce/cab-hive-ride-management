package ai

import (
	"cab-hive/internal/global/middleware"

	"github.com/gin-gonic/gin"
)

// InitRouter 初始化AI客服模块的路由
// 将AI客服相关的 HTTP 端点挂载到指定的路由组
// 该方法会在模块初始化时被调用
// 参数:
//   - r: gin.RouterGroup，表示父路由组，用于挂载子路由
func (a *ModuleAI) InitRouter(r *gin.RouterGroup) {
	// 定义AI客服模块的路由组，所有AI客服相关端点以 /ai 为前缀
	aiGroup := r.Group("/ai")

	// 添加普通用户权限验证中间件，角色ID为1或以上的用户可以访问
	aiGroup.Use(middleware.Auth(1))
	{
		// 用户向AI客服提问
		aiGroup.POST("/chat", ChatWithAI)
	}
}
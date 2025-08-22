package auth

import (
	"cab-hive/internal/global/middleware"

	"github.com/gin-gonic/gin"
)

// InitRouter 初始化认证模块的路由
// 将认证相关的 HTTP 端点挂载到指定的路由组
// 该方法会在模块初始化时被调用
// 参数:
//   - r: gin.RouterGroup，表示父路由组，用于挂载子路由
func (u *ModuleAuth) InitRouter(r *gin.RouterGroup) {
	// 定义认证模块的路由组，所有认证相关端点以 /auth 为前缀
	authGroup := r.Group("/auth")

	// 注册微信登录端点，处理微信登录请求
	authGroup.POST("/wechat/login", WeChatLogin)

	// 注册管理员登录端点，处理管理员登录请求
	authGroup.POST("/admin/login", AdminLogin)

	authGroup.Use(middleware.Auth(1))
	{
		// 注册令牌刷新端点，处理令牌刷新请求
		authGroup.POST("/refresh", RefreshToken)

		// 注册司机注册端点，处理司机注册请求
		authGroup.POST("/driver/register", DriverRegister)

		// 注册司机自我更新信息端点，处理司机自我更新信息请求
		authGroup.POST("/driver/self-update", DriverSelfUpdateHandler)
	}
}

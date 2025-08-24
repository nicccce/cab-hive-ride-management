package user

import (
	"cab-hive/internal/global/middleware"

	"github.com/gin-gonic/gin"
)

// InitRouter 初始化用户模块的路由
// 将用户相关的 HTTP 端点挂载到指定的路由组
// 该方法会在模块初始化时被调用
// 参数:
//   - r: gin.RouterGroup，表示父路由组，用于挂载子路由
func (u *ModuleUser) InitRouter(r *gin.RouterGroup) {
	// 定义用户模块的路由组，所有用户相关端点以 /users 为前缀
	userGroup := r.Group("/users")

	// 添加管理员权限验证中间件，只有角色ID为3的管理员才能访问
	adminGroup := userGroup.Group("")
	adminGroup.Use(middleware.Auth(3))
	{
		// 查询所有用户
		adminGroup.GET("", GetAllUsers)
	}

	// 添加普通用户权限验证中间件，角色ID为1或以上的用户可以访问
	// 注意：为了避免路由冲突，我们只在非管理员路径上应用用户权限中间件
	userGroup.Use(middleware.Auth(1))
	{
		// 查询当前用户个人信息
		userGroup.GET("/profile", GetProfile)
		
		// 更新当前用户个人信息
		userGroup.PUT("/profile", UpdateProfile)
		
		// 重置当前用户个人信息（将昵称和头像重置为默认值）
		userGroup.PUT("/profile/reset", ResetProfile)
	}

	// 添加管理员权限验证中间件，只有角色ID为3的管理员才能访问
	adminUserGroup := userGroup.Group("")
	adminUserGroup.Use(middleware.Auth(3))
	{
		// 管理员重置用户个人信息（将指定用户的昵称和头像重置为默认值）
		adminUserGroup.PUT("/profile/reset/:id", AdminResetUserProfile)
	}
	// 注意：移除了重复的路由定义，避免与管理员组的路由冲突
}

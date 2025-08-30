package feedback

import (
	"cab-hive/internal/global/middleware"

	"github.com/gin-gonic/gin"
)

// InitRouter 初始化反馈模块的路由
// 将反馈相关的 HTTP 端点挂载到指定的路由组
// 该方法会在模块初始化时被调用
// 参数:
//   - r: gin.RouterGroup，表示父路由组，用于挂载子路由
func (f *ModuleFeedback) InitRouter(r *gin.RouterGroup) {
	// 定义反馈模块的路由组，所有反馈相关端点以 /feedback 为前缀
	feedbackGroup := r.Group("/feedback")

	// 添加普通用户权限验证中间件，角色ID为1或以上的用户可以访问
	feedbackGroup.Use(middleware.Auth(1))
	{
		// 用户创建反馈
		feedbackGroup.POST("", CreateFeedback)
		
		// 用户查看自己的反馈列表
		feedbackGroup.GET("", GetUserFeedbackList)
		
		// 用户查看自己的反馈详情
		feedbackGroup.GET("/:id", GetUserFeedbackDetail)
	}

	// 添加管理员权限验证中间件，只有角色ID为3的管理员才能访问
	adminFeedbackGroup := r.Group("/feedback")
	adminFeedbackGroup.Use(middleware.Auth(3))
	{
		// 管理员查看所有反馈列表（支持分页和条件查询）
		adminFeedbackGroup.GET("/admin", GetAdminFeedbackList)
		
		// 管理员查看反馈详情
		adminFeedbackGroup.GET("/admin/:id", GetAdminFeedbackDetail)
		
		// 管理员回复反馈
		adminFeedbackGroup.PUT("/admin/:id/reply", ReplyFeedback)
		
		// 管理员更新反馈状态
		adminFeedbackGroup.PUT("/admin/:id/status", UpdateFeedbackStatus)
	}
}
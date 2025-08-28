package ride

import (
	"cab-hive/internal/global/middleware"

	"github.com/gin-gonic/gin"
)

// InitRouter 初始化订单模块的路由
func (m *ModuleRide) InitRouter(router *gin.RouterGroup) {
	// 创建立即出发订单的路由
	// 需要用户认证
	router.POST("/rides/immediate", middleware.Auth(1), CreateImmediateOrder)
	
	// 获取订单详情
	// 需要用户认证
	router.GET("/rides/:id", middleware.Auth(1), GetOrder)
	
	// 获取用户未完成订单
	// 需要用户认证
	router.GET("/rides/unfinished", middleware.Auth(1), GetUnfinishedOrder)
}

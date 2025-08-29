package order

import (
	"cab-hive/internal/global/middleware"

	"github.com/gin-gonic/gin"
)

// InitRouter 初始化订单模块的路由
func (m *ModuleOrder) InitRouter(router *gin.RouterGroup) {
	// 创建立即出发订单的路由
	// 需要用户认证
	router.POST("/orders/immediate", middleware.Auth(1), CreateImmediateOrder)

	// 创建预约订单的路由
	// 需要用户认证
	router.POST("/orders/reserve", middleware.Auth(1), CreateReserveOrder)

	// 获取订单详情
	// 需要用户认证
	router.GET("/orders/:id", middleware.Auth(1), GetOrder)

	// 获取用户未完成订单
	// 需要用户认证
	router.GET("/orders/unfinished", middleware.Auth(1), GetUnfinishedOrder)

	// 获取司机未完成订单
	// 需要司机认证
	router.GET("/orders/driver/unfinished", middleware.Auth(2), GetDriverUnfinishedOrder)

	// 获取用户所有订单（支持分页和条件查询）
	// 需要用户认证
	router.GET("/orders", middleware.Auth(1), GetUserOrders)

	// 获取司机所有订单（支持分页和条件查询）
	// 需要司机认证
	router.GET("/orders/driver", middleware.Auth(2), GetDriverOrders)

	// 获取所有订单（管理员接口，支持分页和条件查询）
	// 需要管理员认证
	router.GET("/orders/admin", middleware.Auth(3), GetAllOrders)
}

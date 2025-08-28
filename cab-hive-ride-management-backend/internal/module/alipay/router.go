package alipay

import (
	"cab-hive/internal/global/middleware"

	"github.com/gin-gonic/gin"
)

// InitRouter 初始化支付宝模块的路由
func (u *ModuleAlipay) InitRouter(router *gin.RouterGroup) {
	// 创建支付订单
	// 需要用户认证
	router.POST("/payment/create", middleware.Auth(1), CreatePayment)
	
	// 查询订单支付状态
	// 需要用户认证
	router.POST("/payment/query", middleware.Auth(1), QueryOrder)
	
	// 支付宝异步通知回调
	router.POST("/payment/notify", NotifyHandler)
	
	// 支付宝同步返回
	router.GET("/payment/return", ReturnHandler)
}

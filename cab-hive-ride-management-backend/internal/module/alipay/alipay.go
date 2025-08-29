package alipay

import (
	"context"
	"fmt"
	"net/http"

	"cab-hive/config"
	"cab-hive/internal/global/database"
	"cab-hive/internal/global/response"
	"cab-hive/internal/model"

	"github.com/gin-gonic/gin"
	"github.com/smartwalle/alipay/v3"
)

// CreatePaymentRequest 创建支付请求结构体
type CreatePaymentRequest struct {
	OrderID string  `json:"order_id" binding:"required"`
	Amount  float64 `json:"amount" binding:"required,gt=0"`
	Subject string  `json:"subject" binding:"required"`
	UserID  string  `json:"user_id" binding:"required"`
}

// CreatePaymentResponse 创建支付响应结构体
type CreatePaymentResponse struct {
	PayURL string `json:"pay_url"`
}

// QueryOrderRequest 查询订单请求结构体
type QueryOrderRequest struct {
	OrderID string `json:"order_id" binding:"required"`
}

// QueryOrderResponse 查询订单响应结构体
type QueryOrderResponse struct {
	TradeStatus string `json:"trade_status"`
	TradeNo     string `json:"trade_no"`
}

// updateOrderStatus 更新订单状态
func updateOrderStatus(orderID string, status string) error {
	// 从ID中提取数字部分
	var orderIDNum uint
	fmt.Sscanf(orderID, "%d", &orderIDNum)

	// 更新订单状态
	result := database.DB.Model(&model.Order{}).Where("id = ?", orderIDNum).Update("status", status)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("未找到订单: %s", orderID)
	}

	return nil
}

// recordPaymentTime 记录支付时间
func recordPaymentTime(orderID string, paymentTime interface{}) error {
	// 从ID中提取数字部分
	var orderIDNum uint
	fmt.Sscanf(orderID, "%d", &orderIDNum)

	// 记录支付时间
	result := database.DB.Model(&model.Order{}).Where("id = ?", orderIDNum).Update("payment_time", paymentTime)
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("未找到订单: %s", orderID)
	}

	return nil
}

// CreatePayment 创建支付订单
func CreatePayment(c *gin.Context) {
	// 获取支付宝客户端
	client := GetAlipayClient()
	if client == nil {
		response.Fail(c, response.ErrServerInternal.WithTips("支付宝客户端未初始化"))
		return
	}

	var req CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

	// 获取支付宝配置
	cfg := config.Get().AliPay

	// 金额转换为字符串，保留两位小数
	amountStr := fmt.Sprintf("%.2f", req.Amount)

	var p = alipay.TradeWapPay{}
	p.NotifyURL = cfg.NotifyURL
	p.ReturnURL = cfg.ReturnURL
	p.Subject = req.Subject
	p.OutTradeNo = req.OrderID
	p.TotalAmount = amountStr
	p.ProductCode = "QUICK_WAP_WAY"

	url, err := client.TradeWapPay(p)
	if err != nil {
		response.Fail(c, response.ErrServerInternal.WithOrigin(err))
		return
	}

	// 更新订单状态为等待付款
	if err := updateOrderStatus(req.OrderID, model.OrderStatusWaitingForPayment); err != nil {
		// 不返回错误，因为支付链接已经生成
	}

	resp := CreatePaymentResponse{
		PayURL: url.String(),
	}

	response.Success(c, resp)
}

// QueryOrder 查询订单支付状态
func QueryOrder(c *gin.Context) {
	// 获取支付宝客户端
	client := GetAlipayClient()
	if client == nil {
		response.Fail(c, response.ErrServerInternal.WithTips("支付宝客户端未初始化"))
		return
	}

	var req QueryOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

	var p = alipay.TradeQuery{}
	p.OutTradeNo = req.OrderID

	// 使用context.Background()作为第一个参数
	result, err := client.TradeQuery(context.Background(), p)
	if err != nil {
		response.Fail(c, response.ErrServerInternal.WithOrigin(err))
		return
	}

	resp := QueryOrderResponse{
		TradeStatus: string(result.TradeStatus), // 转换为string类型
		TradeNo:     result.TradeNo,
	}

	response.Success(c, resp)
}

// NotifyHandler 支付宝异步通知处理
func NotifyHandler(c *gin.Context) {
	// 获取支付宝客户端
	client := GetAlipayClient()
	if client == nil {
		c.String(http.StatusInternalServerError, "fail")
		return
	}

	// 使用GetTradeNotification处理通知，传入*http.Request
	noti, err := client.GetTradeNotification(c.Request)
	if err != nil {
		c.String(http.StatusInternalServerError, "fail")
		return
	}

	if noti.TradeStatus == alipay.TradeStatusSuccess {
		// 处理支付成功的业务逻辑
		orderID := noti.OutTradeNo

		// 更新订单状态
		if err := updateOrderStatus(orderID, model.OrderStatusWaitingForPickup); err != nil {
			c.String(http.StatusInternalServerError, "fail")
			return
		}

		// 记录支付时间
		if err := recordPaymentTime(orderID, noti.GmtPayment); err != nil { // GmtPayment本身就是string类型
			c.String(http.StatusInternalServerError, "fail")
			return
		}

		c.String(http.StatusOK, "success")
		return
	}

	c.String(http.StatusOK, "success")
}

// ReturnHandler 支付宝同步返回处理
func ReturnHandler(c *gin.Context) {
	// 获取支付宝客户端
	client := GetAlipayClient()
	if client == nil {
		response.Fail(c, response.ErrServerInternal.WithTips("支付宝客户端未初始化"))
		return
	}

	// 验证签名
	if err := client.VerifySign(c.Request.URL.Query()); err != nil {
		response.Fail(c, response.ErrInvalidRequest.WithTips("支付验证失败"))
		return
	}

	// 获取订单ID
	orderID := c.Request.URL.Query().Get("out_trade_no")

	// 返回成功页面
	c.HTML(http.StatusOK, "payment_success.html", gin.H{
		"order_id": orderID,
		"trade_no": c.Request.URL.Query().Get("trade_no"),
	})
}

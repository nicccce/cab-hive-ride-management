package ai

import (
	"bufio"
	"bytes"
	"cab-hive/config"
	"cab-hive/internal/global/jwt"
	"cab-hive/internal/global/response"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ChatRequest 定义用户聊天请求的结构体
type ChatRequest struct {
	Message string `json:"message" binding:"required"`
}

// OpenAIRequest 定义向OpenAI发送请求的结构体
type OpenAIRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Stream   bool      `json:"stream"`
}

// Message 定义聊天消息的结构体
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// OpenAIResponse 定义OpenAI响应的结构体
type OpenAIResponse struct {
	ID      string   `json:"id"`
	Object  string   `json:"object"`
	Created int64    `json:"created"`
	Model   string   `json:"model"`
	Choices []Choice `json:"choices"`
}

// Choice 定义OpenAI响应中选择项的结构体
type Choice struct {
	Index        int     `json:"index"`
	Delta        Message `json:"delta"`
	FinishReason *string `json:"finish_reason"`
}

// ChatWithAI 处理用户与AI客服聊天的请求
func ChatWithAI(c *gin.Context) {
	// 从上下文中获取用户信息
	payload, exists := c.Get("payload")
	if !exists {
		log.Error("无法获取用户信息")
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	// 断言 payload 为 jwt.Claims 类型
	claims, ok := payload.(*jwt.Claims)
	if !ok {
		log.Error("用户信息类型错误")
		response.Fail(c, response.ErrUnauthorized)
		return
	}

	// 解析请求参数
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Error("请求参数解析失败", "error", err)
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

	// 获取OpenAI配置
	openAIConfig := config.Get().OpenAI
	if openAIConfig.APIKey == "" {
		log.Error("OpenAI API Key未配置")
		response.Fail(c, response.ErrServerInternal.WithTips("AI服务未正确配置"))
		return
	}

	// 构建OpenAI请求
	openAIReq := OpenAIRequest{
		Model: openAIConfig.Model,
		Messages: []Message{
			{Role: "system", Content: "你是一个网约车服务平台：智蜂出行的客服助手，请用中文回答用户的问题。" +
				"常见问题：1.如何注册为乘客：点击微信登录，自动注册为乘客。" +
				"2.如何注册为司机：微信登录后，点击“个人中心”，选择“注册为司机”，填写司机信息，提交认证，等待审核。" +
				"3.为何需要定位权限：1.获取用户位置。2.提供导航服务。3.保障用户安全。"},
			{Role: "user", Content: req.Message},
		},
		Stream: true, // 启用流式响应
	}

	// 将请求体序列化为JSON
	jsonData, err := json.Marshal(openAIReq)
	if err != nil {
		log.Error("序列化OpenAI请求失败", "error", err)
		response.Fail(c, response.ErrServerInternal.WithOrigin(err))
		return
	}

	// 创建HTTP请求
	request, err := http.NewRequest("POST", config.Get().OpenAI.BaseUrl, bytes.NewBuffer(jsonData))
	if err != nil {
		log.Error("创建OpenAI请求失败", "error", err)
		response.Fail(c, response.ErrServerInternal.WithOrigin(err))
		return
	}

	// 设置请求头
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+openAIConfig.APIKey)

	// 发送请求
	client := &http.Client{}
	resp, err := client.Do(request)
	if err != nil {
		log.Error("发送OpenAI请求失败", "error", err)
		response.Fail(c, response.ErrServerInternal.WithOrigin(err))
		return
	}
	defer resp.Body.Close()

	// 检查响应状态码
	if resp.StatusCode != http.StatusOK {
		log.Error("OpenAI API返回错误状态码", "status_code", resp.StatusCode)
		response.Fail(c, response.ErrServerInternal.WithTips(fmt.Sprintf("AI服务返回错误: %d", resp.StatusCode)))
		return
	}

	// 设置SSE响应头
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")

	// 流式读取响应并转发给客户端
	reader := bufio.NewReader(resp.Body)
	c.Stream(func(w io.Writer) bool {
		for {
			line, err := reader.ReadString('\n')
			if err != nil {
				if err == io.EOF {
					return false
				}
				log.Error("读取OpenAI响应失败", "error", err)
				return false
			}

			// 打印调试信息
			//log.Info("从OpenAI接收到的数据", "line", line)

			// 直接转发OpenAI的数据（它已经是正确的SSE格式）
			_, writeErr := w.Write([]byte(line))
			if writeErr != nil {
				log.Error("转发数据到客户端失败", "error", writeErr)
				return false
			}

			// 确保数据立即发送到客户端
			if flusher, ok := w.(http.Flusher); ok {
				flusher.Flush()
			}

			// 如果客户端断开连接，则停止发送数据
			if c.Request.Context().Err() != nil {
				log.Info("客户端断开连接")
				return false
			}
		}
	})

	// 记录成功日志
	log.Info("用户与AI客服聊天成功", "user_open_id", claims.OpenID)
}

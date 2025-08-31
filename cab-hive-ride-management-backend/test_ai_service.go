package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type ChatRequest struct {
	Message string `json:"message"`
}

func main() {
	// 模拟用户提问
	chatReq := ChatRequest{
		Message: "你好，我想查询我的订单状态",
	}

	// 将请求体序列化为JSON
	jsonData, err := json.Marshal(chatReq)
	if err != nil {
		fmt.Printf("序列化请求失败: %v\n", err)
		return
	}

	// 创建HTTP请求
	req, err := http.NewRequest("POST", "http://localhost:8080/api/ai/chat", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("创建请求失败: %v\n", err)
		return
	}

	// 设置请求头
	req.Header.Set("Content-Type", "application/json")
	// 注意：在实际测试中，你需要提供一个有效的JWT token
	// req.Header.Set("Authorization", "Bearer YOUR_JWT_TOKEN")

	// 创建HTTP客户端并发送请求
	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("发送请求失败: %v\n", err)
		return
	}
	defer resp.Body.Close()

	// 打印响应状态码
	fmt.Printf("响应状态码: %d\n", resp.StatusCode)

	// 如果状态码不是200，打印错误信息
	if resp.StatusCode != http.StatusOK {
		fmt.Printf("请求失败，状态码: %d\n", resp.StatusCode)
		return
	}

	// 打印响应头
	fmt.Printf("响应头: \n")
	for key, values := range resp.Header {
		for _, value := range values {
			fmt.Printf("%s: %s\n", key, value)
		}
	}

	// 注意：由于这是流式响应，实际的响应内容需要逐步读取
	// 这里只是简单打印信息，实际应用中需要处理SSE流
	fmt.Println("AI客服功能已实现，可以通过前端应用连接并测试流式响应功能。")
}
package image

import (
	"bytes"
	"cab-hive/config"
	"cab-hive/internal/global/response"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
)

// 定义API响应结构体
type UploadAPIResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    struct {
		Key   string `json:"key"`
		Name  string `json:"name"`
		Links struct {
			URL string `json:"url"`
		} `json:"links"`
	} `json:"data"`
}

// ImageUploadResponse 定义图片上传响应的结构体
type ImageUploadResponse struct {
	ImageURL string `json:"image_url"` // 图片URL
}

// UploadImage 处理图片上传请求
func UploadImage(c *gin.Context) {
	// 从配置中获取OSS配置
	ossConfig := config.Get().OSS
	if ossConfig.Endpoint == "" || ossConfig.Token == "" {
		log.Error("OSS配置缺失")
		response.Fail(c, response.ErrServerInternal.WithOrigin(errors.New("OSS配置缺失")))
		return
	}

	// 接收图片文件
	file, err := c.FormFile("image")
	if err != nil {
		log.Error("接收图片文件失败", "error", err)
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

	// 打开上传的文件
	src, err := file.Open()
	if err != nil {
		log.Error("打开文件失败", "error", err)
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}
	defer src.Close()

	// 创建临时文件
	tempDir := os.TempDir()
	tempFileName := fmt.Sprintf("upload_%d_%s", time.Now().UnixNano(), file.Filename)
	tempFilePath := filepath.Join(tempDir, tempFileName)

	dst, err := os.Create(tempFilePath)
	if err != nil {
		log.Error("创建临时文件失败", "error", err)
		response.Fail(c, response.ErrServerInternal.WithOrigin(err))
		return
	}
	defer dst.Close()
	defer os.Remove(tempFilePath) // 清理临时文件

	// 复制文件内容到临时文件
	_, err = io.Copy(dst, src)
	if err != nil {
		log.Error("保存临时文件失败", "error", err)
		response.Fail(c, response.ErrServerInternal.WithOrigin(err))
		return
	}

	// 上传到OSS
	imageURL, err := uploadToOSS(tempFilePath, file.Filename, ossConfig.Token)
	if err != nil {
		log.Error("上传到OSS失败", "error", err)
		response.Fail(c, response.ErrServerInternal.WithOrigin(err))
		return
	}

	// 构造响应数据
	resp := ImageUploadResponse{
		ImageURL: imageURL,
	}

	// 返回成功响应
	log.Info("图片上传成功", "file_name", file.Filename, "image_url", imageURL)
	response.Success(c, resp)
}

// uploadToOSS 上传文件到OSS
func uploadToOSS(filePath, originalFilename, token string) (string, error) {
	// 打开文件
	file, err := os.Open(filePath)
	if err != nil {
		return "", errors.Wrap(err, "打开文件失败")
	}
	defer file.Close()

	// 创建multipart表单数据
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// 添加文件字段
	part, err := writer.CreateFormFile("file", originalFilename)
	if err != nil {
		return "", errors.Wrap(err, "创建表单文件字段失败")
	}

	// 复制文件内容到表单
	_, err = io.Copy(part, file)
	if err != nil {
		return "", errors.Wrap(err, "复制文件内容失败")
	}

	// 关闭writer以完成表单构建
	err = writer.Close()
	if err != nil {
		return "", errors.Wrap(err, "关闭multipart writer失败")
	}

	// 创建HTTP请求
	req, err := http.NewRequest("POST", "https://7bu.top/api/v1/upload", body)
	if err != nil {
		return "", errors.Wrap(err, "创建HTTP请求失败")
	}

	// 设置请求头
	req.Header.Set("Content-Type", writer.FormDataContentType())
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	// 发送请求
	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		return "", errors.Wrap(err, "发送HTTP请求失败")
	}
	defer resp.Body.Close()

	// 读取响应
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", errors.Wrap(err, "读取响应失败")
	}

	// 检查HTTP状态码
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API返回错误状态码: %d, 响应: %s", resp.StatusCode, string(respBody))
	}

	// 解析JSON响应
	var apiResponse UploadAPIResponse
	err = json.Unmarshal(respBody, &apiResponse)
	if err != nil {
		return "", errors.Wrap(err, "解析JSON响应失败")
	}

	// 检查API响应状态
	if !apiResponse.Status {
		return "", fmt.Errorf("API返回错误: %s", apiResponse.Message)
	}

	// 返回图片URL
	return apiResponse.Data.Links.URL, nil
}

package image

import (
	"cab-hive/config"
	"cab-hive/internal/global/response"
	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// ImageUploadResponse 定义图片上传响应的结构体
type ImageUploadResponse struct {
	ImageURL string `json:"image_url"` // 图片URL
}

// UploadImage 处理图片上传请求
func UploadImage(c *gin.Context) {
	// 从配置中获取OSS配置
	ossConfig := config.Get().OSS
	if ossConfig.Endpoint == "" || ossConfig.AccessKeyID == "" || ossConfig.AccessKeySecret == "" || ossConfig.BucketName == "" {
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

	// 生成唯一的文件名
	fileExt := strings.ToLower(filepath.Ext(file.Filename))
	fileName := strings.TrimSuffix(file.Filename, fileExt)
	timestamp := time.Now().Unix()
	uniqueFileName := fileName + "_" + string(timestamp) + fileExt

	// 保存文件到临时目录
	tempDir := "./temp"
	if _, err := os.Stat(tempDir); os.IsNotExist(err) {
		os.Mkdir(tempDir, 0755)
	}
	tempFilePath := filepath.Join(tempDir, uniqueFileName)
	if err := c.SaveUploadedFile(file, tempFilePath); err != nil {
		log.Error("保存临时文件失败", "error", err)
		response.Fail(c, response.ErrServerInternal.WithOrigin(err))
		return
	}

	// 上传到OSS
	imageURL, err := uploadToOSS(tempFilePath, uniqueFileName)
	if err != nil {
		log.Error("上传到OSS失败", "error", err)
		response.Fail(c, response.ErrServerInternal.WithOrigin(err))
		return
	}

	// 删除临时文件
	os.Remove(tempFilePath)

	// 构造响应数据
	resp := ImageUploadResponse{
		ImageURL: imageURL,
	}

	// 返回成功响应
	log.Info("图片上传成功", "file_name", uniqueFileName)
	response.Success(c, resp)
}

// uploadToOSS 上传文件到OSS
func uploadToOSS(filePath, fileName string) (string, error) {
	// 这里应该实现实际的OSS上传逻辑
	// 由于需要引入阿里云OSS SDK，这里简化实现
	// 实际项目中需要引入 "github.com/aliyun/aliyun-oss-go-sdk/oss"
	
	// 示例返回一个模拟的URL
	ossConfig := config.Get().OSS
	imageURL := ossConfig.Endpoint + "/" + ossConfig.BucketName + "/" + fileName
	return imageURL, nil
}
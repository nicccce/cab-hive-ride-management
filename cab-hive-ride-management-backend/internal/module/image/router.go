package image

import (
	"cab-hive/internal/global/middleware"

	"github.com/gin-gonic/gin"
)

// InitRouter 初始化图片模块的路由
// 将图片相关的 HTTP 端点挂载到指定的路由组
// 该方法会在模块初始化时被调用
// 参数:
//   - r: gin.RouterGroup，表示父路由组，用于挂载子路由
func (u *ModuleImage) InitRouter(r *gin.RouterGroup) {
	// 定义图片模块的路由组，所有图片相关端点以 /image 为前缀
	imageGroup := r.Group("/image")

	// 注册图片上传端点，处理图片上传请求
	imageGroup.POST("/upload", middleware.Auth(1), UploadImage)
}

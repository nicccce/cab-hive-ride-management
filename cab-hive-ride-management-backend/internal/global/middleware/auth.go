package middleware

import (
	"cab-hive/internal/global/jwt"
	"cab-hive/internal/global/response"
	"github.com/gin-gonic/gin"
	"strings"
)

func Auth(minRoleID int) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取 Authorization 头
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Fail(c, response.ErrTokenInvalid)
			c.Abort()
			return
		}

		// 检查 Bearer 前缀并提取 token
		if !strings.HasPrefix(authHeader, "Bearer ") {
			response.Fail(c, response.ErrTokenInvalid)
			c.Abort()
			return
		}
		token := strings.TrimPrefix(authHeader, "Bearer ")

		// 解析 token
		if payload, valid := jwt.ParseToken(token); !valid {
			response.Fail(c, response.ErrTokenInvalid)
			c.Abort()
			return
		} else if payload.RoleID < minRoleID {
			response.Fail(c, response.ErrUnauthorized)
			c.Abort()
			return
		} else {
			c.Set("payload", payload)
		}
		c.Next()
	}
}

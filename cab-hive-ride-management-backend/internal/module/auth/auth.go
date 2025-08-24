package auth

import (
	"cab-hive/config"
	"cab-hive/internal/global/database"
	"cab-hive/internal/global/httpclient"
	"cab-hive/internal/global/jwt"
	"cab-hive/internal/global/response"
	"cab-hive/internal/model"
	"encoding/json"
	"fmt"
	"time"

	"crypto/aes"
	"crypto/cipher"
	"encoding/base64"

	"github.com/gin-gonic/gin"
	"github.com/pkg/errors"
	"gorm.io/gorm"
)

// WeChatLoginRequest 定义微信登录请求的结构体
type WeChatLoginRequest struct {
	Code          string `json:"code" binding:"required"`          // 临时登录凭证
	EncryptedData string `json:"encryptedData" binding:"required"` // 加密的用户数据
	Iv            string `json:"iv" binding:"required"`            // 加密算法的初始向量
}

// AdminLoginRequest 定义管理员登录请求的结构体
type AdminLoginRequest struct {
	Phone    string `json:"phone" binding:"required"`    // 管理员电话号码
	Password string `json:"password" binding:"required"` // 管理员密码
}

// RefreshTokenRequest 定义刷新令牌请求的结构体
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"` // 刷新令牌
}

// TokenResponse 定义令牌响应的结构体
type TokenResponse struct {
	Token     string `json:"token"`      // JWT令牌
	ExpiresIn int64  `json:"expires_in"` // 过期时间（秒）
}

// WechatLoginResponse 定义微信登录响应的结构体
type WechatLoginResponse struct {
	Token     string         `json:"token"`      // JWT令牌
	UserID    string         `json:"user_id"`    // 用户ID
	Role      string         `json:"role"`       // 用户角色
	ExpiresIn int64          `json:"expires_in"` // 过期时间（秒）
	UserInfo  model.UserInfo `json:"user_info"`  // 用户信息
}

// AdminLoginResponse 定义管理员登录响应的结构体
type AdminLoginResponse struct {
	Token       string   `json:"token"`       // JWT令牌
	UserID      string   `json:"user_id"`     // 用户ID
	Role        string   `json:"role"`        // 用户角色
	ExpiresIn   int64    `json:"expires_in"`  // 过期时间（秒）
	Permissions []string `json:"permissions"` // 权限列表
}

// AdminPermissions 管理员权限列表
var AdminPermissions = []string{
	"user_manage",
	"vehicle_audit",
	"order_manage",
}

// WeChatUserInfo 定义从微信获取的用户信息结构体
type WeChatUserInfo struct {
	OpenID    string `json:"openId"`
	NickName  string `json:"nickName"`
	Gender    int    `json:"gender"`
	AvatarURL string `json:"avatarUrl"`
}

// WeChatSession 微信会话信息
type WeChatSession struct {
	OpenID     string `json:"openid"`
	SessionKey string `json:"session_key"`
	UnionID    string `json:"unionid,omitempty"`
	ErrCode    int    `json:"errcode"`
	ErrMsg     string `json:"errmsg"`
}

// DefaultAvatarURL 默认头像URL
const DefaultAvatarURL = "https://avatars.githubusercontent.com/u/161929724"

// WeChatLogin 处理微信登录请求
func WeChatLogin(c *gin.Context) {
	// 定义请求结构体并绑定 JSON 数据
	var req WeChatLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Error("绑定微信登录请求失败", "error", err)
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

	// 从配置中获取微信小程序的 AppID 和 AppSecret
	wechatConfig := config.Get().WeChat
	if wechatConfig.AppID == "" || wechatConfig.AppSecret == "" {
		log.Error("微信配置缺失")
		response.Fail(c, response.ErrServerInternal.WithOrigin(errors.New("微信配置缺失")))
		return
	}

	// 调用微信接口获取 session_key 和 openid
	session, err := getWeChatSession(wechatConfig.AppID, wechatConfig.AppSecret, req.Code)
	if err != nil {
		log.Error("获取微信会话失败", "error", err)
		response.Fail(c, response.ErrServerInternal.WithOrigin(err))
		return
	}

	// 解密用户信息
	decryptedData, err := decryptWeChatData(req.EncryptedData, session.SessionKey, req.Iv)
	if err != nil {
		log.Error("解密微信用户信息失败", "error", err)
		response.Fail(c, response.ErrServerInternal.WithOrigin(err))
		return
	}

	// 解析解密后的用户信息
	var wechatUserInfo WeChatUserInfo
	if err := json.Unmarshal(decryptedData, &wechatUserInfo); err != nil {
		log.Error("解析微信用户信息失败", "error", err)
		response.Fail(c, response.ErrServerInternal.WithOrigin(err))
		return
	}
	wechatUserInfo.OpenID = session.OpenID

	// 查询用户是否已存在
	var user model.User
	err = database.DB.Where("open_id = ?", wechatUserInfo.OpenID).First(&user).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Error("数据库查询失败", "error", err)
		response.Fail(c, response.ErrDatabase.WithOrigin(err))
		return
	}

	// 生成 JWT 令牌
	token := jwt.CreateToken(jwt.Payload{
		OpenID: wechatUserInfo.OpenID, // 使用 OpenID 而不是 StudentID
		RoleID: 1,                     // Default role ID
	})

	// 如果用户不存在，则创建新用户
	if errors.Is(err, gorm.ErrRecordNotFound) {
		user = model.User{
			RoleID:   1, // 默认角色 ID
			NickName: wechatUserInfo.NickName,
			OpenID:   wechatUserInfo.OpenID,
			UserInfo: model.UserInfo{ // 初始化UserInfo
				Token:     token,
				NickName:  wechatUserInfo.NickName,
				AvatarURL: func() string {
					if wechatUserInfo.AvatarURL != "" {
						return wechatUserInfo.AvatarURL
					}
					return DefaultAvatarURL
				}(),
				OpenID: wechatUserInfo.OpenID,
				RoleID: 1,
			},
			SessionKey: session.SessionKey, // Store session key for backend use
			UnionID:    session.UnionID,    // Store union ID for backend use
			LastLogin:  time.Now().Unix(),  // Store last login timestamp
		}
		if err := database.DB.Create(&user).Error; err != nil {
			log.Error("创建用户失败", "error", err)
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
			return
		}
	} else {
		// 更新现有用户信息
		user.NickName = wechatUserInfo.NickName
		user.AvatarURL = func() string {
			if wechatUserInfo.AvatarURL != "" {
				return wechatUserInfo.AvatarURL
			}
			return DefaultAvatarURL
		}()
		user.UserInfo.NickName = wechatUserInfo.NickName
		user.UserInfo.AvatarURL = user.AvatarURL
		user.UserInfo.Token = token
		user.SessionKey = session.SessionKey
		user.UnionID = session.UnionID
		user.LastLogin = time.Now().Unix()

		if err := database.DB.Save(&user).Error; err != nil {
			log.Error("更新用户信息失败", "error", err)
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
			return
		}
	}

	// 记录登录成功的日志
	log.Info("用户微信登录成功",
		"open_id", user.OpenID,
		"role_id", user.RoleID)

	// 返回用户信息
	response.Success(c, user.UserInfo)
}

// AdminLogin 处理管理员登录请求
func AdminLogin(c *gin.Context) {
	// 定义请求结构体并绑定 JSON 数据
	var req AdminLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Error("绑定管理员登录请求失败", "error", err)
		response.Fail(c, response.ErrInvalidRequest.WithOrigin(err))
		return
	}

	// 验证管理员凭据
	var admin model.Admin
	err := database.DB.Where("phone = ?", req.Phone).First(&admin).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Error("管理员不存在", "phone", req.Phone)
			response.Fail(c, response.ErrInvalidPassword)
		} else {
			log.Error("数据库查询失败", "error", err)
			response.Fail(c, response.ErrDatabase.WithOrigin(err))
		}
		return
	}

	// 验证密码
	if admin.Password != req.Password {
		log.Error("管理员密码错误", "phone", req.Phone)
		response.Fail(c, response.ErrInvalidPassword)
		return
	}

	// 生成 JWT 令牌
	token := jwt.CreateToken(jwt.Payload{
		OpenID: req.Phone, // 使用 Phone 而不是 StudentID
		RoleID: 3,         // Admin role ID
	})

	// 构造响应数据
	resp := AdminLoginResponse{
		Token:       token,
		UserID:      fmt.Sprintf("admin_%s", req.Phone),
		Role:        "admin",
		ExpiresIn:   config.Get().JWT.AccessExpire,
		Permissions: AdminPermissions,
	}

	// 返回成功响应
	log.Info("管理员登录成功", "phone", req.Phone)
	response.Success(c, resp)
}

// RefreshToken 处理令牌刷新请求
func RefreshToken(c *gin.Context) {
	// 从上下文中获取载荷
	payloadInterface, exists := c.Get("payload")
	if !exists {
		log.Error("无法获取载荷信息")
		response.Fail(c, response.ErrTokenInvalid)
		return
	}

	payload, ok := payloadInterface.(*jwt.Claims)
	if !ok {
		log.Error("载荷类型错误")
		response.Fail(c, response.ErrTokenInvalid)
		return
	}

	// 生成新的 JWT 令牌
	newToken := jwt.CreateToken(jwt.Payload{
		OpenID: payload.OpenID,
		RoleID: payload.RoleID,
	})

	// 构造响应数据
	resp := TokenResponse{
		Token:     newToken,
		ExpiresIn: config.Get().JWT.AccessExpire,
	}

	// 返回成功响应
	log.Info("令牌刷新成功", "user_id", payload.OpenID)
	response.Success(c, resp)
}

// getWeChatSession 调用微信接口获取会话信息
func getWeChatSession(appID, appSecret, code string) (*WeChatSession, error) {
	url := fmt.Sprintf("https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
		appID, appSecret, code)

	resp, err := httpclient.Client.R().Get(url)
	if err != nil {
		return nil, err
	}

	var session WeChatSession
	if err := json.Unmarshal(resp.Body(), &session); err != nil {
		return nil, err
	}

	if session.ErrCode != 0 {
		return nil, fmt.Errorf("微信接口错误: %d, %s", session.ErrCode, session.ErrMsg)
	}

	return &session, nil
}

// generateStudentID 生成唯一的学号
func generateStudentID() string {
	// 生成一个基于时间戳和随机数的唯一学号
	return fmt.Sprintf("WX%08d", time.Now().UnixNano()%100000000)
}

// decryptWeChatData 解密微信加密数据
func decryptWeChatData(encryptedData, sessionKey, iv string) ([]byte, error) {
	// Base64解码
	encryptedBytes, err := base64.StdEncoding.DecodeString(encryptedData)
	if err != nil {
		return nil, err
	}

	sessionKeyBytes, err := base64.StdEncoding.DecodeString(sessionKey)
	if err != nil {
		return nil, err
	}

	ivBytes, err := base64.StdEncoding.DecodeString(iv)
	if err != nil {
		return nil, err
	}

	// 创建AES解密器
	block, err := aes.NewCipher(sessionKeyBytes)
	if err != nil {
		return nil, err
	}

	// CBC解密
	mode := cipher.NewCBCDecrypter(block, ivBytes)
	decrypted := make([]byte, len(encryptedBytes))
	mode.CryptBlocks(decrypted, encryptedBytes)

	// PKCS#7去填充
	decrypted, err = pkcs7Unpad(decrypted, aes.BlockSize)
	if err != nil {
		return nil, err
	}

	return decrypted, nil
}

// pkcs7Unpad PKCS#7去填充
func pkcs7Unpad(data []byte, blockSize int) ([]byte, error) {
	if len(data) == 0 || len(data)%blockSize != 0 {
		return nil, errors.New("invalid data length")
	}

	padding := int(data[len(data)-1])
	if padding > blockSize || padding == 0 {
		return nil, errors.New("invalid padding")
	}

	// 检查填充字节是否正确
	for i := len(data) - padding; i < len(data); i++ {
		if data[i] != byte(padding) {
			return nil, errors.New("invalid padding")
		}
	}

	return data[:len(data)-padding], nil
}



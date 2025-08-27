package model

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

type User struct {
	Model
	RoleID   int      `gorm:"default:1;not null"`
	NickName string   `gorm:"type:varchar(20);not null"`
	AvatarURL string  `gorm:"type:varchar(255)"` // 用户头像URL
	OpenID   string   `gorm:"type:varchar(50);uniqueIndex:idx_users_open_id;not null"`
	UserInfo UserInfo `gorm:"type:jsonb"` // UserInfo作为User结构体的成员，并持久化到数据库
	
	// Backend-only fields - these are for internal use and not returned to frontend
	SessionKey string `gorm:"type:varchar(50)" json:"-"` // WeChat session key, not exposed to frontend
	UnionID    string `gorm:"type:varchar(50);index" json:"-"` // WeChat union ID, not exposed to frontend
	LastLogin  int64  `gorm:"type:bigint" json:"-"` // Last login timestamp, not exposed to frontend
}

// UserInfo 定义返回给前端的用户信息结构体
type UserInfo struct {
	Token     string `json:"token"`
	NickName  string `json:"nick_name"`
	AvatarURL string `json:"avatar_url"`
	OpenID    string `json:"open_id"`
	RoleID    int    `json:"role_id"`
}

// 实现 sql.Scanner 接口用于从数据库读取数据
func (u *UserInfo) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("无法转换为字节数组")
	}
	
	return json.Unmarshal(bytes, u)
}

// 实现 driver.Valuer 接口用于将数据写入数据库
func (u UserInfo) Value() (driver.Value, error) {
	if u.Token == "" && u.NickName == "" && u.AvatarURL == "" && u.OpenID == "" && u.RoleID == 0 {
		return nil, nil
	}
	
	return json.Marshal(u)
}

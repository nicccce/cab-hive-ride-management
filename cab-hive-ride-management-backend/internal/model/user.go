package model

type User struct {
	Model
	RoleID   int      `gorm:"default:1;not null"`
	NickName string   `gorm:"type:varchar(20);not null"`
	OpenID   string   `gorm:"type:varchar(50);uniqueIndex;not null"`
	UserInfo UserInfo `gorm:"type:jsonb"` // UserInfo作为User结构体的成员，并持久化到数据库
	
	// Backend-only fields - these are for internal use and not returned to frontend
	SessionKey string `gorm:"type:varchar(50)" json:"-"` // WeChat session key, not exposed to frontend
	UnionID    string `gorm:"type:varchar(50);index" json:"-"` // WeChat union ID, not exposed to frontend
	LastLogin  int64  `gorm:"type:bigint" json:"-"` // Last login timestamp, not exposed to frontend
}

// UserInfo 定义返回给前端的用户信息结构体
type UserInfo struct {
	Token    string `json:"token"`
	NickName string `json:"nick_name"`
	OpenID   string `json:"open_id"`
	RoleID   int    `json:"role_id"`
}

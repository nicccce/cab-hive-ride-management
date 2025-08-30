package model

import (
	"gorm.io/gorm"
)

// Feedback 反馈信息结构体
type Feedback struct {
	Model
	UserOpenID  string `gorm:"type:varchar(50);index;not null"` // 用户OpenID
	OrderID     uint   `gorm:"type:bigint;index;not null"`      // 订单ID
	Type        string `gorm:"type:varchar(20);not null"`       // 反馈类型
	Level       int    `gorm:"type:int;default:1"`              // 反馈级别，1-5级，5级最高
	Title       string `gorm:"type:varchar(100)"`               // 反馈标题
	Content     string `gorm:"type:text"`                       // 反馈内容
	Status      string `gorm:"type:varchar(20);default:'open'"` // 反馈状态：open, processing, closed
	Reply       string `gorm:"type:text"`                       // 管理员回复内容
	ReplyUserID *uint  `gorm:"type:bigint"`                     // 回复的管理员ID
}

// FeedbackType 反馈类型枚举
const (
	FeedbackTypeComplaint   = "complaint"   // 投诉
	FeedbackTypeSuggestion  = "suggestion"  // 建议
	FeedbackTypeConsult     = "consult"     // 咨询
	FeedbackTypePraise      = "praise"      // 表扬
	FeedbackTypeOther       = "other"       // 其他
)

// FeedbackLevel 反馈级别枚举
const (
	FeedbackLevelLow      = 1 // 低级
	FeedbackLevelModerate = 2 // 中级
	FeedbackLevelHigh     = 3 // 高级
	FeedbackLevelUrgent   = 4 // 紧急
	FeedbackLevelCritical = 5 // 严重
)

// FeedbackStatus 反馈状态枚举
const (
	FeedbackStatusOpen       = "open"       // 开启
	FeedbackStatusProcessing = "processing" // 处理中
	FeedbackStatusClosed     = "closed"     // 已关闭
)

// AfterCreate 在创建反馈后更新订单的反馈状态
func (f *Feedback) AfterCreate(tx *gorm.DB) (err error) {
	// 这里可以添加更新订单反馈状态的逻辑
	// 例如：更新订单表中的 has_feedback 字段为 true
	return
}
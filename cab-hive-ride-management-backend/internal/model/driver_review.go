package model

import "time"

// DriverReview 定义司机信息审核的结构体
type DriverReview struct {
	Model
	OpenID          string     `gorm:"type:varchar(50);index"`             // 用户OpenID
	LicenseNumber   string     `gorm:"type:varchar(50);not null"`          // 驾照编号
	Name            string     `gorm:"type:varchar(50);not null"`          // 司机姓名
	Phone           string     `gorm:"type:varchar(20);not null"`          // 电话号码
	LicenseImageURL string     `gorm:"type:text"`                          // 驾照图片URL
	Status          string     `gorm:"type:varchar(20);default:'pending'"` // 状态: pending, approved, rejected
	Comment         string     `gorm:"type:text"`                          // 管理员审核备注
	ActionType      string     `gorm:"type:varchar(20);not null"`          // 操作类型: register, update
	DriverID        uint       `gorm:"type:bigint"`                        // 关联的司机ID（用于更新操作）
	ReviewTime      *time.Time `gorm:"type:timestamptz"`                   // 审核时间
}

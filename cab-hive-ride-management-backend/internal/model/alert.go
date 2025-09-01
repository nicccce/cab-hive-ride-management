package model

import (
	"time"
)

// Alert 预警信息模型
type Alert struct {
	Model
	OrderID     uint      `gorm:"type:bigint;index;not null"`        // 关联的订单ID
	Content     string    `gorm:"type:text;not null"`                // 预警内容
	AlertTime   time.Time `gorm:"type:timestamptz;not null"`         // 预警时间
	IsProcessed bool      `gorm:"type:boolean;default:false"`        // 是否已处理
	ProcessNote string    `gorm:"type:text"`                         // 处理备注
	AlertType   string    `gorm:"type:varchar(50);default:'system'"` // 预警类型
}
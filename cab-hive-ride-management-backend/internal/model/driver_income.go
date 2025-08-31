package model

import "time"

// DriverIncome 定义司机收入信息的结构体
type DriverIncome struct {
	ID          uint      `gorm:"primaryKey;autoIncrement"`          // 收入ID
	DriverID    uint      `gorm:"type:bigint;index;not null"`        // 司机ID
	OrderID     *uint     `gorm:"type:bigint;index"`                 // 关联的订单ID（可为空）
	IncomeType  string    `gorm:"type:varchar(20);not null"`         // 收入类型: order, activity, other
	Amount      float64   `gorm:"type:decimal(10,2);not null"`       // 金额
	Description string    `gorm:"type:text"`                         // 描述
	CreatedAt   time.Time `gorm:"type:timestamptz;default:now()"`    // 创建时间
	UpdatedAt   time.Time `gorm:"type:timestamptz;default:now()"`    // 更新时间
}

// DriverIncomeType 收入类型枚举
const (
	IncomeTypeOrder    = "order"    // 订单收入
	IncomeTypeActivity = "activity" // 活动收入
	IncomeTypeOther    = "other"    // 其他收入
)
package model

import "time"

// VehicleReview 定义车辆信息审核的结构体
type VehicleReview struct {
	Model
	DriverID          string    `gorm:"type:varchar(50);index"`             // 关联的司机ID
	PlateNumber       string    `gorm:"type:varchar(20);not null"`          // 车牌号码
	VehicleType       string    `gorm:"type:varchar(50);not null"`          // 车辆类型
	Brand             string    `gorm:"type:varchar(50);not null"`          // 车辆品牌
	ModelName         string    `gorm:"type:varchar(50);not null"`          // 车辆型号
	Color             string    `gorm:"type:varchar(20);not null"`          // 车辆颜色
	Year              int       `gorm:"type:int;not null"`                  // 制造年份
	RegistrationImage string    `gorm:"type:text;not null"`                 // 行驶证图片URL
	InsuranceExpiry   time.Time `gorm:"type:date;not null"`                 // 保险到期日期
	Status            string    `gorm:"type:varchar(20);default:'pending'"` // 状态: pending, approved, rejected
	Comment           string    `gorm:"type:text"`                          // 管理员审核备注
	ActionType        string    `gorm:"type:varchar(20);not null"`          // 操作类型: submit, update
	VehicleID         uint      `gorm:"type:bigint"`                        // 关联的车辆ID（用于更新操作）
	ReviewTime        time.Time `gorm:"type:timestamptz"`                      // 审核时间
}

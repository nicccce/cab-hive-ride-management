package model

import "time"

// Vehicle 定义车辆信息的结构体
type Vehicle struct {
	Model
	DriverID          string     `gorm:"type:varchar(50);index"`             // 用户OpenID
	PlateNumber       string     `gorm:"type:varchar(20);index"`             // 车牌号码
	VehicleType       string     `gorm:"type:varchar(50);not null"`          // 车辆类型
	Brand             string     `gorm:"type:varchar(50);not null"`          // 车辆品牌
	ModelName         string     `gorm:"type:varchar(50);not null"`          // 车辆型号
	Color             string     `gorm:"type:varchar(20);not null"`          // 车辆颜色
	Year              int        `gorm:"type:int;not null"`                  // 制造年份
	RegistrationImage string     `gorm:"type:text;not null"`                 // 行驶证图片URL
	InsuranceExpiry   time.Time  `gorm:"type:date;not null"`                 // 保险到期日期
	Status            string     `gorm:"type:varchar(20);default:'pending'"` // 状态: pending, approved, rejected
	Comment           string     `gorm:"type:text"`                          // 管理员审核备注
	SubmitTime        time.Time  `gorm:"type:timestamptz"`                   // 提交时间
	ReviewTime        *time.Time `gorm:"type:timestamptz"`                   // 审核时间
	Reviewer          string     `gorm:"type:varchar(50)"`                   // 审核人
}

package model

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

// LocationPoint 定义位置点的结构
type LocationPoint struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

// LocationPoints 定义位置点切片类型
type LocationPoints []LocationPoint

// Location 定义位置信息的结构
type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Name      string  `json:"name"`
}

// RouteStep 定义路线步骤的结构
type RouteStep struct {
	Instruction     string `json:"instruction"`
	RoadName        string `json:"road_name"`
	DirectionDesc   string `json:"dir_desc"`
	Distance        int    `json:"distance"`
	ActionDesc      string `json:"act_desc"`
	AccessorialDesc string `json:"accessorial_desc"`
}

// Order 定义订单信息的结构体
type Order struct {
	Model
	UserOpenID    string          `gorm:"type:varchar(50);index;not null"`               // 用户OpenID
	DriverOpenID  string          `gorm:"type:varchar(50);index"`                        // 司机OpenID
	VehicleID     uint            `gorm:"type:bigint;index"`                             // 车辆ID
	StartLocation Location        `gorm:"type:jsonb"`                                    // 起点位置
	EndLocation   Location        `gorm:"type:jsonb"`                                    // 终点位置
	RoutePoints   LocationPoints `gorm:"type:jsonb"`                                    // 路线点
	StartTime     *time.Time      `gorm:"type:timestamptz"`                              // 出发时间
	EndTime       *time.Time      `gorm:"type:timestamptz"`                              // 实际结束时间
	Distance      float64         `gorm:"type:decimal(10,2)"`                            // 距离（公里）
	Duration      int             `gorm:"type:int"`                                      // 预计时长（分钟）
	Fare          float64         `gorm:"type:decimal(10,2)"`                            // 费用
	Tolls         float64         `gorm:"type:decimal(10,2)"`                            // 过路费
	Status        string          `gorm:"type:varchar(20);default:'waiting_for_driver'"` // 订单状态
	Comment       string          `gorm:"type:text"`                                     // 备注
	PaymentTime   *time.Time      `gorm:"type:timestamptz"`                              // 支付时间
	CancelReason  string          `gorm:"type:text"`                                     // 取消原因
	Rating        int             `gorm:"type:int;default:0"`                            // 司机评分
	ReserveTime   *time.Time      `gorm:"type:timestamptz"`                              //预约时间
}

// 实现 driver.Valuer 和 sql.Scanner 接口以便在数据库中存储 JSON
func (l Location) Value() (driver.Value, error) {
	return json.Marshal(l)
}

func (l *Location) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	return json.Unmarshal(value.([]byte), l)
}

func (lp LocationPoint) Value() (driver.Value, error) {
	return json.Marshal(lp)
}

func (lp *LocationPoint) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	return json.Unmarshal(value.([]byte), lp)
}

// 实现 LocationPoints 的 driver.Valuer 和 sql.Scanner 接口
func (lps LocationPoints) Value() (driver.Value, error) {
	return json.Marshal(lps)
}

func (lps *LocationPoints) Scan(value interface{}) error {
	if value == nil {
		*lps = nil
		return nil
	}

	// 确保目标是指向切片的指针
	if *lps == nil {
		*lps = make(LocationPoints, 0)
	}

	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("无法将值转换为字节切片")
	}

	return json.Unmarshal(bytes, lps)
}

func (rs RouteStep) Value() (driver.Value, error) {
	return json.Marshal(rs)
}

func (rs *RouteStep) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	return json.Unmarshal(value.([]byte), rs)
}

// OrderStatus 订单状态枚举
const (
	OrderStatusReserved          = "reserved"            // 预约中
	OrderStatusWaitingForDriver  = "waiting_for_driver"  // 等待司机接单
	OrderStatusWaitingForPickup  = "waiting_for_pickup"  // 等待司机到达起点
	OrderStatusDriverArrived     = "driver_arrived"      // 等待司机接客
	OrderStatusInProgress        = "in_progress"         // 在路上
	OrderStatusWaitingForPayment = "waiting_for_payment" // 结束待付款
	OrderStatusCompleted         = "completed"           // 已完结
	OrderStatusCancelled         = "cancelled"           // 已取消
)

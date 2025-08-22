package model

// Admin 定义管理员信息的结构体（硬编码）
type Admin struct {
	Model
	Phone    string `gorm:"type:varchar(20);uniqueIndex;not null"` // 电话号码
	Password string `gorm:"type:varchar(100);not null"`            // 密码（加密存储）
	Role     string `gorm:"type:varchar(20);default:'admin'"`      // 角色
}
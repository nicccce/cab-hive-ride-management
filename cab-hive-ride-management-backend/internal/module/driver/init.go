package driver

import (
	"cab-hive/internal/global/logger"
)

var log = logger.New("driver")

// ModuleDriver 驱动模块结构体
type ModuleDriver struct{}

// GetName 获取模块名称
func (m *ModuleDriver) GetName() string {
	return "driver"
}

// Init 初始化驱动模块
func (m *ModuleDriver) Init() {
	// 驱动模块初始化逻辑（如果需要）
}

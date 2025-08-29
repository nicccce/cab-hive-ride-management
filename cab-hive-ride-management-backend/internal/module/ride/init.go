package ride

import (
	"cab-hive/internal/global/logger"
	"log/slog"
)

var log *slog.Logger

// ModuleRide 乘车模块结构体
type ModuleRide struct{}

// GetName 获取模块名称
func (m *ModuleRide) GetName() string {
	return "ride"
}

// Init 初始化乘车模块
func (m *ModuleRide) Init() {
	log = logger.New("ride")
}

// selfInit 自初始化函数
func selfInit() {
	m := &ModuleRide{}
	m.Init()
}

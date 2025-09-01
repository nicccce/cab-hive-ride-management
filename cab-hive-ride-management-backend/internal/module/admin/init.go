package admin

import (
	"cab-hive/internal/global/logger"
	"log/slog"
)

var log *slog.Logger

type ModuleAdmin struct{}

func (u *ModuleAdmin) GetName() string {
	return "Admin"
}

func (u *ModuleAdmin) Init() {
	log = logger.New("Admin")
	
	// 启动定时任务调度器
	StartScheduler()
}

func selfInit() {
	u := &ModuleAdmin{}
	u.Init()
}
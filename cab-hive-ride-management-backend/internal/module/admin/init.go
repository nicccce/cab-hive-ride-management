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
}

func selfInit() {
	u := &ModuleAdmin{}
	u.Init()
}
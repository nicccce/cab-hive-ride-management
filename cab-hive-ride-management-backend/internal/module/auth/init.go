package auth

import (
	"cab-hive/internal/global/logger"
	"log/slog"
)

var log *slog.Logger

type ModuleAuth struct{}

func (u *ModuleAuth) GetName() string {
	return "Auth"
}

func (u *ModuleAuth) Init() {
	log = logger.New("Auth")
}

func selfInit() {
	u := &ModuleAuth{}
	u.Init()
}

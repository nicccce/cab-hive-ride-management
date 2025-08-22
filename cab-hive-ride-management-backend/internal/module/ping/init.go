package ping

import (
	"cab-hive/internal/global/logger"
	"log/slog"
)

var log *slog.Logger

type ModulePing struct{}

func (p *ModulePing) GetName() string {
	return "Ping"
}

func (p *ModulePing) Init() {
	log = logger.New("Ping")
}

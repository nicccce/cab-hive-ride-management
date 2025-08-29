package ride

import (
	"cab-hive/internal/global/logger"
	"log/slog"
)

var log *slog.Logger

type ModuleRide struct{}

func (u *ModuleRide) GetName() string {
	return "Ride"
}

func (u *ModuleRide) Init() {
	log = logger.New("Ride")
}

func selfInit() {
	u := &ModuleRide{}
	u.Init()
}

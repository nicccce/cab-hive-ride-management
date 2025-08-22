package vehicle

import (
	"cab-hive/internal/global/logger"
	"log/slog"
)

var log *slog.Logger

type ModuleVehicle struct{}

func (u *ModuleVehicle) GetName() string {
	return "Vehicle"
}

func (u *ModuleVehicle) Init() {
	log = logger.New("Vehicle")
}

func selfInit() {
	u := &ModuleVehicle{}
	u.Init()
}

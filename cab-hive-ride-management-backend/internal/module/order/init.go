package order

import (
	"cab-hive/internal/global/logger"
	"log/slog"
)

var log *slog.Logger

type ModuleOrder struct{}

func (u *ModuleOrder) GetName() string {
	return "Order"
}

func (u *ModuleOrder) Init() {
	log = logger.New("Order")
}

func selfInit() {
	u := &ModuleOrder{}
	u.Init()
}

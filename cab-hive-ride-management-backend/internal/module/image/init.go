package image

import (
	"cab-hive/internal/global/logger"
	"log/slog"
)

var log *slog.Logger

type ModuleImage struct{}

func (u *ModuleImage) GetName() string {
	return "Image"
}

func (u *ModuleImage) Init() {
	log = logger.New("Image")
}

func selfInit() {
	u := &ModuleImage{}
	u.Init()
}

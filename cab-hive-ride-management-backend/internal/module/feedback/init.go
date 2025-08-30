package feedback

import (
	"cab-hive/internal/global/logger"
	"log/slog"
)

var log *slog.Logger

type ModuleFeedback struct{}

func (f *ModuleFeedback) GetName() string {
	return "Feedback"
}

func (f *ModuleFeedback) Init() {
	log = logger.New("Feedback")
}

func selfInit() {
	f := &ModuleFeedback{}
	f.Init()
}
package ai

import (
	"cab-hive/internal/global/logger"
	"log/slog"
)

var log *slog.Logger

type ModuleAI struct{}

func (a *ModuleAI) GetName() string {
	return "AI"
}

func (a *ModuleAI) Init() {
	log = logger.New("AI")
}

func selfInit() {
	a := &ModuleAI{}
	a.Init()
}
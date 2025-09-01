package admin

import (
	"cab-hive/internal/global/logger"
	"log/slog"
)

var log *slog.Logger

func init() {
	log = logger.New("admin")
}

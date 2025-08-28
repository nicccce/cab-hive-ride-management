package server

import (
	"cab-hive/config"
	"cab-hive/internal/global/database"
	"cab-hive/internal/global/httpclient"
	"cab-hive/internal/global/logger"
	"cab-hive/internal/global/middleware"
	"cab-hive/internal/global/redis"
	"cab-hive/internal/module"
	"cab-hive/tools"
	"fmt"
	"log/slog"

	"github.com/gin-gonic/gin"
)

var log *slog.Logger

func Init() {
	config.Init()
	log = logger.New("Server")
	log.Info(fmt.Sprintf("Init Config: %s", config.Get().Mode))

	database.Init()
	log.Info(fmt.Sprintf("Init Database: %s", config.Get().Postgres.Host))

	redis.Init()
	log.Info(fmt.Sprintf("Init Redis: %s", config.Get().Redis.Host))

	httpclient.Init()
	log.Info(fmt.Sprintf("Init HttpClient: %s", config.Get().Host))

	for _, m := range module.Modules {
		log.Info(fmt.Sprintf("Init Module: %s", m.GetName()))
		m.Init()
	}
}

func Run() {
	gin.SetMode(string(config.Get().Mode))
	r := gin.New()
	
	// 加载HTML模板
	r.LoadHTMLGlob("templates/*")

	switch config.Get().Mode {
	case config.ModeRelease:
		r.Use(middleware.Logger(logger.Get()))
	case config.ModeDebug:
		r.Use(gin.Logger())
	}
	r.Use(middleware.Cors())
	r.Use(middleware.Recovery())

	for _, m := range module.Modules {
		log.Info(fmt.Sprintf("Init Router: %s", m.GetName()))
		m.InitRouter(r.Group(config.Get().Prefix))
	}
	err := r.Run(config.Get().Host + ":" + config.Get().Port)
	tools.PanicOnErr(err)
}

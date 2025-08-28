package database

import (
	"cab-hive/config"
	"cab-hive/internal/model"
	"cab-hive/tools"
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// autoMigrateModels 定义需要自动迁移的模型列表
var autoMigrateModels = []interface{}{
	&model.User{},
	&model.Driver{},
	&model.Admin{},
	&model.DriverReview{},
	&model.Vehicle{},
	&model.VehicleReview{},
	&model.RideOrder{}, // 订单模型
}

func Init() {
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Shanghai",
		config.Get().Postgres.Host,
		config.Get().Postgres.Username,
		config.Get().Postgres.Password,
		config.Get().Postgres.DBName,
		config.Get().Postgres.Port,
	)
	gormConfig := &gorm.Config{
		//NamingStrategy: schema.NamingStrategy{SingularTable: true}, // 还是单数表名好
	}

	switch config.Get().Mode {
	case config.ModeDebug:
		gormConfig.Logger = logger.Default.LogMode(logger.Info)
	case config.ModeRelease:
		gormConfig.Logger = logger.Discard
	}

	db, err := gorm.Open(postgres.Open(dsn), gormConfig)
	tools.PanicOnErr(err)
	DB = db

	// 使用模型列表进行自动迁移
	tools.PanicOnErr(DB.AutoMigrate(autoMigrateModels...))
}

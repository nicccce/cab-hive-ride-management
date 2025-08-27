package config

import (
	"cab-hive/tools"
	"fmt"
	"github.com/kelseyhightower/envconfig"
	"github.com/spf13/viper"
)

const defaultFilePath = "config.yaml"

var c Config

func Init(path ...string) {
	filePath := defaultFilePath
	if len(path) == 1 {
		filePath = path[0]
	}
	viper.SetConfigFile(filePath)
	
	if tools.FileExist(filePath) {
		tools.PanicOnErr(viper.ReadInConfig())
		tools.PanicOnErr(viper.Unmarshal(&c))
		fmt.Printf("Loaded WeChat config: AppID=%s, AppSecret=%s\n", c.WeChat.AppID, c.WeChat.AppSecret)
		fmt.Printf("Loaded Postgres config: Host=%s, Port=%s\n", c.Postgres.Host, c.Postgres.Port)
		fmt.Printf("Loaded Redis config: Host=%s, Port=%s\n", c.Redis.Host, c.Redis.Port)
	} else {
		fmt.Println("Config file not exist in ", filePath, ". Using environment variables.")
		tools.PanicOnErr(envconfig.Process("", &c))
	}
}

func Set(config Config) {
	c = config
}

func Get() Config {
	return c
}

func IsRelease() bool {
	return c.Mode == ModeRelease
}

func IsDebug() bool {
	return c.Mode == ModeDebug
}

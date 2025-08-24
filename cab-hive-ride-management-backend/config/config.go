package config

type Mode string

const (
	ModeDebug   Mode = "debug"
	ModeRelease Mode = "release"
)

type Config struct {
	Host     string `envconfig:"HOST"`
	Port     string `envconfig:"PORT"`
	Prefix   string `envconfig:"PREFIX"`
	Mode     Mode   `envconfig:"MODE"`
	Postgres Postgres
	Redis    Redis
	JWT      JWT
	Log      Log
	WeChat   WeChat
	OSS      OSS
}

// OSS 配置
type OSS struct {
	Endpoint string `envconfig:"OSS_ENDPOINT" yaml:"endpoint"`
	Token    string `envconfig:"TOKEN" yaml:"token"`
}

type Postgres struct {
	Host     string `envconfig:"POSTGRES_HOST"`
	Port     string `envconfig:"POSTGRES_PORT"`
	Username string `envconfig:"POSTGRES_USERNAME"`
	Password string `envconfig:"POSTGRES_PASSWORD"`
	DBName   string `envconfig:"POSTGRES_DB_NAME"`
}

type Redis struct {
	Host     string `yaml:"host"`
	Port     string `yaml:"port"`
	Password string `yaml:"password"`
	DB       int    `yaml:"db"`
}

type JWT struct {
	AccessSecret string `envconfig:"ACCESS_SECRET"`
	AccessExpire int64  `envconfig:"ACCESS_EXPIRE"`
}

type Log struct {
	FilePath   string `envconfig:"LOG_FILE_PATH"`   // 日志文件路径
	Level      string `envconfig:"LOG_LEVEL"`       // 日志级别：debug, info, warn, error
	MaxSize    int    `envconfig:"LOG_MAX_SIZE"`    // 日志文件最大大小（MB）
	MaxBackups int    `envconfig:"LOG_MAX_BACKUPS"` // 保留的旧日志文件数
	MaxAge     int    `envconfig:"LOG_MAX_AGE"`     // 日志文件保留天数
	Compress   bool   `envconfig:"LOG_COMPRESS"`    // 是否压缩旧日志文件
}

type WeChat struct {
	AppID     string `envconfig:"WECHAT_APP_ID" yaml:"app_id"`
	AppSecret string `envconfig:"WECHAT_APP_SECRET" yaml:"app_secret"`
	Token     string `envconfig:"WECHAT_TOKEN" yaml:"token"`
	AESKey    string `envconfig:"WECHAT_AES_KEY" yaml:"aes_key"`
}

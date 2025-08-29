package alipay

import (
	"cab-hive/config"
	"cab-hive/internal/global/logger"
	"log/slog"

	"github.com/smartwalle/alipay/v3"
)

var log *slog.Logger
var alipayClient *alipay.Client

type ModuleAlipay struct{}

func (u *ModuleAlipay) GetName() string {
	return "Alipay"
}

func (u *ModuleAlipay) Init() {
	log = logger.New("Alipay")

	// 初始化支付宝客户端
	initAlipayClient()
}

// initAlipayClient 初始化支付宝客户端
func initAlipayClient() {
	cfg := config.Get().AliPay

	// 检查必要配置是否存在
	if cfg.AppID == "" {
		log.Warn("支付宝配置不完整，跳过初始化")
		return
	}

	// 准备选项函数
	var opts []alipay.OptionFunc

	// 设置服务器地址
	if cfg.ServerURL != "" {
		if cfg.IsProduction {
			opts = append(opts, alipay.WithProductionGateway(cfg.ServerURL))
		} else {
			opts = append(opts, alipay.WithSandboxGateway(cfg.ServerURL))
		}
	}

	client, err := alipay.New(cfg.AppID, cfg.PrivateKey, cfg.IsProduction)
	if err != nil {
		log.Error("初始化支付宝客户端失败", "error", err)
		return
	}

	// 加载应用公钥证书
	if err = client.LoadAppCertPublicKeyFromFile("./cert/appPublicCert.crt"); err != nil {
		// 错误处理
	}

	// 加载支付宝根证书
	if err = client.LoadAliPayRootCertFromFile("./cert/alipayRootCert.crt"); err != nil {
		// 错误处理
	}

	// 加载支付宝公钥证书
	if err = client.LoadAlipayCertPublicKeyFromFile("./cert/alipayPublicCert.crt"); err != nil {
		// 错误处理
	}

	err = client.LoadAppCertPublicKeyFromFile("./cert/appPublicCert.crt")       // 加载应用公钥证书
	err = client.LoadAliPayRootCertFromFile("./cert/alipayRootCert.crt")        // 加载支付宝根证书
	err = client.LoadAlipayCertPublicKeyFromFile("./cert/alipayPublicCert.crt") // 加载支付宝公钥证书

	// 加载支付宝公钥
	if err != nil {
		log.Error("加载支付宝证书", "error", err)
		return
	}

	alipayClient = client
	log.Info("支付宝客户端初始化成功")
}

// GetAlipayClient 获取支付宝客户端实例
func GetAlipayClient() *alipay.Client {
	return alipayClient
}

func selfInit() {
	u := &ModuleAlipay{}
	u.Init()
}

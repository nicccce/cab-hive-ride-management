package module

import (
	"cab-hive/internal/module/admin"
	"cab-hive/internal/module/alipay"
	"cab-hive/internal/module/auth"
	"cab-hive/internal/module/driver"
	"cab-hive/internal/module/image"
	"cab-hive/internal/module/order"
	"cab-hive/internal/module/ping"
	"cab-hive/internal/module/ride"
	"cab-hive/internal/module/user"
	"cab-hive/internal/module/vehicle"
	"github.com/gin-gonic/gin"
)

type Module interface {
	GetName() string
	Init()
	InitRouter(r *gin.RouterGroup)
}

var Modules []Module

func registerModule(m []Module) {
	Modules = append(Modules, m...)
}

func init() {
	// Register your module here
	registerModule([]Module{
		&auth.ModuleAuth{},
		&admin.ModuleAdmin{},
		&driver.ModuleDriver{},
		&image.ModuleImage{},
		&ping.ModulePing{},
		&user.ModuleUser{},
		&vehicle.ModuleVehicle{},
		&order.ModuleOrder{},
		&alipay.ModuleAlipay{},
		&ride.ModuleRide{},
	})
}

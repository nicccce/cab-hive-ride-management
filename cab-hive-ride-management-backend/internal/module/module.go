package module

import (
	"cab-hive/internal/module/admin"
	"cab-hive/internal/module/auth"
	"cab-hive/internal/module/image"
	"cab-hive/internal/module/ping"
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
		&image.ModuleImage{},
		&ping.ModulePing{},
		&vehicle.ModuleVehicle{},
	})
}

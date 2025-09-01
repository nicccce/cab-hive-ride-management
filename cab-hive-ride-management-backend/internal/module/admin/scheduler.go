package admin

import (
	"time"
)

// StartScheduler 启动定时任务调度器
func StartScheduler() {
	// 启动一个goroutine来定期检查订单超时情况
	go func() {
		// 每分钟检查一次
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				// 执行订单超时检查
				CheckOrderTimeout()
			}
		}
	}()
}
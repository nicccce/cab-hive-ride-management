// 由于接口文档中没有提供这些数据的接口，我们创建模拟数据
export interface DailyStats {
  dailyOrders: number;
  dailyMileage: number;
  dailyActiveDrivers: number;
  dailyActiveUsers: number;
}

export const dashboardService = {
  // 获取每日统计数据（模拟）
  getDailyStats: (): Promise<{ data: DailyStats }> => {
    // 模拟数据
    const mockData: DailyStats = {
      dailyOrders: Math.floor(Math.random() * 100) + 50, // 每日订单量 50-150
      dailyMileage: Math.floor(Math.random() * 5000) + 1000, // 每日总里程 1000-6000公里
      dailyActiveDrivers: Math.floor(Math.random() * 50) + 20, // 每日活跃司机数 20-70
      dailyActiveUsers: Math.floor(Math.random() * 200) + 80, // 每日日活用户 80-280
    };
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: mockData
        });
      }, 500);
    });
  }
};
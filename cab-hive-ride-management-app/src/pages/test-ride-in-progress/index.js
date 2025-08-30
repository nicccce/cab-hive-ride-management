import { View } from "@tarojs/components";
import { useEffect, useState } from "react";
import RideInProgress from "../../components/RideInProgress";
import "./index.scss";

// 计算两点间距离的辅助函数（简化版）
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const TestRideInProgress = () => {
  const [orderInfo, setOrderInfo] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);

  useEffect(() => {
    // 模拟订单数据
    const mockOrderInfo = {
      id: "123456",
      status: "in_progress",
      start_location: {
        latitude: 30.2742,
        longitude: 120.1551,
        address: "浙江省杭州市西湖区"
      },
      end_location: {
        latitude: 30.2542,
        longitude: 120.1351,
        address: "浙江省杭州市上城区"
      },
      distance: "5.2",
      estimated_arrival_time: "10:30",
      route_points: [
        { latitude: 30.2742, longitude: 120.1551 },
        { latitude: 30.2702, longitude: 120.1501 },
        { latitude: 30.2652, longitude: 120.1451 },
        { latitude: 30.2602, longitude: 120.1401 },
        { latitude: 30.2542, longitude: 120.1351 }
      ]
    };

    setOrderInfo(mockOrderInfo);

    // 模拟司机位置更新
    const updateDriverLocation = () => {
      // 模拟司机在路线上移动
      const routePoints = mockOrderInfo.route_points;
      const randomIndex = Math.floor(Math.random() * routePoints.length);
      const point = routePoints[randomIndex];
      
      const newLocation = {
        latitude: point.latitude + (Math.random() - 0.5) * 0.001,
        longitude: point.longitude + (Math.random() - 0.5) * 0.001
      };
      setDriverLocation(newLocation);
    };

    updateDriverLocation();
    const interval = setInterval(updateDriverLocation, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View className="test-ride-in-progress">
      <RideInProgress 
        orderInfo={orderInfo} 
        driverLocation={driverLocation} 
      />
    </View>
  );
};

export default TestRideInProgress;
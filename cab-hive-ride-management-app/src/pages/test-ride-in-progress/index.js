import { View } from "@tarojs/components";
import { useEffect, useState } from "react";
import RideInProgress from "../../components/RideInProgress";
import "./index.scss";

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

    // 模拟司机位置更新，沿着路线移动
    let currentIndex = 0;
    const routePoints = mockOrderInfo.route_points;
    
    const updateDriverLocation = () => {
      if (currentIndex < routePoints.length) {
        const point = routePoints[currentIndex];
        
        const newLocation = {
          latitude: point.latitude + (Math.random() - 0.5) * 0.001,
          longitude: point.longitude + (Math.random() - 0.5) * 0.001
        };
        
        setDriverLocation(newLocation);
        currentIndex++;
      } else {
        // 重置到起点
        currentIndex = 0;
      }
    };

    updateDriverLocation();
    const interval = setInterval(updateDriverLocation, 3000);

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
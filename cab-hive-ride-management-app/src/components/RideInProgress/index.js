import { View, Map, Text, Button } from "@tarojs/components";
import { useEffect, useState } from "react";
import "./index.scss";
import { OrderStatus } from "../../services/order";

const RideInProgress = ({ orderInfo, driverLocation }) => {
  // 地图初始配置
  const [mapConfig, setMapConfig] = useState({
    longitude: 120.1551, // 杭州经度
    latitude: 30.2742, // 杭州纬度
    scale: 12,
    showLocation: true,
    enableScroll: true,
    enableRotate: false,
    enableZoom: true,
    enable3D: false,
    showCompass: false,
    showScale: true,
  });

  // 地图标记点
  const [markers, setMarkers] = useState([]);
  // 路径规划线
  const [polyline, setPolyline] = useState([]);
  
  // 进度比例
  const [progress, setProgress] = useState(0);

  // 更新地图标记
  useEffect(() => {
    if (!orderInfo || orderInfo.status !== OrderStatus.InProgress) return;

    // 设置起点标记
    const startMarker = {
      id: 0,
      latitude: orderInfo.start_location.latitude,
      longitude: orderInfo.start_location.longitude,
      title: "出发点",
      width: 30,
      height: 30,
      callout: {
        content: "出发点",
        color: "#000",
        fontSize: 14,
        borderRadius: 4,
        padding: 8,
        display: "ALWAYS",
      },
    };

    // 设置终点标记
    const endMarker = {
      id: 1,
      latitude: orderInfo.end_location.latitude,
      longitude: orderInfo.end_location.longitude,
      title: "终点",
      width: 30,
      height: 30,
      callout: {
        content: "终点",
        color: "#000",
        fontSize: 14,
        borderRadius: 4,
        padding: 8,
        display: "ALWAYS",
      },
    };

    let driverMarker = null;
    if (driverLocation) {
      driverMarker = {
        id: 2,
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        title: "司机位置",
        width: 30,
        height: 30,
        callout: {
          content: "司机位置",
          color: "#000",
          fontSize: 14,
          borderRadius: 4,
          padding: 8,
          display: "ALWAYS",
        }
      };
    }

    // 设置初始标记点
    setMarkers(driverMarker ? [startMarker, endMarker, driverMarker] : [startMarker, endMarker]);

    // 设置地图中心点
    setMapConfig((prev) => ({
      ...prev,
      longitude: (orderInfo.start_location.longitude + orderInfo.end_location.longitude) / 2,
      latitude: (orderInfo.start_location.latitude + orderInfo.end_location.latitude) / 2,
    }));

    // 设置路线
    if (orderInfo.route_points && orderInfo.route_points.length > 0) {
      // 过滤有效的坐标点
      const validPoints = orderInfo.route_points.filter(point =>
        point &&
        typeof point.latitude === 'number' &&
        typeof point.longitude === 'number' &&
        !Number.isNaN(point.latitude) &&
        !Number.isNaN(point.longitude)
      );

      if (validPoints.length > 0) {
        const routePolyline = {
          points: validPoints,
          color: "#FF0000",
          width: 6,
          dottedLine: false,
          arrowLine: true,
        };
        setPolyline([routePolyline]);

        // 调整地图视野以适应路线
        // 计算路线边界
        const latitudes = validPoints.map(p => p.latitude);
        const longitudes = validPoints.map(p => p.longitude);
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);

        // 设置地图中心点和缩放级别
        setMapConfig(prev => ({
          ...prev,
          longitude: (minLng + maxLng) / 2,
          latitude: (minLat + maxLat) / 2,
          scale: 14
        }));
      }
    }
  }, [orderInfo, driverLocation]);

  // 计算进度
  useEffect(() => {
    if (!driverLocation || !orderInfo) return;
    
    // 这里应该根据实际的地理位置计算距离比例
    // 为了简化，我们使用一个模拟的进度值
    // 在实际应用中，你需要使用地理计算库来计算实际距离
    const simulatedProgress = Math.min(100, Math.max(0, 
      100 * (Math.random() * 0.02 + 0.98) // 模拟进度逐渐增加
    ));
    
    setProgress(simulatedProgress);
  }, [driverLocation, orderInfo]);

  // 处理反馈按钮点击
  const handleFeedback = () => {
    console.log("用户点击了反馈按钮");
    // 这里可以添加实际的反馈逻辑
  };

  if (!orderInfo) {
    return (
      <View className="waiting-for-driver-container">
        <View className="loading-text">加载中...</View>
      </View>
    );
  }

  return (
    <View className="container">
      <View className="page-content">
        {/* 微信地图组件 */}
        <Map
          className="map-container"
          longitude={mapConfig.longitude}
          latitude={mapConfig.latitude}
          scale={mapConfig.scale}
          showLocation={mapConfig.showLocation}
          enableScroll={mapConfig.enableScroll}
          enableRotate={mapConfig.enableRotate}
          enableZoom={mapConfig.enableZoom}
          enable3D={mapConfig.enable3D}
          showCompass={mapConfig.showCompass}
          showScale={mapConfig.showScale}
          markers={markers}
          polyline={polyline}
          onUpdated={() => console.log("地图更新完成")}
        />
        <View className="ride-info-container">
          <View className="order-info-container">
            {/* 进度条 */}
            <View className="progress-container">
              <Text className="progress-label">行程进度</Text>
              <View className="progress-bar">
                <View 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                />
              </View>
              <Text className="progress-label">{`${progress.toFixed(1)}%`}</Text>
            </View>

            {/* 路线信息 */}
            <View className="route-info">
              <View className="route-details">
                <Text className="route-time">
                  {orderInfo.estimated_arrival_time ? `预计 ${orderInfo.estimated_arrival_time}` : "时间未知"}
                </Text>
                <Text className="route-distance">
                  {orderInfo.distance ? `${orderInfo.distance}公里` : "距离未知"}
                </Text>
              </View>
            </View>

            {/* 反馈按钮 */}
            <View className="feedback-container">
              <Button className="feedback-button" onClick={handleFeedback}>
                问题反馈
              </Button>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default RideInProgress;
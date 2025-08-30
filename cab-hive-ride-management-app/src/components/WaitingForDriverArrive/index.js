import { View, Map, Text } from "@tarojs/components";
import { useEffect, useState } from "react";
import "./index.scss";
import { OrderStatus } from "../../services/order";

const WaitingForDriverArrive = ({ orderInfo, driverLocation }) => {
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

  // 更新司机位置
  useEffect(() => {
    if (!driverLocation) return
    // 更新标记点，保留起点和终点，更新司机位置
    setMarkers(prevMarkers => {
      // 查找起点和终点标记
      const startMarker = prevMarkers.find(marker => marker.id === 0);
      const endMarker = prevMarkers.find(marker => marker.id === 1);
      const driverMarker = {
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
      }
      // 返回更新后的标记数组
      return [startMarker, endMarker, driverMarker].filter(marker => marker !== undefined);
    });
  }, [driverLocation])

  // 更新地图标记
  useEffect(() => {
    if (!orderInfo || (orderInfo.status != OrderStatus.WaitingForPickup && orderInfo.status != OrderStatus.DriverArrived)) return;

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

    // 设置初始标记点
    setMarkers([startMarker, endMarker]);

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

  }, [orderInfo]);

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
            {/* 等待司机接单提示 */}
            <View className="waiting-info">
              {orderInfo.status === OrderStatus.WaitingForPickup ?
                <Text className="waiting-text">司机正在赶来...</Text> :
                <Text className="waiting-text">司机已经到达，请尽快上车</Text>
              }
            </View>

            {/* 司机信息 */}
            <View className="driver-info">
              <Text className="driver-name">
                {orderInfo.driver_name ? `${orderInfo.driver_name.charAt(0)}师傅` : "司机"}
              </Text>
            </View>

            {/* 车辆信息 */}
            <View className="vehicle-info">
              <View className="vehicle-details">
                <Text className="vehicle-plate">{orderInfo.vehicle_plate || "车牌号未知"}</Text>
                <Text className="vehicle-color">{orderInfo.vehicle_color || ""}</Text>
                <Text className="vehicle-model">{orderInfo.vehicle_model || "车型未知"}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default WaitingForDriverArrive;
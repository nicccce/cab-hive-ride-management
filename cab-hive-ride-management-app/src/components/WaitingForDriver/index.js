import { View, Map, Text } from "@tarojs/components";
import { Button, Dialog } from "@taroify/core";
import Taro from "@tarojs/taro";
import { useEffect, useState } from "react";
import { cancelOrder } from "../../services/order";
import "./index.scss";

const WaitingForDriver = ({ orderInfo, onOrderCancelled }) => {
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

  // 格式化时间
  const formatDuration = (minutes) => {
    if (!minutes || Number.isNaN(minutes)) return "未知时间";
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}小时${minutes % 60}分钟`;
    return `${minutes}分钟`;
  };

  // 更新地图标记
  useEffect(() => {
    if (!orderInfo) return;

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

  // 处理取消订单
  const handleCancelOrder = async () => {
    try {
      // 使用 Dialog.alert 来显示确认对话框，并通过 onConfirm 和 onCancel 回调处理用户选择
      Dialog.confirm({
        title: "确认取消订单",
        message: "您确定要取消这个订单吗？",
        onConfirm: async () => {
          // 用户点击确认
          const result = await cancelOrder(orderInfo.id);
          if (result.success) {
            Taro.showToast({
              title: "订单已取消",
              icon: "success",
            });
            // 通知父组件订单已取消
            if (onOrderCancelled) {
              onOrderCancelled();
            }
          } else {
            Taro.showToast({
              title: result.message || "取消订单失败",
              icon: "none",
            });
          }
        },
        onCancel: () => {
          // 用户点击取消，不执行任何操作
        }
      });
    } catch (error) {
      console.error("取消订单失败：", error);
      Taro.showToast({
        title: "取消订单失败，请重试",
        icon: "none",
      });
    }
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
            {/* 等待司机接单提示 */}
            <View className="waiting-info">
              <Text className="waiting-text">正在等待司机接单...</Text>
            </View>

            {/* 取消订单按钮 */}
            <Button
              className="cancel-order-button"
              color="danger"
              onClick={handleCancelOrder}
            >
              取消订单
            </Button>

            {/* 起点和终点信息 */}
            <View className="simple-route-info">
              <Text className="start-location-text">
                {orderInfo.start_location?.name || "出发点"}
              </Text>
              <Text className="separator"> → </Text>
              <Text className="end-location-text">
                {orderInfo.end_location?.name || "终点"}
              </Text>
            </View>

            {/* 路线信息 */}
            <View className="route-info">
              <View className="route-details">
                <Text className="route-time">{formatDuration(orderInfo.duration)}</Text>
                <Text className="route-distance">{orderInfo.distance}公里</Text>
              </View>
              {orderInfo.toll > 0 && (
                <View className="route-details">
                  <Text className="route-tolls">过路费: {orderInfo.toll}元</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default WaitingForDriver;
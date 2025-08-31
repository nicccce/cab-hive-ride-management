import { View, Map, Text } from "@tarojs/components";
import { useEffect, useState } from "react";
import { Progress } from "@taroify/core";
import Taro from "@tarojs/taro";
import "./index.scss";
import { OrderStatus, submitFeedback } from "../../services/order";
import Feedback from "../Feedback";

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
    // 行程进度
    const [progress, setProgress] = useState(0);
    // 反馈模态框显示状态
    const [showFeedback, setShowFeedback] = useState(false);
  // 更新地图标记和计算进度
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

      // 计算行程进度
      calculateProgress(
        driverLocation,
        orderInfo.start_location,
        orderInfo.end_location
      );
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

  // 计算行程进度的函数
  const calculateProgress = (driverPos, startLocation, endLocation) => {
    try {
      // 计算司机到终点的距离
      const driverToEnd = calculateDistance(
        driverPos.latitude,
        driverPos.longitude,
        endLocation.latitude,
        endLocation.longitude
      );

      // 计算总距离（起点到终点）
      const totalDistance = calculateDistance(
        startLocation.latitude,
        startLocation.longitude,
        endLocation.latitude,
        endLocation.longitude
      );

      // 计算进度百分比
      // 进度 = (总距离 - 司机到终点的距离) / 总距离 * 100
      const progressPercent = ((totalDistance - driverToEnd) / totalDistance) * 100;
      
      // 确保进度在0-100之间
      const clampedProgress = Math.max(0, Math.min(100, progressPercent));
      
      setProgress(clampedProgress);
    } catch (error) {
      console.error("计算行程进度时出错:", error);
      setProgress(0);
    }
  };

  // 计算两点间距离的函数（使用Haversine公式）
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c; // 距离（米）
    return d;
  };

  // 处理反馈按钮点击
  const handleFeedback = () => {
    setShowFeedback(true);
  };

  // 处理反馈提交
  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      const response = await submitFeedback(feedbackData);
      if (response.code === 200) {
        Taro.showToast({
          title: "反馈提交成功",
          icon: "success",
          duration: 2000
        });
        setShowFeedback(false);
      } else {
        Taro.showToast({
          title: response.message || "提交失败，请重试",
          icon: "none",
          duration: 2000
        });
      }
    } catch (error) {
      console.error("提交反馈失败:", error);
      Taro.showToast({
        title: "提交失败，请重试",
        icon: "none",
        duration: 2000
      });
    }
  };

  // 处理取消反馈
  const handleCancelFeedback = () => {
    setShowFeedback(false);
  };

  if (!orderInfo) {
    return (
      <View className="ride-in-progress-container">
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
          {/* 进度条 */}
          <View className="progress-container">
            <View className="progress-info">
              <Text className="progress-text">行程进度</Text>
              <Text className="progress-percent">{progress.toFixed(1)}%</Text>
            </View>
            <Progress
              className="blue-gradient-progress"
              percent={progress}
              strokeWidth={10}
            />
          </View>
          
          {/* 反馈按钮 */}
          <View className="feedback-button-container">
            <View className="feedback-button" onClick={handleFeedback}>
              <Text className="feedback-button-text">反馈</Text>
            </View>
          </View>
        </View>
        {/* 反馈模态框 */}
        {showFeedback && orderInfo && (
          <Feedback
            orderId={orderInfo.id}
            onSubmit={handleFeedbackSubmit}
            onCancel={handleCancelFeedback}
          />
        )}
      </View>
    </View>
  );
};

export default RideInProgress;
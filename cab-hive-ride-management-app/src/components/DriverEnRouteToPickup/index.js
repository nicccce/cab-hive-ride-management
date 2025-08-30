import { View, Map, Text, Button } from "@tarojs/components";
import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import "./index.scss";

const DriverEnRouteToPickup = ({ unfinishedOrder, driverLocation }) => {
    // 地图初始配置
    const [mapConfig, setMapConfig] = useState({
        longitude: 120.1551, // 杭州经度
        latitude: 30.2742,   // 杭州纬度
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
                title: "我的位置",
                width: 30,
                height: 30,
                callout: {
                    content: "我的位置",
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
        if (!unfinishedOrder) return;

        // 设置起点标记
        const startMarker = {
            id: 0,
            latitude: unfinishedOrder.start_location.latitude,
            longitude: unfinishedOrder.start_location.longitude,
            title: "乘客起点",
            width: 30,
            height: 30,
            callout: {
                content: "乘客起点",
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
            latitude: unfinishedOrder.end_location.latitude,
            longitude: unfinishedOrder.end_location.longitude,
            title: "乘客终点",
            width: 30,
            height: 30,
            callout: {
                content: "乘客终点",
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
            longitude: unfinishedOrder.start_location.longitude,
            latitude: unfinishedOrder.start_location.latitude,
            scale: 14,
        }));

        // 设置路线
        if (unfinishedOrder.route_points && unfinishedOrder.route_points.length > 0) {
            // 过滤有效的坐标点
            const validPoints = unfinishedOrder.route_points.filter(point =>
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

            }
        }

    }, [unfinishedOrder]);

    // 导航至起点
    const navigateToStart = () => {
        if (!unfinishedOrder) return;

        // 使用微信小程序的打开地图导航功能
        Taro.openLocation({
          latitude: unfinishedOrder.start_location.latitude,
          longitude: unfinishedOrder.start_location.longitude,
          name: unfinishedOrder.start_location.name || '乘客起点',
          address: unfinishedOrder.start_location.address || '乘客起点',
          scale: 18
        }).catch(err => {
          console.error('导航失败:', err);
          Taro.showToast({
            title: '导航失败，请重试',
            icon: 'none'
          });
        });
    };

    if (!unfinishedOrder) {
        return (
            <View className="driver-en-route-container">
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
                        {/* 订单信息 */}
                        <View className="order-info">
                            <Text className="order-status">前往接乘客</Text>
                        </View>

                        {/* 订单详情 */}
                        <View className="order-details">
                            <View className="route-info">
                                <View className="route-details">
                                    <Text className="route-time">
                                        {unfinishedOrder.start_time ? `预约时间: ${new Date(unfinishedOrder.start_time).toLocaleString()}` : ""}
                                    </Text>
                                </View>
                                <View className="route-details">
                                    <Text className="route-distance">
                                        {unfinishedOrder.distance ? `距离: ${(unfinishedOrder.distance / 1000).toFixed(1)}公里` : ""}
                                    </Text>
                                    <Text className="route-tolls">
                                        {unfinishedOrder.fare ? `预估费用: ${unfinishedOrder.fare}元` : ""}
                                    </Text>
                                </View>
                            </View>

                            {/* 起点和终点信息 */}
                            <View className="location-info">
                                <View className="location-item start-location">
                                    <Text className="location-label">起点:</Text>
                                    <Text className="location-name">{unfinishedOrder.start_location.name == "当前位置"
                                      ? "乘客位置(见地图)" :
                                      unfinishedOrder.start_location.name}</Text>
                                </View>
                                <View className="location-item end-location">
                                    <Text className="location-label">终点:</Text>
                                    <Text className="location-name">{unfinishedOrder.end_location.name || "未知地点"}</Text>
                                </View>
                            </View>
                        </View>

                        {/* 导航按钮 */}
                        <Button
                          className="navigate-button"
                          onClick={navigateToStart}
                        >
                            导航至起点
                        </Button>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default DriverEnRouteToPickup;
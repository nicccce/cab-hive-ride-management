import { View, Map, Text } from "@tarojs/components";
import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import { finishOrder } from "../../services/order";
import "./index.scss";

const DriverRideInProgress = ({ unfinishedOrder, driverLocation }) => {
    // 地图初始配置
    const [mapConfig, setMapConfig] = useState({
        longitude: 120.1551, // 杭州经度
        latitude: 30.2742,   // 杭州纬度
        scale: 16, // 更大的比例尺，聚焦于司机位置
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
    
    // 滑块相关状态
    const [sliderPosition, setSliderPosition] = useState(0);
    const [isSliding, setIsSliding] = useState(false);

    // 更新司机位置
    useEffect(() => {
        if (!driverLocation) return;
        
        // 更新地图中心点到司机位置
        setMapConfig(prev => ({
            ...prev,
            longitude: driverLocation.longitude,
            latitude: driverLocation.latitude,
            scale: 16 // 保持聚焦比例
        }));
        
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
            };
            // 返回更新后的标记数组
            return [startMarker, endMarker, driverMarker].filter(marker => marker !== undefined);
        });
    }, [driverLocation]);

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

    // 处理滑块触摸开始
    const handleTouchStart = () => {
        setIsSliding(true);
    };

    // 处理滑块触摸移动
    const handleTouchMove = (e) => {
        if (!isSliding) return;
        
        const touch = e.touches[0];
        // 使用 Taro 的选择器查询 API 获取滑块轨道的尺寸
        const query = Taro.createSelectorQuery();
        query.select('.slider-track').boundingClientRect();
        query.exec((res) => {
            if (res[0]) {
                const sliderRect = res[0];
                const newPosition = Math.max(0, Math.min(sliderRect.width, touch.clientX - sliderRect.left));
                setSliderPosition(newPosition);
            }
        });
    };

    // 处理滑块触摸结束
    const handleTouchEnd = () => {
        if (!isSliding) return;
        
        setIsSliding(false);
        
        // 如果滑块滑到了最右边，执行结束订单操作
        // 使用 Taro 的选择器查询 API 获取滑块轨道的尺寸
        const query = Taro.createSelectorQuery();
        query.select('.slider-track').boundingClientRect();
        query.exec((res) => {
            if (res[0]) {
                const sliderRect = res[0];
                if (sliderPosition >= sliderRect.width - 20) { // 允许一些误差
                    finishOrder().then(response => {
                        if (response.success) {
                            Taro.showToast({
                                title: "订单结束成功",
                                icon: "success",
                                duration: 2000
                            });
                            // 这里可以添加跳转到其他页面的逻辑
                        } else {
                            Taro.showToast({
                                title: response.meessage || "结束订单失败,请确认目的地位置",
                                icon: "none",
                                duration: 2000
                            });
                        }
                    }).catch(error => {
                        console.error("结束订单失败:", error);
                        Taro.showToast({
                            title: "结束订单失败，请重试",
                            icon: "none",
                            duration: 2000
                        });
                    });
                }
                
                // 重置滑块位置
                setSliderPosition(0);
            }
        });
    };

    if (!unfinishedOrder) {
        return (
            <View className="driver-ride-in-progress-container">
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
                    {/* 起点到终点的箭头指示 */}
                    <View className="route-direction-container">
                        <Text className="location-name">{unfinishedOrder.start_location.name == "当前位置"
                          ? "乘客位置(见地图)" :
                          unfinishedOrder.start_location.name}</Text>
                        <Text className="arrow">→</Text>
                        <Text className="location-name">{unfinishedOrder.end_location.name || "未知地点"}</Text>
                    </View>
                    
                    {/* 结束订单滑块 */}
                    <View className="finish-order-slider-container">
                        <View
                          className="slider-track"
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                        >
                            <View 
                              className="slider-thumb"
                              style={{ transform: `translateX(${sliderPosition}px)` }}
                            >
                                <Text className="slider-text">滑动结束订单</Text>
                            </View>
                            <View className="slider-fill" style={{ width: `${sliderPosition}px` }}></View>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default DriverRideInProgress;
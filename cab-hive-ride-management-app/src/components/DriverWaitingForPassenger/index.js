import { View, Map, Text, Button } from "@tarojs/components";
import { useEffect, useState } from "react";
import Taro from "@tarojs/taro";
import { Dialog, Input, Form, Button as TaroifyButton } from "@taroify/core";
import { getOrderPhoneDigits, verifyPhoneAndStartOrder } from "../../services/order";
import "./index.scss";

const DriverWaitingForPassenger = ({ unfinishedOrder, driverLocation }) => {
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

    // 弹窗控制
    const [open, setOpen] = useState(false);
    // 表单数据
    const [formValue, setFormValue] = useState({
        digit1: "",
        digit2: ""
    });
    
    // 乘客手机尾号
    const [phoneDigits, setPhoneDigits] = useState("");

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

    // 获取乘客手机尾号
    const fetchPhoneDigits = async () => {
        try {
            const response = await getOrderPhoneDigits();
            
            if (response.success) {
                setPhoneDigits(response.data.phone_last_digits);
                setOpen(true);
            } else {
                Taro.showToast({
                    title: response.message || "获取乘客信息失败",
                    icon: "none",
                    duration: 2000
                });
            }
        } catch (error) {
            console.error("获取乘客手机尾号失败:", error);
            Taro.showToast({
                title: "获取乘客信息失败",
                icon: "none",
                duration: 2000
            });
        }
    };

    // 开始行程
    const startTrip = async () => {
        if (!formValue.digit1 || !formValue.digit2) {
            Taro.showToast({
                title: "请输入完整的手机尾号",
                icon: "none",
                duration: 2000
            });
            return;
        }
        
        const phoneLastDigits = formValue.digit1 + formValue.digit2;
        
        try {
            const response = await verifyPhoneAndStartOrder({
                phone_last_digits: phoneLastDigits
            });
            
            if (response.success) {
                Taro.showToast({
                    title: "行程开始成功",
                    icon: "success",
                    duration: 2000
                });
                setOpen(false);
                // 这里可以添加跳转到行程中页面的逻辑
            } else {
                Taro.showToast({
                    title: response.message || "验证失败",
                    icon: "none",
                    duration: 2000
                });
            }
        } catch (error) {
            console.error("验证手机尾号失败:", error);
            Taro.showToast({
                title: "验证失败，请重试",
                icon: "none",
                duration: 2000
            });
        }
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
                            <Text className="order-status">等待乘客上车</Text>
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

                        {/* 开始行程按钮 */}
                        <Button
                          className="navigate-button"
                          onClick={fetchPhoneDigits}
                        >
                            开始行程
                        </Button>
                    </View>
                </View>
            </View>
            
            {/* 验证手机尾号弹窗 */}
            <Dialog open={open} onClose={setOpen}>
                <Dialog.Header>验证乘客信息</Dialog.Header>
                <Dialog.Content>
                    <Form>
                        <View className="phone-digits-display">
                            <Text className="label">乘客手机尾号:</Text>
                            <View className="digits-container">
                                <View className="digit-box">{phoneDigits.charAt(0)}</View>
                                <View className="digit-box">{phoneDigits.charAt(1)}</View>
                            </View>
                        </View>
                        
                        <View className="input-container">
                            <Text className="label">请输入后两位:</Text>
                            <View className="input-boxes">
                                <Input
                                  className="digit-input"
                                  maxlength={1}
                                  value={formValue.digit1}
                                  onInput={(e) => setFormValue({...formValue, digit1: e.detail.value})}
                                />
                                <Input
                                  className="digit-input"
                                  maxlength={1}
                                  value={formValue.digit2}
                                  onInput={(e) => setFormValue({...formValue, digit2: e.detail.value})}
                                />
                            </View>
                        </View>
                    </Form>
                </Dialog.Content>
                <Dialog.Actions>
                    <TaroifyButton 
                      onClick={() => setOpen(false)}
                      variant="text"
                    >
                        取消
                    </TaroifyButton>
                    <TaroifyButton 
                      onClick={startTrip}
                      color="primary"
                    >
                        确认
                    </TaroifyButton>
                </Dialog.Actions>
            </Dialog>
        </View>
    );
};

export default DriverWaitingForPassenger;
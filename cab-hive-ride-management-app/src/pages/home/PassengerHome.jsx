import { View, Map, Text } from "@tarojs/components";
import { Button } from "@taroify/core";
import Taro, { useDidShow, useDidHide } from "@tarojs/taro";
import { useState, useEffect, useRef, useCallback } from "react";
import { navigateToLocationPlugin } from "../../services/location";
import "./index.scss";

const PassengerHome = () => {
  // 地图初始配置
  const [mapConfig, setMapConfig] = useState({
    longitude: 120.1551, // 杭州经度
    latitude: 30.2742, // 杭州纬度
    scale: 16,
    showLocation: true,
    enableScroll: true,
    enableRotate: false,
    enableZoom: true,
    enable3D: false,
    showCompass: false,
    showScale: true,
  });

  // 起点位置状态
  const [startLocation, setStartLocation] = useState(null);
  // 终点位置状态
  const [endLocation, setEndLocation] = useState(null);
  // 记录在选哪个位置
  const [selectedLocation, setSelectedLocation] = useState(null);
  // 用户当前位置状态
  const [userLocation, setUserLocation] = useState(null);
  // 地图标记点
  const [markers, setMarkers] = useState([]);
  // 位置跟踪定时器引用
  const loopRef = useRef(null);
  //获取当前状态（选择地点还是选择路线）
  const [step, setStep] = useState("location");

  // 获取用户当前位置
  const getCurrentLocation = async () => {
    try {
      const res = await Taro.getLocation({
        type: "gcj02", // 使用国测局坐标，适用于腾讯地图
        isHighAccuracy: true, // 开启高精度定位
        highAccuracyExpireTime: 4000, // 高精度定位超时时间(ms)
      });

      const location = {
        latitude: res.latitude,
        longitude: res.longitude,
      };

      setUserLocation(location);
      return location;
    } catch (error) {
      console.error("获取位置失败：", error);
      Taro.showToast({
        title: "定位失败，请检查权限设置",
        icon: "none",
      });
      // 如果获取位置失败，返回默认位置
      return {
        latitude: mapConfig.latitude,
        longitude: mapConfig.longitude,
      };
    }
  };

  // 开始位置跟踪
  const startLoop = () => {
    // 先清除已存在的定时器
    if (loopRef.current) {
      clearInterval(loopRef.current);
    }

    // 设置新的定时器，每2秒获取一次位置
    loopRef.current = setInterval(async () => {
      // 可以在这里添加其他处理逻辑，比如更新UI等
    }, 2000);
  };

  // 停止位置跟踪
  const stopLoop = () => {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
  };

  // 选择起点
  const handleChooseStart = async () => {
    try {
      let location = startLocation;
      if (!location) {
        // 先获取用户当前位置
        location = await getCurrentLocation();
      }
      setSelectedLocation(0);
      // 调用位置选择插件，传递用户当前位置作为初始位置
      await navigateToLocationPlugin({
        location: location,
      });
    } catch (error) {
      console.error("打开选点插件失败:", error);
      Taro.showToast({
        title: "打开地图失败",
        icon: "none",
      });
    }
  };

  // 选择终点
  const handleChooseEnd = async () => {
    try {
      let location = endLocation;
      if (!location) {
        // 先获取用户当前位置
        location = await getCurrentLocation();
      }
      setSelectedLocation(1);
      // 调用位置选择插件，传递用户当前位置作为初始位置
      await navigateToLocationPlugin({
        location: location,
      });
    } catch (error) {
      console.error("打开选点插件失败:", error);
      Taro.showToast({
        title: "打开地图失败",
        icon: "none",
      });
    }
  };

  // 页面显示时获取选点结果并恢复位置跟踪
  useDidShow(() => {
    try {
      // 恢复位置跟踪
      startLoop();

      const chooseLocation = requirePlugin("chooseLocation");
      if (!chooseLocation) {
        throw new Error("地图插件未初始化");
      }

      const location = chooseLocation.getLocation();
      if (location) {
        console.log("选点结果：", location);
        if (selectedLocation === 0) {
          setStartLocation(location);
          updateStartLocation(location, location.name || "选择的位置");
        } else if (selectedLocation === 1) {
          setEndLocation(location);
          updateEndLocation(location, location.name || "选择的位置");
        }
      }
    } catch (error) {
      console.error("获取选点结果失败:", error);
    }
  });

  // 页面隐藏时清理插件数据并停止位置跟踪
  useDidHide(() => {
    try {
      // 停止位置跟踪
      stopLoop();

      const chooseLocation = requirePlugin("chooseLocation");
      chooseLocation.setLocation(null);
    } catch (error) {
      console.error("清理插件数据失败:", error);
    }
  });

  // 使用 useCallback 包装更新函数
  const updateStartLocation = useCallback(
    (location, title = "出发点") => {
      if (!location || !location.latitude || !location.longitude) {
        console.warn("无效的位置数据:", location);
        return;
      }

      setMapConfig((prev) => ({
        ...prev,
        longitude: location.longitude,
        latitude: location.latitude,
      }));

      const newMarker = {
        id: 0,
        latitude: location.latitude,
        longitude: location.longitude,
        title: title,
        width: 30,
        height: 30,
        callout: {
          content: title,
          color: "#000",
          fontSize: 14,
          borderRadius: 4,
          padding: 8,
          display: "ALWAYS",
        },
      };

      setMarkers((prev) => [newMarker, prev[1]]);
    },
    [setMapConfig, setMarkers]
  ); // 添加所有依赖的状态更新函数

  const updateEndLocation = useCallback(
    (location, title = "终点") => {
      if (!location || !location.latitude || !location.longitude) {
        setMarkers((prev) => [prev[0]]);
        return;
      }

      setMapConfig((prev) => ({
        ...prev,
        longitude: location.longitude,
        latitude: location.latitude,
      }));

      const newMarker = {
        id: 1,
        latitude: location.latitude,
        longitude: location.longitude,
        title: title,
        width: 30,
        height: 30,
        callout: {
          content: title,
          color: "#000",
          fontSize: 14,
          borderRadius: 4,
          padding: 8,
          display: "ALWAYS",
        },
      };

      setMarkers((prev) => [prev[0], newMarker]);
    },
    [setMapConfig, setMarkers]
  ); // 添加所有依赖的状态更新函数

  // 修复后的 useEffect
  useEffect(() => {
    updateStartLocation(startLocation, "出发点");
    updateEndLocation(endLocation, "终点");
  }, [startLocation, endLocation, updateStartLocation, updateEndLocation]);

  // 组件加载时获取用户位置
  useEffect(() => {
    const initLocation = async () => {
      const location = await getCurrentLocation();
      if (location && !startLocation) {
        console.log("初始化起点位置：", { ...location, name: "当前位置" });
        setStartLocation({ ...location, name: "当前位置" });
      }
    };

    initLocation();
  }, []);

  // 启动和停止位置跟踪
  useEffect(() => {
    // 组件挂载时启动位置跟踪
    startLoop();

    // 组件卸载时停止位置跟踪
    return () => {
      stopLoop();
    };
  }, []);

  const handleClearStart = async () => {
    let location = await getCurrentLocation();
    setStartLocation({ ...location, name: "当前位置" });
  };

  const handleClearEnd = () => {
    setEndLocation(null);
  };

  const handleNowDepart = () => {};

  const handleReserveDepart = () => {};

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
          onUpdated={() => console.log("地图更新完成")}
        />
        <View className="ride-info-container">
          {/* 选择起点按钮和位置信息 */}
          <View className="amap-location-selector">
            {/* 起点选择行 */}
            <View
              className="location-row start-row"
              onClick={handleChooseStart}
            >
              <View className="location-marker start-marker"></View>
              <View className="location-text">
                {startLocation ? startLocation.name : "选择起点"}
              </View>
              {startLocation && (
                <View
                  className="clear-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    handleClearStart(e);
                  }}
                >
                  ×
                </View>
              )}
            </View>

            {/* 分割线 */}
            <View className="divider-line"></View>

            {/* 终点选择行 */}
            <View className="location-row end-row" onClick={handleChooseEnd}>
              <View className="location-marker end-marker"></View>
              <View className="location-text">
                <Text className="placeholder-text">
                  {endLocation ? endLocation.name : "你要去哪儿？"}
                </Text>
              </View>
              {endLocation && (
                <View
                  className="clear-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    handleClearEnd(e);
                  }}
                >
                  ×
                </View>
              )}
            </View>
          </View>

          {step == "location" && (
            <>
            <Button.Group
              variant="contained"
              size="large"
              shape="round"
              block
              disabled={!(startLocation && endLocation)}
            >
              <Button
                onClick={handleNowDepart}
                className="flex-[3] min-w-0 rounded-l-[50px] rounded-r-none"
                color="primary"
                style={{
                  "--button-color": "var(--button-primary-color)",
                }}
              >
                现在出发
              </Button>
              <Button
                onClick={handleReserveDepart}
                className="flex-[1] min-w-0 rounded-r-[50px] rounded-l-none bg-white text-gray-800"
                style={{
                  "--button-background-color": "#fff",
                  "--button-color": "#333",
                }}
              >
                预约出发
              </Button>
            </Button.Group>
            </>
          )}
          {/* <View className="button-group">
            <Button className="now-depart-button" onClick={handleNowDepart}>
              现在出发
            </Button>
            <Button className="reserve-depart-button" size="small" onClick={handleReserveDepart}>
              预约出发
            </Button>
          </View> */}
        </View>
      </View>
    </View>
  );
};

export default PassengerHome;

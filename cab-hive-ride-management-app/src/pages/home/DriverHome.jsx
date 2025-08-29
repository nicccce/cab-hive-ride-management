import { useState,useRef } from "react";
import { View, Map } from "@tarojs/components";
import Taro, { useDidHide, useDidShow } from "@tarojs/taro";
import useAuth from "../../hooks/useAuth";
import { getVehicleList } from "../../services/vehicle";
import DriverOrderPanel from "../../components/DriverOrderPanel/index";
import "./DriverHome.scss";
import { getDriverUnfinishedOrder } from "../../services/order";

const DriverHome = () => {
  const { userInfo } = useAuth();
  const [isWorking, setIsWorking] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  // 定时器引用
  const loopRef = useRef(null);
  // 未完成订单状态
  const [unfinishedOrder, setUnfinishedOrder] = useState(null);

  // 开始定时
  const startLoop = () => {
    // 先清除已存在的定时器
    if (loopRef.current) {
      clearInterval(loopRef.current);
    }

    // 设置新的定时器，每2秒执行一次
    loopRef.current = setInterval(async () => {
      try {
        // 获取用户未完成订单
        const res = await getDriverUnfinishedOrder();
        // 如果返回的数据为空，表示没有未完成订单
        if (!res.data) {
          setUnfinishedOrder(null);
        } else {
          setUnfinishedOrder(res.data);
        }
      } catch (error) {
        console.error("获取未完成订单失败：", error);
        Taro.showToast({
          title: "获取订单信息失败",
          icon: "none",
        });
      }
    }, 2000);
  };

  // 停止定时
  const stopLoop = () => {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
  };

  // 页面显示时获取选点结果并恢复定时
  useDidShow(() => {
    // 恢复定时
    startLoop();
  });

  // 页面隐藏时清理插件数据并停止位置跟踪
  useDidHide(() => {
    // 停止位置跟踪
    stopLoop();
  });

  // 地图初始配置
  const mapConfig = {
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
  };

  // 获取车辆列表
  const fetchVehicles = async () => {
    try {
      const result = await getVehicleList();
      if (result.success && result.data.vehicles) {
        setVehicles(result.data.vehicles);
      }
    } catch (error) {
      console.error("获取车辆列表失败:", error);
      Taro.showToast({
        title: "获取车辆信息失败",
        icon: "error",
      });
    }
  };

  // 开始工作
  const startWork = () => {
    fetchVehicles();
  };

  // 选择车辆
  const selectVehicle = (vehicle) => {
    if (vehicle.status === "approved") {
      setSelectedVehicle(vehicle);
      setIsWorking(true);

      Taro.showToast({
        title: "开始接单",
        icon: "success",
      });
    } else {
      Taro.showToast({
        title: "请选择已审核通过的车辆",
        icon: "none",
      });
    }
  };

  // 停止工作
  const stopWork = () => {
    setIsWorking(false);
    setSelectedVehicle(null);

    Taro.showToast({
      title: "已停止接单",
      icon: "success",
    });
  };

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
        />

        <DriverOrderPanel
          userInfo={userInfo}
          vehicles={vehicles}
          isWorking={isWorking}
          selectedVehicle={selectedVehicle}
          onVehicleSelect={selectVehicle}
          onStartWork={startWork}
          onStopWork={stopWork}
          fetchVehicles={fetchVehicles}
        />
      </View>
    </View>
  );
};

export default DriverHome;

import { useState, useRef, useEffect } from "react";
import { View, Map } from "@tarojs/components";
import Taro, { useDidHide, useDidShow } from "@tarojs/taro";
import useAuth from "../../hooks/useAuth";
import { getVehicleList } from "../../services/vehicle";
import DriverOrderPanel from "../../components/DriverOrderPanel/index";
import "./DriverHome.scss";
import { getDriverUnfinishedOrder, requestOrder } from "../../services/order";
import { uploadDriverLocation } from "../../services/location";

const DriverHome = () => {
  const { userInfo } = useAuth();
  const [isWorking, setIsWorking] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  // 未完成订单状态
  const [unfinishedOrder, setUnfinishedOrder] = useState(null);
  // 司机可接订单
  const [availableOrder, setAvailableOrder] = useState(null);
  // 订单轮询定时器引用
  const orderPollingTimerRef = useRef(null);
  // 后台任务定时器引用（位置上传等）
  const backgroundTaskTimerRef = useRef(null);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      // 清理订单轮询定时器
      if (orderPollingTimerRef.current) {
        clearInterval(orderPollingTimerRef.current);
      }

      // 清理后台任务定时器
      if (backgroundTaskTimerRef.current) {
        clearInterval(backgroundTaskTimerRef.current);
      }
    };
  }, []);

  const checkUnfinishedOrder = async () => {
    try {
      // 获取用户未完成订单
      const res = await getDriverUnfinishedOrder();
      // 如果返回的数据为空，表示没有未完成订单
      if (!res.data) {
        setUnfinishedOrder(null);
      } else {
        setUnfinishedOrder(res.data);
        setSelectedVehicle(unfinishedOrder.vehicle_id);
        setIsWorking(true);
      }
    } catch (error) {
      console.error("获取未完成订单失败：", error);
      Taro.showToast({
        title: "获取订单信息失败",
        icon: "none",
      });
    }
  };

  const getAvailableOrder = async () => {
    try {
      const response = await requestOrder();
      if (response.code === 200 && response.data) {
        setAvailableOrder(response.data);
      } else {
        // 如果没有订单，清空当前订单
        setAvailableOrder(null);
      }
    } catch (error) {
      console.error("请求订单失败:", error);
      // 请求失败时也清空当前订单
      setAvailableOrder(null);
    }
  };

  // 获取当前位置
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      Taro.getLocation({
        type: "gcj02", // 使用国测局坐标系
        success: (res) => {
          resolve({
            latitude: res.latitude,
            longitude: res.longitude,
          });
        },
        fail: (error) => {
          console.error("获取位置失败：", error);
          reject(new Error("获取位置失败"));
        },
      });
    });
  };

  // 上传司机位置
  const uploadLocation = async () => {
    try {
      const location = await getCurrentLocation();
      await uploadDriverLocation(location);
      console.log("位置上传成功:", location);
    } catch (error) {
      console.error("位置上传失败：", error);
      // 不中断程序，继续尝试上传
    }
  };

  const orderPollingTasks = async() =>{
    await checkUnfinishedOrder();
    if(!unfinishedOrder) {
      // 如果没有进行中的订单，尝试获取可用订单
      await getAvailableOrder();
    }
  }

  const backgroundTasks = async () => {
    await uploadLocation();
  };

  // 开始订单轮询
  const startOrderPolling = () => {
    // 先清除已存在的定时器
    if (orderPollingTimerRef.current) {
      clearInterval(orderPollingTimerRef.current);
    }

    // 设置新的定时器，每2秒执行一次
    orderPollingTimerRef.current = setInterval(async () => {
      await orderPollingTasks();
    }, 2000);
  };

  // 停止订单轮询
  const stopOrderPolling = () => {
    if (orderPollingTimerRef.current) {
      clearInterval(orderPollingTimerRef.current);
    }
  };

  // 开始后台任务
  const startBackgroundTasks = () => {
    // 先清除已存在的定时器
    if (backgroundTaskTimerRef.current) {
      clearInterval(backgroundTaskTimerRef.current);
    }

    // 设置新的定时器，每30秒执行一次后台任务
    backgroundTaskTimerRef.current = setInterval(async () => {
      await backgroundTasks();
    }, 30000); // 30秒执行一次
  };

  // 停止后台任务
  const stopBackgroundTasks = () => {
    if (backgroundTaskTimerRef.current) {
      clearInterval(backgroundTaskTimerRef.current);
    }
  };

  // 页面显示时恢复定时
  useDidShow(() => {
    // 恢复订单轮询
    startOrderPolling();

    // 如果司机正在工作，恢复后台任务
    if (isWorking) {
      startBackgroundTasks();
    }
  });

  // 页面隐藏时清理插件数据并停止位置跟踪
  useDidHide(() => {
    // 停止订单轮询
    stopOrderPolling();

    // 不再停止后台任务定时器，让它持续运行
    // stopBackgroundTasks();
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

      // 开始后台任务
      startBackgroundTasks();

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

    // 停止后台任务
    stopBackgroundTasks();

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
          availableOrder={availableOrder}
        />
      </View>
    </View>
  );
};

export default DriverHome;

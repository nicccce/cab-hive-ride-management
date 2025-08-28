import Taro, { useDidHide, useDidShow } from "@tarojs/taro";
import { useRef, useState } from "react";
import { View } from "@tarojs/components";
import { getUnfinishedOrder } from "../../services/order";
import RideOrderPage from "./RideOrderPage";
import "./index.scss";

const PassengerHome = () => {
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
        const res = await getUnfinishedOrder();
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

  // 当没有未完成订单时显示 RideOrderPage
  return (
    <>
      {!unfinishedOrder ? (
        <RideOrderPage />
      ) : (
        <View>未完成订单: {JSON.stringify(unfinishedOrder)}</View>
      )}
    </>
  );
};

export default PassengerHome;

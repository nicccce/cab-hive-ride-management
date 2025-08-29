import Taro, { useDidHide, useDidShow } from "@tarojs/taro";
import { useEffect, useRef, useState } from "react";
import { View } from "@tarojs/components";
import { getUnfinishedOrder, OrderStatus } from "../../services/order";
import RideOrderPage from "../../components/RideOrder";
import WaitingForDriver from "../../components/WaitingForDriver";

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
          // 当订单状态为 waiting_for_payment 时跳转到 PaymentPage
          if (res.data.status === "waiting_for_payment") {
            console.log("跳转到支付页面，订单信息：", res.data);
            stopLoop();
            Taro.navigateTo({
              url: `/pages/payment/index?order=${encodeURIComponent(
                JSON.stringify(res.data)
              )}`,
            });
          }
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

  useEffect(() => {
    startLoop();
    return () => {
      clearInterval(loopRef.current);
    };
  }, []);

  return (
    <>
      {!unfinishedOrder ? (
        <RideOrderPage />
      ) : (
        (() => {
          console.log(
            `啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊啊宝宝你是个${unfinishedOrder.status}`
          );
          switch (unfinishedOrder.status) {
            case OrderStatus.WaitingForDriver:
              return (
                <WaitingForDriver
                  orderInfo={unfinishedOrder}
                  onOrderCancelled={() => setUnfinishedOrder(null)}
                />
              );
            case OrderStatus.WaitingForPickup:
              return <View>等待司机到达起点</View>;
            case OrderStatus.DriverArrived:
              return <View>司机已到达，等待上车</View>;
            case OrderStatus.InProgress:
              return <View>行程进行中</View>;
            case OrderStatus.WaitingForPayment:
              // 这个状态已经在定时器中处理了跳转，这里可以显示一个简单的信息
              return <View>等待支付响应</View>;
            default:
              return <View>未知订单状态: {unfinishedOrder.status}</View>;
          }
        })()
      )}
    </>
  );
};

export default PassengerHome;

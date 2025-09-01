import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { getRedisAlertsAsync } from '../store/modules/alert';
import { message } from 'antd';
import { orderService } from '../services/order';
import { eventEmitter } from '../utils/eventEmitter';

export const useAlertPolling = (isLoggedIn: boolean) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!isLoggedIn) return;

    // 定义获取预警的函数
    const fetchAlerts = async () => {
      try {
        // 先调用检查订单超时情况接口
        await orderService.checkOrderTimeout();
        
        // 再调用处理预约订单接口
        await orderService.processReserveOrders();
        
        // 最后调用Redis获取预警信息
        const action = await dispatch(getRedisAlertsAsync());
        
        // 检查是否有新的预警
        if (action.payload && Array.isArray(action.payload) && action.payload.length > 0) {
          // 直接以弹窗形式显示预警信息
          const newAlerts = action.payload;
          
          if (newAlerts.length > 0) {
            // 发送事件通知显示预警弹窗
            eventEmitter.emit('newAlerts', newAlerts);
            
            // 显示通知
            message.warning(`您有 ${newAlerts.length} 条新预警信息`);
          }
        }
      } catch (error) {
        console.error('获取预警信息失败:', error);
      }
    };

    // 立即执行一次
    fetchAlerts();

    // 每20秒执行一次
    const intervalId = setInterval(fetchAlerts, 20000);

    // 清理函数
    return () => {
      clearInterval(intervalId);
    };
  }, [isLoggedIn, dispatch]);
};
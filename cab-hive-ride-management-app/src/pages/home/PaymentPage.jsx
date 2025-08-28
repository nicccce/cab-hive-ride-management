import Taro, { useRouter } from '@tarojs/taro';
import { View, WebView, Button, Text } from '@tarojs/components';
import { useEffect, useState } from 'react';
import { createPaymentOrder, pollPaymentStatus } from '../../services/payment';
import './index.scss';

export default function PaymentPage() {
  console.log('PaymentPage rendered');
  const router = useRouter();
  const [payUrl, setPayUrl] = useState('');
  const [orderInfo, setOrderInfo] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(''); // pending, success, failed
  
  useEffect(() => {
    // 从路由参数获取订单信息
    const orderData = router.params.order ? JSON.parse(decodeURIComponent(router.params.order)) : null;
    if (orderData) {
      setOrderInfo(orderData);
    }
  }, []);

  // 处理支付按钮点击
  const handlePayment = async () => {
    if (!orderInfo) return;
    
    Taro.showLoading({ title: '正在创建支付订单...' });
    
    try {
      // 创建支付订单并获取支付链接
      const url = await createPaymentOrder(
        orderInfo.id, 
        orderInfo.fare, 
        `订单-${orderInfo.id}`, 
        orderInfo.user_id
      );
      
      Taro.hideLoading();
      setPayUrl(url);
      
      // 启动支付状态轮询
      startPaymentPolling(orderInfo.id);
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({
        title: '创建支付订单失败: ' + error.message,
        icon: 'none'
      });
    }
  };
  
  // 启动支付状态轮询
  const startPaymentPolling = async (orderId) => {
    setPaymentStatus('pending');
    
    const result = await pollPaymentStatus(orderId, 15); // 最多轮询15次
    
    if (result.success) {
      setPaymentStatus('success');
      Taro.showToast({
        title: '支付成功',
        icon: 'success'
      });
      
      // 支付成功后返回首页
      setTimeout(() => {
        Taro.switchTab({
          url: '/pages/home/index'
        });
      }, 1500);
    } else {
      setPaymentStatus('failed');
      Taro.showToast({
        title: result.message || '支付失败',
        icon: 'none'
      });
    }
  };
  
  // 处理页面导航变化（可选）
  const handleMessage = (e) => {
    console.log('WebView消息:', e);
  };
  
  // 渲染支付前的订单信息
  const renderOrderInfo = () => {
    if (!orderInfo) return null;
    
    return (
      <View className="payment-container">
        <View className="order-info">
          <Text className="order-title">待支付订单</Text>
          <View className="order-detail">
            <Text className="label">订单号:</Text>
            <Text className="value">{orderInfo.id}</Text>
          </View>
          <View className="order-detail">
            <Text className="label">订单金额:</Text>
            <Text className="value price">¥{orderInfo.fare}</Text>
          </View>
          {orderInfo.toll > 0 && (
            <View className="order-detail">
              <Text className="label">过路费:</Text>
              <Text className="value toll">¥{orderInfo.toll}</Text>
            </View>
          )}
          <View className="order-detail">
            <Text className="label">行程距离:</Text>
            <Text className="value">{(orderInfo.distance / 1000).toFixed(1)}公里</Text>
          </View>
          <View className="order-detail">
            <Text className="label">下单时间:</Text>
            <Text className="value">{new Date(orderInfo.created_at).toLocaleString()}</Text>
          </View>
        </View>
        
        <Button 
          className="payment-button" 
          type="primary" 
          onClick={handlePayment}
        >
          立即支付
        </Button>
      </View>
    );
  };
  
  // 渲染支付页面
  const renderPayment = () => {
    return (
      <View style={{ height: '100vh' }}>
        {payUrl ? (
          <WebView 
            src={payUrl} 
            onMessage={handleMessage}
          />
        ) : (
          <View>加载中...</View>
        )}
        
        {/* 支付状态提示 */}
        {paymentStatus === 'success' && (
          <View className="payment-status success">
            <Text>支付成功！正在跳转...</Text>
          </View>
        )}
        {paymentStatus === 'failed' && (
          <View className="payment-status failed">
            <Text>支付失败，请重新支付</Text>
            <Button onClick={() => setPayUrl('')}>重新支付</Button>
          </View>
        )}
        {paymentStatus === 'pending' && (
          <View className="payment-status pending">
            <Text>支付处理中，请稍候...</Text>
          </View>
        )}
      </View>
    );
  };
  
  return (
    <View className="container">
      {!payUrl ? renderOrderInfo() : renderPayment()}
    </View>
  );
}
import Taro, { useRouter } from '@tarojs/taro';
import { View, Button, Text, Image } from '@tarojs/components';
import { Notify } from '@taroify/core';
import '@taroify/core/notify/style';
import { useEffect, useState } from 'react';
import { createPaymentOrder } from '../../services/payment';
import { getOrderDetail } from '../../services/order';
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
  }, [router.params.order]);

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
        orderInfo.user_open_id
      );
      
      Taro.hideLoading();
      setPayUrl(url);
      
      // 检查一次支付状态
      checkPaymentStatus(orderInfo.id);
    } catch (error) {
      Taro.hideLoading();
      Taro.showToast({
        title: '创建支付订单失败: ' + error.message,
        icon: 'none'
      });
    }
  };
  
  // 检查支付状态
  const checkPaymentStatus = async (orderId) => {
    setPaymentStatus('pending');
    
    try {
      const result = await getOrderDetail(orderId);
      console.log('查询支付状态结果：', result);
      
      if (result && result.data && result.data.status !== 'waiting_for_payment') {
        setPaymentStatus('success');
        Notify.open({
          type: 'success',
          message: '支付成功'
        });
        
        // 支付成功后返回首页
        setTimeout(() => {
          Taro.switchTab({
            url: '/pages/home/index'
          });
        }, 1500);
      } else {
        setPaymentStatus('failed');
        Notify.open({
          type: 'danger',
          message: '支付失败或仍在等待支付'
        });
      }
    } catch (error) {
      setPaymentStatus('failed');
      Notify.open({
        type: 'danger',
        message: error.message || '查询支付状态失败'
      });
    }
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
        
        <View className="payment-methods">
          <Text className="head">选择以下支付方式付款</Text>
          <View className="item">
            <Button className="btn wx" onClick={() => {
              // 微信支付逻辑
              console.log('微信支付');
            }}
            />
            <Button className="btn alipay" onClick={handlePayment}></Button>
          </View>
        </View>
      </View>
    );
  };
  
  // 渲染支付页面
  const renderPayment = () => {
    return (
      <View style={{ height: '100vh' }}>
        {payUrl ? (
          <View className="alipay-guide">
            <Image
              className="alipay-logo"
              src="https://cdn.cnbj1.fds.api.mi-img.com/mi-mall/7b6b02396368c9314528c0bbd85a2e06.png"
              mode="aspectFit"
            />
            <View className="guide-header">
              <Text className="guide-title">检测到支付宝支付</Text>
              <Text className="guide-subtitle">请点击下方按钮在浏览器中打开完成支付</Text>
            </View>
            <View className="guide-buttons">
              <Button
                className="guide-button copy-button"
                onClick={() => {
                  Taro.setClipboardData({
                    data: payUrl,
                    success: () => {
                      Taro.showModal({
                        title: '提示',
                        content: '支付链接已复制，请粘贴到浏览器中打开',
                        showCancel: false
                      });
                    }
                  });
                }}
              >
                <Text className="button-icon">📋</Text>
                <Text>复制支付链接</Text>
              </Button>
              <Button
                className="guide-button browser-button"
                onClick={() => {
                  Taro.showModal({
                    title: '提示',
                    content: '请点击右上角···选择"在浏览器打开"',
                    showCancel: false
                  });
                }}
              >
                <Text className="button-icon">🌐</Text>
                <Text>在浏览器打开</Text>
              </Button>
              <Button className="retry-button" onClick={() => setPayUrl('')}>
                <Text className="button-icon">↻</Text>
                <Text>重新支付</Text>
              </Button>
              <Button className="refresh-button" onClick={() => checkPaymentStatus(orderInfo.id)}>
                <Text className="button-icon">🗘</Text>
                <Text>刷新状态</Text>
              </Button>
            </View>
          </View>
        ) : (
          <View className="loading">加载中...</View>
        )}
        <Notify id="notify" />
      </View>
    );
  };
  
  return (
    <View className="container">
      {!payUrl ? renderOrderInfo() : renderPayment()}
    </View>
  );
}
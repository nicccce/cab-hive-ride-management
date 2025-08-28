import request from '../utils/request';

// 1. 创建支付订单
export const createPaymentOrder = async (orderId, amount, subject, userId) => {
  try {
    // 参数验证
    if (!orderId || !amount || !subject || !userId) {
      throw new Error('缺少必要参数');
    }
    
    const response = await request({
      url: '/api/payment/create',
      method: 'POST',
      data: {
        order_id: orderId,     // 订单ID
        amount: amount,        // 支付金额
        subject: subject,      // 商品标题
        user_id: userId        // 用户ID
      }
    });
    
    if (response.success) {
      // 成功获取支付链接
      return response.data.pay_url;
    } else {
      throw new Error(response.message || '创建支付订单失败');
    }
  } catch (error) {
    console.error('创建支付订单失败:', error);
    throw error;
  }
};

// 4. 查询支付状态
export const queryPaymentStatus = async (orderId) => {
  try {
    if (!orderId) {
      throw new Error('缺少订单ID');
    }
    
    const response = await request({
      url: '/api/payment/query',
      method: 'POST',
      data: {
        order_id: orderId
      }
    });
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || '查询支付状态失败');
    }
  } catch (error) {
    console.error('查询支付状态失败:', error);
    throw error;
  }
};

// 定期查询支付状态（可选）
export const pollPaymentStatus = async (orderId, maxAttempts = 10) => {
  if (!orderId) {
    return { success: false, message: '缺少订单ID' };
  }
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const result = await queryPaymentStatus(orderId);
      if (result && result.trade_status === 'TRADE_SUCCESS') {
        return { success: true, data: result };
      }
      // 等待一段时间后再次查询
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('查询支付状态出错:', error);
      // 如果是网络错误，继续重试
      if (error.message && error.message.includes('网络')) {
        continue;
      }
      // 其他错误则返回失败
      return { success: false, message: error.message || '查询支付状态失败' };
    }
  }
  return { success: false, message: '查询超时' };
};
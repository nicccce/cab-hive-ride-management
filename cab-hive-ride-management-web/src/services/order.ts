import request from '../utils/request';
import { ApiResponse, Order, OrderListResponse, OrderListParams } from '../types';

export const orderService = {
  // 获取所有订单列表（管理员）
  getOrderList: (params: OrderListParams): Promise<ApiResponse<OrderListResponse>> => {
    return request.get('/orders/admin', { params });
  },

  // 获取订单详情
  getOrderDetail: (orderId: number): Promise<ApiResponse<Order>> => {
    return request.get(`/orders/${orderId}`);
  },
  
  // 检查订单超时情况
  checkOrderTimeout: (): Promise<ApiResponse<null>> => {
    return request.post('/admin/orders/check-timeout');
  },
  
  // 处理预约订单
  processReserveOrders: (): Promise<ApiResponse<null>> => {
    return request.post('/rides/orders/process-reserve');
  },
};
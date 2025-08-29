import request from '../utils/request'
import { API_ENDPOINTS } from '../config/api'

// 订单状态枚举
export const OrderStatus = {
  Reserved: 'reserved',            // 预约中
  WaitingForDriver: 'waiting_for_driver',  // 等待司机接单
  WaitingForPickup: 'waiting_for_pickup',  // 等待司机到达起点
  DriverArrived: 'driver_arrived',      // 等待司机接客
  InProgress: 'in_progress',         // 在路上
  WaitingForPayment: 'waiting_for_payment', // 结束待付款
  Completed: 'completed',           // 已完结
  Cancelled: 'cancelled'            // 已取消
}

// 创建立即出发订单
export const createImmediateOrder = async (params) => {
  return await request({
    url: API_ENDPOINTS.ORDER_CREATE,
    method: 'POST',
    data: params
  })
}

// 创建预约订单
export const createReserveOrder = async (params) => {
  return await request({
    url: API_ENDPOINTS.ORDER_RESERVE,
    method: 'POST',
    data: params
  })
}

// 获取订单详情
export const getOrderDetail = async (orderId) => {
  return await request({
    url: `${API_ENDPOINTS.ORDER_DETAIL}/${orderId}`,
    method: 'GET'
  })
}

// 获取用户未完成订单
export const getUnfinishedOrder = async () => {
  return await request({
    url: API_ENDPOINTS.ORDER_UNFINISHED,
    method: 'GET'
  })
}

// 获取司机未完成订单
export const getDriverUnfinishedOrder = async () => {
  return await request({
    url: API_ENDPOINTS.ORDER_DRIVER_UNFINISHED,
    method: 'GET'
  })
}

// 取消订单
export const cancelOrder = async (orderId) => {
  return await request({
    url: API_ENDPOINTS.ORDER_CANCEL.replace('{id}', orderId),
    method: 'DELETE'
  })
}
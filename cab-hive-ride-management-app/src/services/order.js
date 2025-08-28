import request from '../utils/request'
import { API_ENDPOINTS } from '../config/api'

// 创建立即出发订单
export const createImmediateOrder = async (params) => {
  return await request({
    url: API_ENDPOINTS.ORDER_CREATE,
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
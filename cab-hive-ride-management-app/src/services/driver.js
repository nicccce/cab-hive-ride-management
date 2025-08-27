import request from '../utils/request'
import { API_ENDPOINTS } from '../config/api'

// 获取司机信息
export const getDriverInfo = async (id) => {
  const url = id ? `${API_ENDPOINTS.DRIVERS}/${id}` : API_ENDPOINTS.DRIVERS
  return await request({
    url,
    method: 'GET'
  })
}

// 获取司机审核记录
export const getDriverPendingRecords = async (params) => {
  return await request({
    url: API_ENDPOINTS.DRIVER_SELF_PENDING,
    method: 'GET',
    data: params
  })
}

// 获取司机审核详情
export const getDriverPendingDetail = async (id) => {
  return await request({
    url: `${API_ENDPOINTS.DRIVER_PENDING}/${id}`,
    method: 'GET'
  })
}

// 更新司机信息
export const updateDriverInfo = async (params) => {
  return await request({
    url: API_ENDPOINTS.DRIVER_UPDATE,
    method: 'PUT',
    data: params
  })
}
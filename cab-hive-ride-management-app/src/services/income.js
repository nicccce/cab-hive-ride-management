import request from '../utils/request'
import { API_ENDPOINTS } from '../config/api'

// 获取司机总收入
export const getTotalIncome = async () => {
  return await request({
    url: API_ENDPOINTS.DRIVER_INCOME_TOTAL,
    method: 'GET'
  })
}

// 获取司机收入列表
export const getIncomeList = async (params) => {
  return await request({
    url: API_ENDPOINTS.DRIVER_INCOME_LIST,
    method: 'GET',
    params
  })
}

// 获取收入详情
export const getIncomeDetail = async (id) => {
  return await request({
    url: API_ENDPOINTS.DRIVER_INCOME_DETAIL.replace('{id}', id),
    method: 'GET'
  })
}
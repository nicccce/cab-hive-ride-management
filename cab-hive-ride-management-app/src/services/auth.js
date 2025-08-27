import request from '../utils/request'
import { API_ENDPOINTS } from '../config/api'

// 微信登录
export const wechatLogin = async (params) => {
  return await request({
    url: API_ENDPOINTS.WECHAT_LOGIN,
    method: 'POST',
    data: params
  })
}

// 司机注册
export const driverRegister = async (params) => {
  return await request({
    url: API_ENDPOINTS.DRIVER_REGISTER,
    method: 'POST',
    data: params
  })
}

// 刷新令牌
export const refreshToken = async (oldToken) => {
  return await request({
    url: API_ENDPOINTS.REFRESH_TOKEN,
    method: 'POST',
    header: {
      'Authorization': `Bearer ${oldToken}`
    }
  })
}
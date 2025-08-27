import Taro from '@tarojs/taro'
import { API_BASE_URL, RESPONSE_CODES } from '../config/api'

// 请求拦截器
const request = async (options) => {
  const { url, data, method = 'GET', header = {} } = options
  
  // 从缓存获取 token
  const token = Taro.getStorageSync('token')
  
  // 设置默认请求头
  const defaultHeader = {
    'Content-Type': 'application/json',
    ...header
  }
  
  // 如果有 token，添加到请求头
  if (token) {
    defaultHeader['Authorization'] = `Bearer ${token}`
  }
  
  try {
    const res = await Taro.request({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      header: defaultHeader
    })
    
    // 处理响应
    const { statusCode, data: responseData } = res
    
    if (statusCode === 200) {
      if (responseData.code === RESPONSE_CODES.SUCCESS) {
        return {
          success: true,
          data: responseData.data,
          message: responseData.msg
        }
      } else {
        // API 返回错误
        throw new Error(responseData.msg || '请求失败')
      }
    } else if (statusCode === 401) {
      // // token 过期，清除本地存储并跳转登录
      // Taro.removeStorageSync('token')
      // Taro.removeStorageSync('userInfo')
      
      Taro.showToast({
        title: '请重新登录',
        icon: 'none'
      })
      
      throw new Error('权限不足或登录已过期')
    } else {
      throw new Error(`请求失败: ${statusCode}`)
    }
  } catch (error) {
    console.error('Request error:', error)
    
    // 显示错误提示
    Taro.showToast({
      title: error.message || '网络错误',
      icon: 'none'
    })
    
    return {
      success: false,
      error: error.message || '网络错误'
    }
  }
}

export default request
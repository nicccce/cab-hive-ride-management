import Taro from '@tarojs/taro'
import { API_BASE_URL, STORAGE_KEYS } from '@/constants'
import type { ApiResponse } from '@/types'

// 请求拦截器
const interceptors = {
  request: (config: any) => {
    const token = Taro.getStorageSync(STORAGE_KEYS.TOKEN)
    if (token) {
      config.header = {
        ...config.header,
        Authorization: `Bearer ${token}`
      }
    }
    config.header = {
      'Content-Type': 'application/json',
      ...config.header
    }
    return config
  },

  response: (response: any) => {
    const { statusCode, data } = response

    // HTTP状态码检查
    if (statusCode >= 200 && statusCode < 300) {
      // API业务状态码检查
      if (data.code === 200) {
        return Promise.resolve(data)
      } else {
        // 业务错误处理
        const errorMsg = data.msg || '请求失败'
        
        // 特殊错误码处理
        if (data.code === 401) {
          // Token过期或无效，跳转到登录
          Taro.removeStorageSync(STORAGE_KEYS.TOKEN)
          Taro.removeStorageSync(STORAGE_KEYS.USER_INFO)
          Taro.navigateTo({ url: '/pages/profile/index' })
        }
        
        Taro.showToast({
          title: errorMsg,
          icon: 'none',
          duration: 2000
        })
        
        return Promise.reject(new Error(errorMsg))
      }
    } else {
      // HTTP错误处理
      const errorMsg = `网络错误 (${statusCode})`
      Taro.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      })
      return Promise.reject(new Error(errorMsg))
    }
  }
}

// 添加拦截器
Taro.addInterceptor(Taro.interceptors.request, interceptors.request)
Taro.addInterceptor(Taro.interceptors.response, interceptors.response)

// 基础请求方法
const request = async <T = any>(options: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
}): Promise<ApiResponse<T>> => {
  const { url, method = 'GET', data, header } = options

  try {
    const response = await Taro.request({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      header
    })

    return response.data as ApiResponse<T>
  } catch (error) {
    // 网络异常处理
    console.error('Request error:', error)
    Taro.showToast({
      title: '网络异常，请检查网络连接',
      icon: 'none',
      duration: 2000
    })
    throw error
  }
}

// 封装常用请求方法
export const http = {
  get: <T = any>(url: string, data?: any, header?: Record<string, string>) =>
    request<T>({ url: data ? `${url}?${new URLSearchParams(data).toString()}` : url, method: 'GET', header }),

  post: <T = any>(url: string, data?: any, header?: Record<string, string>) =>
    request<T>({ url, method: 'POST', data, header }),

  put: <T = any>(url: string, data?: any, header?: Record<string, string>) =>
    request<T>({ url, method: 'PUT', data, header }),

  delete: <T = any>(url: string, data?: any, header?: Record<string, string>) =>
    request<T>({ url, method: 'DELETE', data, header })
}

export default request
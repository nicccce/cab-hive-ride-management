import Taro from '@tarojs/taro'

const baseURL = 'https://api.cabhive.com' // 请替换为实际的API地址

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  needAuth?: boolean
}

export const request = async <T = any>(options: RequestOptions): Promise<T> => {
  const { url, method = 'GET', data, header = {}, needAuth = true } = options

  // 添加认证头
  if (needAuth) {
    try {
      const token = await Taro.getStorageSync('token')
      if (token) {
        header.Authorization = `Bearer ${token}`
      }
    } catch (storageError) {
      // 在游客模式下无法访问存储，这是正常的
      console.log('在游客模式下无法访问本地存储')
    }
  }

  // 默认请求头
  const defaultHeader = {
    'Content-Type': 'application/json',
    ...header
  }

  try {
    Taro.showLoading({
      title: '加载中...',
      mask: true
    })

    const response = await Taro.request({
      url: `${baseURL}${url}`,
      method,
      data,
      header: defaultHeader
    })

    Taro.hideLoading()

    // 处理HTTP错误
    if (response.statusCode !== 200) {
      throw new Error(`HTTP ${response.statusCode}`)
    }

    const result = response.data as T

    // 处理业务错误
    if ((result as any).code !== 0) {
      const errorMessage = (result as any).message || '请求失败'
      Taro.showToast({
        title: errorMessage,
        icon: 'error',
        duration: 2000
      })
    }

    return result
  } catch (error) {
    Taro.hideLoading()
    
    console.error('API请求失败:', error)
    
    let errorMessage = '网络连接失败，请检查网络设置'
    
    if (error instanceof Error) {
      if (error.message.includes('HTTP 401')) {
        errorMessage = '登录已过期，请重新登录'
        // 清除本地存储的用户信息
        await Taro.removeStorageSync('token')
        await Taro.removeStorageSync('userInfo')
        // 跳转到登录页
        Taro.navigateTo({
          url: '/pages/login/index'
        })
      } else if (error.message.includes('HTTP')) {
        errorMessage = '服务器响应错误'
      }
    }

    Taro.showToast({
      title: errorMessage,
      icon: 'error',
      duration: 2000
    })

    throw error
  }
}

// GET请求
export const get = <T = any>(url: string, params?: any, needAuth = true): Promise<T> => {
  const queryString = params ? 
    '?' + Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join('&') : ''
  
  return request<T>({
    url: url + queryString,
    method: 'GET',
    needAuth
  })
}

// POST请求
export const post = <T = any>(url: string, data?: any, needAuth = true): Promise<T> => {
  return request<T>({
    url,
    method: 'POST',
    data,
    needAuth
  })
}

// PUT请求
export const put = <T = any>(url: string, data?: any, needAuth = true): Promise<T> => {
  return request<T>({
    url,
    method: 'PUT',
    data,
    needAuth
  })
}

// DELETE请求
export const del = <T = any>(url: string, needAuth = true): Promise<T> => {
  return request<T>({
    url,
    method: 'DELETE',
    needAuth
  })
}
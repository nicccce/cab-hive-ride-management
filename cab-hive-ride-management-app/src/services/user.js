import Taro from '@tarojs/taro'
import request from '../utils/request'
import { API_BASE_URL, API_ENDPOINTS } from '../config/api'

// 获取当前用户信息
export const getUserProfile = async () => {
  return await request({
    url: API_ENDPOINTS.USER_PROFILE,
    method: 'GET'
  })
}

// 更新用户信息
export const updateUserProfile = async (params) => {
  return await request({
    url: API_ENDPOINTS.USER_PROFILE,
    method: 'PUT',
    data: params
  })
}

// 重置用户信息
export const resetUserProfile = async () => {
  return await request({
    url: API_ENDPOINTS.USER_PROFILE_RESET,
    method: 'PUT'
  })
}

// 上传图片
export const uploadImage = async (file) => {
  try {
    // 获取token并确保只在token存在时添加Authorization头
    const token = Taro.getStorageSync('token');
    const header = {};
    
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }
    
    const res = await Taro.uploadFile({
      url: `${API_BASE_URL}${API_ENDPOINTS.IMAGE_UPLOAD}`,
      filePath: file.path || file,
      name: 'image',
      header
    })
    
    // 解析响应
    const data = JSON.parse(res.data)
    
    // 检查响应状态
    if (data.code === 200) {
      return {
        success: true,
        data: data.data,
        message: data.msg
      }
    } else {
      return {
        success: false,
        error: data.msg || '上传失败'
      }
    }
  } catch (error) {
    console.error('Upload image failed:', error)
    return {
      success: false,
      error: error.message || '网络错误'
    }
  }
}
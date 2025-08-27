import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import { getUserProfile } from '../services/user'
import { refreshToken } from '../services/auth'
import { USER_ROLES } from '../config/api'

const useAuth = () => {
  const [userInfo, setUserInfo] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  // 刷新token
  const refreshAuthToken = async () => {
    try {
      const oldToken = Taro.getStorageSync('token')
      if (!oldToken) {
        throw new Error('No token found')
      }

      const result = await refreshToken(oldToken)
      if (result.success) {
        // 更新token到本地存储
        Taro.setStorageSync('token', result.data.token)
        return result.data.token
      } else {
        throw new Error(result.error || 'Token refresh failed')
      }
    } catch (error) {
      console.error('Refresh token failed:', error)
      // 刷新失败，清除本地存储
      Taro.removeStorageSync('token')
      Taro.removeStorageSync('userInfo')
      setIsLoggedIn(false)
      setUserInfo(null)
      throw error
    }
  }

  // 检查登录状态
  const checkLoginStatus = async () => {
    try {
      const token = Taro.getStorageSync('token')
      const cachedUserInfo = Taro.getStorageSync('userInfo')
      
      // 如果有缓存的用户信息和token，先设置为已登录状态
      if (cachedUserInfo && token) {
        setUserInfo(cachedUserInfo)
        setIsLoggedIn(true)
      }
      
      if (!token) {
        setLoading(false)
        return
      }
      
      await refreshInfo()
    } catch (error) {
      console.error('Check login status failed:', error)
      Taro.removeStorageSync('token')
      Taro.removeStorageSync('userInfo')
      setIsLoggedIn(false)
      setUserInfo(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshInfo = async() => {
      try {
        await refreshAuthToken()
        const result = await getUserProfile()
        if (result.success) {
          setUserInfo(result.data)
          setIsLoggedIn(true)
          // 同步到本地存储
          Taro.setStorageSync('userInfo', result.data)
        } else {
          // token 无效，清除本地存储
          Taro.removeStorageSync('token')
          Taro.removeStorageSync('userInfo')
          setIsLoggedIn(false)
          setUserInfo(null)
        }
      } catch (error) {
        console.error('Refresh info failed:', error)
        Taro.removeStorageSync('token')
        Taro.removeStorageSync('userInfo')
        setIsLoggedIn(false)
        setUserInfo(null)
      }
  }

  // 登出
  const logout = () => {
    Taro.removeStorageSync('token')
    Taro.removeStorageSync('refreshToken')
    Taro.removeStorageSync('userInfo')
    setUserInfo(null)
    setIsLoggedIn(false)
  }

  // 更新用户信息
  const updateUserInfo = (newUserInfo) => {
    setUserInfo(newUserInfo)
    Taro.setStorageSync('userInfo', newUserInfo)
  }

  // 判断是否为司机
  const isDriver = userInfo?.role_id === USER_ROLES.DRIVER

  // 判断是否被封禁
  const isBanned = userInfo?.status === 'banned'

  useEffect(() => {
    // 先从本地存储获取用户信息
    const cachedUserInfo = Taro.getStorageSync('userInfo')
    const token = Taro.getStorageSync('token')
    
    if (cachedUserInfo && token) {
      setUserInfo(cachedUserInfo)
      setIsLoggedIn(true)
    }
    
    // 然后检查最新的登录状态
    checkLoginStatus()
  }, [])

  return {
    userInfo,
    isLoggedIn,
    loading,
    isDriver,
    isBanned,
    logout,
    updateUserInfo,
    checkLoginStatus,
    refreshInfo
  }
}

export default useAuth
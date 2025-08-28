import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Taro from '@tarojs/taro'
import { login, getUserInfo, updateUserInfo } from '@/api/user'
import type { UserInfo } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null)
  const token = ref<string>('')
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)
  const isDriver = computed(() => userInfo.value?.roleId === 2)
  const isBanned = computed(() => userInfo.value?.status === 0)

  // 登录
  const loginAction = async (phone: string, code: string) => {
    try {
      const response = await login(phone, code)
      if (response.code === 0) {
        token.value = response.data.token
        userInfo.value = response.data.userInfo
        
        // 保存到本地存储
        await Taro.setStorageSync('token', token.value)
        await Taro.setStorageSync('userInfo', userInfo.value)
        
        return { success: true }
      } else {
        return { success: false, message: response.message }
      }
    } catch (error) {
      return { success: false, message: '登录失败，请重试' }
    }
  }

  // 获取用户信息
  const fetchUserInfo = async () => {
    try {
      const response = await getUserInfo()
      if (response.code === 0) {
        userInfo.value = response.data
        await Taro.setStorageSync('userInfo', userInfo.value)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
    }
  }

  // 更新用户信息
  const updateUserInfoAction = async (data: Partial<UserInfo>) => {
    try {
      const response = await updateUserInfo(data)
      if (response.code === 0) {
        userInfo.value = { ...userInfo.value!, ...data }
        await Taro.setStorageSync('userInfo', userInfo.value)
        return { success: true }
      } else {
        return { success: false, message: response.message }
      }
    } catch (error) {
      return { success: false, message: '更新失败，请重试' }
    }
  }

  // 退出登录
  const logout = async () => {
    token.value = ''
    userInfo.value = null
    await Taro.removeStorageSync('token')
    await Taro.removeStorageSync('userInfo')
  }

  // 初始化用户数据
  const initUserData = async () => {
    try {
      // 在游客模式下，Taro.getStorageSync可能会失败，所以我们需要捕获异常
      try {
        const savedToken = await Taro.getStorageSync('token')
        const savedUserInfo = await Taro.getStorageSync('userInfo')
        
        if (savedToken && savedUserInfo) {
          token.value = savedToken
          userInfo.value = savedUserInfo
        }
      } catch (storageError) {
        // 在游客模式下无法访问存储，这是正常的
        console.log('在游客模式下无法访问本地存储，使用默认值')
      }
    } catch (error) {
      console.error('初始化用户数据失败:', error)
    }
  }

  return {
    userInfo,
    token,
    isLoggedIn,
    isDriver,
    isBanned,
    loginAction,
    fetchUserInfo,
    updateUserInfoAction,
    logout,
    initUserData
  }
})
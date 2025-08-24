import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import Taro from '@tarojs/taro'
import { userApi, authApi } from '@/services/api'
import { STORAGE_KEYS } from '@/constants'
import { updateTabBarForRole } from '@/utils/tabbar'
import type { UserProfile, LoginRequest, UpdateProfileRequest } from '@/types'

interface UserState {
  userInfo: UserProfile | null
  isLoggedIn: boolean
  loading: boolean
  error: string | null
}

const initialState: UserState = {
  userInfo: null,
  isLoggedIn: false,
  loading: false,
  error: null
}

// 微信登录
export const wechatLogin = createAsyncThunk(
  'user/wechatLogin',
  async (loginData: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.wechatLogin(loginData)
      
      // 保存token和用户信息
      Taro.setStorageSync(STORAGE_KEYS.TOKEN, response.data.token)
      
      const userInfo = {
        id: parseInt(response.data.user_id),
        role_id: response.data.role === 'driver' ? 2 : 1,
        nick_name: response.data.user_info.nickname,
        avatar_url: response.data.user_info.avatar,
        open_id: '', // 从实际响应中获取
        phone: response.data.user_info.phone
      }
      
      Taro.setStorageSync(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo))
      
      // 更新TabBar
      updateTabBarForRole(userInfo.role_id)
      
      return userInfo
    } catch (error: any) {
      return rejectWithValue(error.message || '登录失败')
    }
  }
)

// 获取用户信息
export const getUserProfile = createAsyncThunk(
  'user/getUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userApi.getProfile()
      
      // 更新存储的用户信息
      Taro.setStorageSync(STORAGE_KEYS.USER_INFO, JSON.stringify(response.data))
      
      // 更新TabBar
      updateTabBarForRole(response.data.role_id, response.data.is_banned)
      
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || '获取用户信息失败')
    }
  }
)

// 更新用户信息
export const updateUserProfile = createAsyncThunk(
  'user/updateUserProfile',
  async (updateData: UpdateProfileRequest, { rejectWithValue, dispatch }) => {
    try {
      await userApi.updateProfile(updateData)
      
      // 重新获取用户信息
      dispatch(getUserProfile())
      
      Taro.showToast({
        title: '更新成功',
        icon: 'success'
      })
      
      return updateData
    } catch (error: any) {
      return rejectWithValue(error.message || '更新失败')
    }
  }
)

// 退出登录
export const logout = createAsyncThunk(
  'user/logout',
  async () => {
    // 清除存储的用户信息
    Taro.removeStorageSync(STORAGE_KEYS.TOKEN)
    Taro.removeStorageSync(STORAGE_KEYS.USER_INFO)
    
    // 重置TabBar
    updateTabBarForRole(1)
    
    return null
  }
)

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setUserInfo: (state, action: PayloadAction<UserProfile>) => {
      state.userInfo = action.payload
      state.isLoggedIn = true
    },
    initUserFromStorage: (state) => {
      try {
        const userInfoStr = Taro.getStorageSync(STORAGE_KEYS.USER_INFO)
        const token = Taro.getStorageSync(STORAGE_KEYS.TOKEN)
        
        if (userInfoStr && token) {
          state.userInfo = JSON.parse(userInfoStr)
          state.isLoggedIn = true
        }
      } catch (error) {
        console.error('初始化用户信息失败:', error)
      }
    }
  },
  extraReducers: (builder) => {
    // 微信登录
    builder
      .addCase(wechatLogin.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(wechatLogin.fulfilled, (state, action) => {
        state.loading = false
        state.userInfo = action.payload
        state.isLoggedIn = true
        state.error = null
      })
      .addCase(wechatLogin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.isLoggedIn = false
      })

    // 获取用户信息
    builder
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false
        state.userInfo = action.payload
        state.isLoggedIn = true
        state.error = null
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 更新用户信息
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateUserProfile.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 退出登录
    builder
      .addCase(logout.fulfilled, (state) => {
        state.userInfo = null
        state.isLoggedIn = false
        state.loading = false
        state.error = null
      })
  }
})

export const { clearError, setUserInfo, initUserFromStorage } = userSlice.actions
export default userSlice.reducer
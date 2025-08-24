import React, { useState } from 'react'
import { View, Button } from '@tarojs/components'
import { Popup, Cell, Toast } from 'taroify'
import { useDispatch } from 'react-redux'
import Taro from '@tarojs/taro'
import { wechatLogin } from '@/store/slices/userSlice'
import type { AppDispatch } from '@/store'
import './index.scss'

interface LoginModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose, onSuccess }) => {
  const dispatch = useDispatch<AppDispatch>()
  const [loading, setLoading] = useState(false)

  const handleWechatLogin = async () => {
    try {
      setLoading(true)
      
      // 获取微信授权码
      const loginRes = await Taro.login()
      
      // 获取用户信息
      const userInfoRes = await Taro.getUserProfile({
        desc: '用于完善会员资料'
      })

      // 调用登录接口
      await dispatch(wechatLogin({
        code: loginRes.code,
        encryptedData: userInfoRes.encryptedData,
        iv: userInfoRes.iv
      })).unwrap()

      Toast.open('登录成功')
      onClose()
      onSuccess?.()
      
    } catch (error: any) {
      console.error('登录失败:', error)
      Toast.open({
        type: 'fail',
        message: error.message || '登录失败，请重试'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Popup open={open} onClose={onClose} placement="center" className="login-modal">
      <View className="login-content">
        <View className="login-header">
          <View className="login-title">登录智蜂出行</View>
          <View className="login-subtitle">使用微信账号一键登录</View>
        </View>
        
        <View className="login-body">
          <Button 
            className="login-btn"
            loading={loading}
            onClick={handleWechatLogin}
          >
            微信一键登录
          </Button>
        </View>
        
        <View className="login-footer">
          <View className="login-tips">
            登录即同意《用户协议》和《隐私政策》
          </View>
        </View>
      </View>
    </Popup>
  )
}

export default LoginModal
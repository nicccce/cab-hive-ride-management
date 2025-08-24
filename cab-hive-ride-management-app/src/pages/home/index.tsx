import React from 'react'
import { View } from '@tarojs/components'
import { useAuth } from '@/hooks/useAuth'
import './index.scss'

const HomePage: React.FC = () => {
  const { isDriver, canAccessDriverFeatures } = useAuth()

  return (
    <View className="home-page">
      <View className="page-header">
        <View className="page-title">
          {canAccessDriverFeatures ? '司机接单' : '智蜂出行'}
        </View>
        <View className="page-subtitle">
          {canAccessDriverFeatures ? '等待订单中...' : '您的贴心出行伙伴'}
        </View>
      </View>

      <View className="page-content">
        <View className="coming-soon">
          <View className="coming-soon-text">功能开发中</View>
          <View className="coming-soon-desc">
            {canAccessDriverFeatures 
              ? '司机接单功能即将上线，敬请期待！' 
              : '打车功能即将上线，敬请期待！'
            }
          </View>
        </View>
      </View>
    </View>
  )
}

export default HomePage
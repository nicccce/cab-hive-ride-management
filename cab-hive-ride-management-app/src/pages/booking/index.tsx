import React from 'react'
import { View } from '@tarojs/components'
import './index.scss'

const BookingPage: React.FC = () => {
  return (
    <View className="booking-page">
      <View className="page-header">
        <View className="page-title">智能打车</View>
        <View className="page-subtitle">快速便捷的出行服务</View>
      </View>

      <View className="page-content">
        <View className="coming-soon">
          <View className="coming-soon-text">功能开发中</View>
          <View className="coming-soon-desc">
            打车功能即将上线，敬请期待！
          </View>
        </View>
      </View>
    </View>
  )
}

export default BookingPage
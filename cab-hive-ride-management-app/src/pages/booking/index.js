import { useEffect } from 'react'
import { View, Text, Map } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

const Booking = () => {
  useEffect(() => {
    Taro.setNavigationBarTitle({
      title: '打车'
    })
  }, [])

  // 地图初始配置
  const mapConfig = {
    longitude: 120.1551,  // 杭州经度
    latitude: 30.2742,    // 杭州纬度
    scale: 16,
    showLocation: true,
    enableScroll: true,
    enableRotate: false,
    enableZoom: true,
    enable3D: false,
    showCompass: false,
    showScale: true
  }

  return (
    <View className="container">
      <View className="page-content">
        {/* 微信地图组件 */}
        <Map
          className="map-container"
          longitude={mapConfig.longitude}
          latitude={mapConfig.latitude}
          scale={mapConfig.scale}
          showLocation={mapConfig.showLocation}
          enableScroll={mapConfig.enableScroll}
          enableRotate={mapConfig.enableRotate}
          enableZoom={mapConfig.enableZoom}
          enable3D={mapConfig.enable3D}
          showCompass={mapConfig.showCompass}
          showScale={mapConfig.showScale}
        />
        
        {/* 打车功能区域 */}
        <View className="booking-section">
          <View className="booking-header">
            <Text className="booking-title">打车服务</Text>
            <Text className="booking-subtitle">快速便捷的出行体验</Text>
          </View>
          
          <View className="feature-placeholder">
            <Text className="placeholder-text">打车功能开发中...</Text>
            <Text className="placeholder-desc">即将推出实时叫车、路线规划、费用估算等功能</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default Booking
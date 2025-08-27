import { View, Text, Map } from '@tarojs/components'
import useAuth from '../../hooks/useAuth'
import './index.scss'

const DriverHome = () => {
  const { userInfo } = useAuth()
  
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
        
        <View className="welcome-section">
          <Text className="welcome-title">司机工作台</Text>
          <Text className="welcome-subtitle">欢迎回来，{userInfo?.nick_name || '司机'}</Text>
        </View>
        
        <View className="feature-placeholder">
          <Text className="placeholder-text">司机功能开发中...</Text>
          <Text className="placeholder-desc">即将推出接单、发车等功能</Text>
        </View>
      </View>
    </View>
  )
}

export default DriverHome
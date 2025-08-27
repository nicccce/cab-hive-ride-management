import { View, Text, Map } from '@tarojs/components'
import './index.scss'

const PassengerHome = () => {
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
        
      </View>
    </View>
  )
}

export default PassengerHome
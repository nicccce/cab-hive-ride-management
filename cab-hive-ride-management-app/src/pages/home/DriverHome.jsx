import { useState } from 'react'
import { View, Map } from '@tarojs/components'
import Taro from '@tarojs/taro'
import useAuth from '../../hooks/useAuth'
import { getVehicleList } from '../../services/vehicle'
import DriverOrderPanel from '../../components/DriverOrderPanel/index'
import './DriverHome.scss'

const DriverHome = () => {
  const { userInfo } = useAuth()
  const [isWorking, setIsWorking] = useState(false)
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  
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
  
  // 获取车辆列表
  const fetchVehicles = async () => {
    try {
      const result = await getVehicleList()
      if (result.success && result.data.vehicles) {
        setVehicles(result.data.vehicles)
      }
    } catch (error) {
      console.error('获取车辆列表失败:', error)
      Taro.showToast({
        title: '获取车辆信息失败',
        icon: 'error'
      })
    }
  }
  
  // 开始工作
  const startWork = () => {
    fetchVehicles()
  }
  
  // 选择车辆
  const selectVehicle = (vehicle) => {
    if (vehicle.status === 'approved') {
      setSelectedVehicle(vehicle)
      setIsWorking(true)
      
      Taro.showToast({
        title: '开始接单',
        icon: 'success'
      })
    } else {
      Taro.showToast({
        title: '请选择已审核通过的车辆',
        icon: 'none'
      })
    }
  }
  
  // 停止工作
  const stopWork = () => {
    setIsWorking(false)
    setSelectedVehicle(null)
    
    Taro.showToast({
      title: '已停止接单',
      icon: 'success'
    })
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
        
        <DriverOrderPanel
          userInfo={userInfo}
          vehicles={vehicles}
          isWorking={isWorking}
          selectedVehicle={selectedVehicle}
          onVehicleSelect={selectVehicle}
          onStartWork={startWork}
          onStopWork={stopWork}
          fetchVehicles={fetchVehicles}
        />
      </View>
    </View>
  )
}

export default DriverHome
import { useState } from 'react'
import { View, Text, Map, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import useAuth from '../../hooks/useAuth'
import { getVehicleList } from '../../services/vehicle'
import './DriverHome.scss'

const DriverHome = () => {
  const { userInfo } = useAuth()
  const [isWorking, setIsWorking] = useState(false)
  const [showVehicleModal, setShowVehicleModal] = useState(false)
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [loading, setLoading] = useState(false)
  
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
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }
  
  // 开始工作
  const startWork = () => {
    setShowVehicleModal(true)
    fetchVehicles()
  }
  
  // 选择车辆
  const selectVehicle = (vehicle) => {
    if (vehicle.status === 'approved') {
      setSelectedVehicle(vehicle)
      setShowVehicleModal(false)
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
  
  // 前往车辆管理页面
  const goToVehicleManagement = () => {
    Taro.navigateTo({
      url: '/pages/vehicle-info/index'
    })
  }
  
  // 渲染车辆选择模态框
  const renderVehicleSelectionModal = () => {
    if (!showVehicleModal) return null
    
    return (
      <View className="vehicle-selection-modal">
        <View className="vehicle-selection-content">
          <View className="vehicle-selection-header">
            <Text className="vehicle-selection-title">选择运营车辆</Text>
            <Text className="vehicle-selection-subtitle">请选择您要用于接单的车辆</Text>
          </View>
          
          <View className="vehicle-list">
            {loading ? (
              <View className="loading">加载中...</View>
            ) : vehicles.length > 0 ? (
              vehicles.map(vehicle => (
                <View
                  key={vehicle.id}
                  className={`vehicle-item ${selectedVehicle?.id === vehicle.id ? 'selected-vehicle' : ''}`}
                  onClick={() => selectVehicle(vehicle)}
                >
                  <Text className="vehicle-plate">{vehicle.plate_number}</Text>
                  <Text className="vehicle-model">{vehicle.brand} {vehicle.model}</Text>
                  <Text className={`vehicle-status ${vehicle.status === 'approved' ? 'status-approved' : vehicle.status === 'rejected' ? 'status-rejected' : 'status-pending'}`}>
                    {vehicle.status === 'approved' ? '已审核' : vehicle.status === 'rejected' ? '审核拒绝' : '审核中'}
                  </Text>
                </View>
              ))
            ) : (
              <View className="no-vehicles">
                <Text className="no-vehicles-text">暂无车辆信息</Text>
                <Text
                  className="add-vehicle-link"
                  onClick={goToVehicleManagement}
                >
                  点击添加车辆
                </Text>
              </View>
            )}
          </View>
          
          <Button 
            className="close-button"
            onClick={() => setShowVehicleModal(false)}
          >
            取消
          </Button>
        </View>
      </View>
    )
  }
  
  // 渲染底部工作状态
  const renderBottomSection = () => {
    if (isWorking && selectedVehicle) {
      return (
        <View className="working-section">
          <View className="working-header">
            <Text className="working-title">工作中</Text>
            <Text className="working-status">正在接单中...</Text>
          </View>
          
          <View className="working-vehicle">
            <View className="vehicle-info-row">
              <Text className="vehicle-info-label">当前车辆:</Text>
              <Text className="vehicle-info-value">{selectedVehicle.plate_number}</Text>
            </View>
            <View className="vehicle-info-row">
              <Text className="vehicle-info-label">车型:</Text>
              <Text className="vehicle-info-value">{selectedVehicle.brand} {selectedVehicle.model}</Text>
            </View>
          </View>
          
          <Button 
            className="stop-work-button"
            onClick={stopWork}
          >
            停止接单
          </Button>
        </View>
      )
    }
    
    return (
      <View className="bottom-section">
        <Button 
          className="start-work-button"
          onClick={startWork}
        >
          开始接单
        </Button>
      </View>
    )
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
        
        {renderBottomSection()}
        {renderVehicleSelectionModal()}
      </View>
    </View>
  )
}

export default DriverHome
import { useState, useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getVehicleList } from '../../services/vehicle'
import useAuth from '../../hooks/useAuth'
import VehicleCard from '../../components/VehicleCard'
import VehicleDetailModal from '../../components/VehicleDetailModal'
import './index.scss'

const VehicleInfo = () => {
  const { isDriver } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    Taro.setNavigationBarTitle({
      title: '车辆信息管理'
    })
    
    if (isDriver) {
      fetchVehicles()
    } else {
      setLoading(false)
    }
  }, [isDriver])

  // 获取车辆列表
  const fetchVehicles = async () => {
    try {
      const result = await getVehicleList()
      if (result.success && result.data.vehicles) {
        setVehicles(result.data.vehicles)
      }
    } catch (error) {
      console.error('Fetch vehicles failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // 添加车辆
  const handleAddVehicle = () => {
    Taro.navigateTo({
      url: '/pages/vehicle-add/index'
    })
  }

  // 编辑车辆
  const handleEditVehicle = (vehicleId) => {
    Taro.navigateTo({
      url: `/pages/vehicle-edit/index?id=${vehicleId}`
    })
  }

  // 查看车辆详情
  const handleViewDetail = (vehicle) => {
    setSelectedVehicle(vehicle)
    setShowDetailModal(true)
  }

  // 关闭详情模态框
  const handleCloseDetail = () => {
    setShowDetailModal(false)
    setSelectedVehicle(null)
  }

  // 查看审核记录
  const viewAuditRecords = () => {
    Taro.navigateTo({
      url: '/pages/audit-records/index?type=vehicle'
    })
  }

  if (loading) {
    return (
      <View className="container">
        <View className="loading">加载中...</View>
      </View>
    )
  }

  if (!isDriver) {
    return (
      <View className="container">
        <View className="no-permission">
          <Text className="no-permission-text">您还不是司机，无法访问此页面</Text>
          <Button
            className="back-btn"
            onClick={() => Taro.navigateBack()}
          >
            返回
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className="container">
      <View className="vehicle-info-page">
        <View className="page-header">
          <Text className="page-title">车辆信息管理</Text>
          <Text className="page-subtitle">管理您的车辆信息</Text>
        </View>

        <View className="action-header">
          <Button
            className="add-btn"
            onClick={handleAddVehicle}
          >
            添加车辆
          </Button>
          <Button
            className="audit-btn"
            onClick={viewAuditRecords}
          >
            审核记录
          </Button>
        </View>

        <View className="vehicle-list">
          {vehicles.length > 0 ? (
            vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onDetail={handleViewDetail}
              />
            ))
          ) : (
            <View className="empty-state">
              <Text className="empty-text">暂无车辆信息</Text>
              <Text className="empty-tip">点击上方按钮添加车辆</Text>
            </View>
          )}
        </View>
        
        <VehicleDetailModal
          vehicleId={selectedVehicle?.id}
          isOpen={showDetailModal}
          onClose={handleCloseDetail}
        />
      </View>
    </View>
  )
}

export default VehicleInfo
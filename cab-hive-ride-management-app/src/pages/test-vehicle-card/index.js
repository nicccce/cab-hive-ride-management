import { useState } from 'react'
import { View } from '@tarojs/components'
import VehicleCard from '../../components/VehicleCard'
import VehicleDetailModal from '../../components/VehicleDetailModal'
import './index.scss'

const TestVehicleCard = () => {
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = useState(null)

  // 测试车辆数据
  const testVehicle = {
    id: '1',
    plate_number: '浙A12345',
    vehicle_type: '轿车',
    brand: '大众',
    model: '帕萨特',
    color: '黑色',
    year: 2020,
    insurance_expiry: '2026-07-16T00:00:00Z',
    status: 'approved',
    comment: '车辆信息审核通过'
  }

  const handleViewDetail = (vehicle) => {
    setSelectedVehicleId(vehicle.id)
    setShowDetailModal(true)
  }

  const handleCloseDetail = () => {
    setShowDetailModal(false)
    setSelectedVehicleId(null)
  }

  return (
    <View className="container">
      <View className="test-page">
        <View className="page-header">
          <View className="page-title">VehicleCard 组件测试</View>
          <View className="page-subtitle">测试车辆信息展示组件</View>
        </View>

        <View className="test-section">
          <View className="section-title">VehicleCard 组件展示</View>
          <VehicleCard
            vehicle={testVehicle}
            onDetail={handleViewDetail}
          />
        </View>

        <View className="test-section">
          <View className="section-title">VehicleCard 组件（无详情按钮）</View>
          <VehicleCard
            vehicle={testVehicle}
            showDetailButton={false}
          />
        </View>

        <VehicleDetailModal
          vehicleId={selectedVehicleId}
          isOpen={showDetailModal}
          onClose={handleCloseDetail}
        />
      </View>
    </View>
  )
}

export default TestVehicleCard
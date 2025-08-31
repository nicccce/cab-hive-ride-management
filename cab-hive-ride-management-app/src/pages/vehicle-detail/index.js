import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getVehicleDetail } from '../../services/vehicle'
import useAuth from '../../hooks/useAuth'
import './index.scss'

const VehicleDetailPage = () => {
  const { isLoggedIn } = useAuth()
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Taro.setNavigationBarTitle({
      title: '车辆详情'
    })
    
    if (isLoggedIn) {
      fetchVehicleDetail()
    } else {
      setLoading(false)
    }
  }, [isLoggedIn])

  // 获取车辆详情
  const fetchVehicleDetail = async () => {
    try {
      // 从页面参数中获取车辆ID
      const params = Taro.getCurrentInstance().router.params
      const vehicleId = params.id
      
      if (!vehicleId) {
        Taro.showToast({
          title: '车辆ID无效',
          icon: 'none'
        })
        return
      }
      
      const result = await getVehicleDetail(vehicleId)
      if (result.code === 200 && result.data) {
        setVehicle(result.data)
      } else {
        Taro.showToast({
          title: result.msg || '获取车辆详情失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('获取车辆详情失败:', error)
      Taro.showToast({
        title: '获取车辆详情失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 根据审核状态显示不同颜色的状态标签
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'status-badge status-approved'
      case 'rejected':
        return 'status-badge status-rejected'
      default:
        return 'status-badge status-pending'
    }
  }

  // 根据审核状态显示中文标签
  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return '已通过'
      case 'rejected':
        return '已拒绝'
      default:
        return '待审核'
    }
  }

  // 格式化日期显示
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN')
  }

  if (!isLoggedIn) {
    return (
      <View className="container">
        <View className="login-prompt">
          <Text>请先登录查看车辆详情</Text>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View className="container">
        <View className="loading">加载中...</View>
      </View>
    )
  }

  if (!vehicle) {
    return (
      <View className="container">
        <View className="empty-state">
          <Text>未找到车辆信息</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="container">
      <View className="vehicle-detail-page">
        <View className="page-header">
          <Text className="page-title">车辆详情</Text>
          <Text className="page-subtitle">查看车辆详细信息</Text>
        </View>

        <View className="info-section">
          <View className="info-card">
            <View className="card-header">
              <Text className="card-title">基本信息</Text>
            </View>

            <View className="info-list">
              <View className="info-item">
                <Text className="info-label">车辆ID</Text>
                <Text className="info-value">{vehicle.id}</Text>
              </View>
              <View className="info-item">
                <Text className="info-label">车牌号码</Text>
                <Text className="info-value plate-number">{vehicle.plate_number}</Text>
              </View>
              <View className="info-item">
                <Text className="info-label">车辆状态</Text>
                <Text className={getStatusBadgeClass(vehicle.status)}>
                  {getStatusText(vehicle.status)}
                </Text>
              </View>
              <View className="info-item">
                <Text className="info-label">车辆类型</Text>
                <Text className="info-value">{vehicle.vehicle_type}</Text>
              </View>
              <View className="info-item">
                <Text className="info-label">车辆品牌</Text>
                <Text className="info-value">{vehicle.brand}</Text>
              </View>
              <View className="info-item">
                <Text className="info-label">车辆型号</Text>
                <Text className="info-value">{vehicle.model}</Text>
              </View>
              <View className="info-item">
                <Text className="info-label">车辆颜色</Text>
                <Text className="info-value">{vehicle.color}</Text>
              </View>
              <View className="info-item">
                <Text className="info-label">车辆年份</Text>
                <Text className="info-value">{vehicle.year}</Text>
              </View>
              <View className="info-item">
                <Text className="info-label">保险到期时间</Text>
                <Text className="info-value">{formatDate(vehicle.insurance_expiry)}</Text>
              </View>
              {vehicle.comment && (
                <View className="info-item">
                  <Text className="info-label">审核备注</Text>
                  <Text className="info-value comment">{vehicle.comment}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

export default VehicleDetailPage
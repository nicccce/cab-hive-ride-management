import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getDriverInfo } from '../../services/driver'
import useAuth from '../../hooks/useAuth'
import './index.scss'

const DriverDetailPage = () => {
  const { isLoggedIn } = useAuth()
  const [driverInfo, setDriverInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Taro.setNavigationBarTitle({
      title: '司机详情'
    })
    
    if (isLoggedIn) {
      fetchDriverDetail()
    } else {
      setLoading(false)
    }
  }, [isLoggedIn])

  // 获取司机详情
  const fetchDriverDetail = async () => {
    try {
      // 从页面参数中获取司机ID
      const params = Taro.getCurrentInstance().router.params
      const driverId = params.id
      
      if (!driverId) {
        Taro.showToast({
          title: '司机ID无效',
          icon: 'none'
        })
        return
      }
      
      const result = await getDriverInfo(driverId)
      if (result.code === 200 && result.data) {
        setDriverInfo(result.data)
      } else {
        Taro.showToast({
          title: result.msg || '获取司机详情失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('获取司机详情失败:', error)
      Taro.showToast({
        title: '获取司机详情失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <View className="container">
        <View className="login-prompt">
          <Text>请先登录查看司机详情</Text>
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

  if (!driverInfo) {
    return (
      <View className="container">
        <View className="empty-state">
          <Text>未找到司机信息</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="container">
      <View className="driver-detail-page">
        <View className="page-header">
          <Text className="page-title">司机详情</Text>
          <Text className="page-subtitle">查看司机详细信息</Text>
        </View>

        <View className="info-section">
          <View className="info-card">
            <View className="card-header">
              <Text className="card-title">基本信息</Text>
            </View>

            <View className="info-list">
              <View className="info-item">
                <Text className="info-label">司机ID</Text>
                <Text className="info-value">{driverInfo.id}</Text>
              </View>
              <View className="info-item">
                <Text className="info-label">姓名</Text>
                <Text className="info-value">{driverInfo.name}</Text>
              </View>
              <View className="info-item">
                <Text className="info-label">手机号</Text>
                <Text className="info-value">{driverInfo.phone}</Text>
              </View>
              <View className="info-item">
                <Text className="info-label">驾照编号</Text>
                <Text className="info-value">{driverInfo.license_number}</Text>
              </View>
              <View className="info-item">
                <Text className="info-label">审核状态</Text>
                <Text className={`status-badge status-${driverInfo.status}`}>
                  {driverInfo.status === 'approved' ? '已通过' : 
                   driverInfo.status === 'rejected' ? '已拒绝' : '待审核'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

export default DriverDetailPage
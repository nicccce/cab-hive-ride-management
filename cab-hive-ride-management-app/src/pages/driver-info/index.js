import { useState, useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getDriverInfo } from '../../services/driver'
import useAuth from '../../hooks/useAuth'
import './index.scss'

const DriverInfo = () => {
  const { isDriver } = useAuth()
  const [driverInfo, setDriverInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Taro.setNavigationBarTitle({
      title: '司机信息管理'
    })
    
    if (isDriver) {
      fetchDriverInfo()
    } else {
      setLoading(false)
    }
  }, [isDriver])

  // 获取司机信息
  const fetchDriverInfo = async () => {
    try {
      const result = await getDriverInfo()
      if (result.success) {
        setDriverInfo(result.data)
      }
    } catch (error) {
      console.error('Fetch driver info failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // 编辑司机信息
  const handleEdit = () => {
    // 跳转到编辑页面
    Taro.navigateTo({
      url: '/pages/driver-edit/index'
    })
  }

  // 查看审核记录
  const viewAuditRecords = () => {
    Taro.navigateTo({
      url: '/pages/audit-records/index?type=driver'
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
      <View className="driver-info-page">
        <View className="page-header">
          <Text className="page-title">司机信息管理</Text>
          <Text className="page-subtitle">管理您的司机资料</Text>
        </View>

        {driverInfo && (
          <View className="info-section">
            <View className="info-card">
              <View className="card-header">
                <Text className="card-title">基本信息</Text>
              </View>

              <View className="info-list">
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

            <View className="action-section">
              <Button
                className="action-btn"
                onClick={handleEdit}
              >
                编辑司机信息
              </Button>
              <Button
                className="action-btn"
                onClick={viewAuditRecords}
              >
                查看审核记录
              </Button>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

export default DriverInfo
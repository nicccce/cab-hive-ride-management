import { useState, useEffect } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getDriverPendingRecords } from '../../services/driver'
import { getVehiclePendingRecords } from '../../services/vehicle'
import useAuth from '../../hooks/useAuth'
import './index.scss'

const AuditRecords = () => {
  const { isLoggedIn, userInfo } = useAuth()
  const [activeTab, setActiveTab] = useState('driver')
  const [driverRecords, setDriverRecords] = useState([])
  const [vehicleRecords, setVehicleRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Taro.setNavigationBarTitle({
      title: '审核记录'
    })

    // 获取页面参数
    const { type = 'driver' } = Taro.getCurrentInstance().router?.params || {}
    setActiveTab(type)

    if (isLoggedIn) {
      fetchRecords()
    } else {
      setLoading(false)
    }
  }, [isLoggedIn])

  // 获取审核记录
  const fetchRecords = async () => {
    try {
      setLoading(true)
      
      // 获取司机审核记录
      const driverResult = await getDriverPendingRecords()
      if (driverResult.success && driverResult.data.drivers) {
        setDriverRecords(driverResult.data.drivers)
      }

      // 获取车辆审核记录 - 仅当用户是司机时才请求
      if (userInfo?.role_id === 2) {
        const vehicleResult = await getVehiclePendingRecords()
        if (vehicleResult.success && vehicleResult.data.vehicles) {
          setVehicleRecords(vehicleResult.data.vehicles)
        }
      }
    } catch (error) {
      console.error('Fetch audit records failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // 切换标签
  const switchTab = (tab) => {
    setActiveTab(tab)
  }

  // 查看详情
  const viewDetail = (type, id) => {
    const url = type === 'driver' 
      ? `/pages/audit-detail/index?type=driver&id=${id}`
      : `/pages/audit-detail/index?type=vehicle&id=${id}`
    
    Taro.navigateTo({ url })
  }

  // 格式化时间
  const formatTime = (timeString) => {
    if (!timeString) return '-'
    const date = new Date(timeString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  if (!isLoggedIn) {
    return (
      <View className="container">
        <View className="no-permission">
          <Text className="no-permission-text">请先登录</Text>
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

  if (loading) {
    return (
      <View className="container">
        <View className="loading">加载中...</View>
      </View>
    )
  }

  return (
    <View className="container">
      <View className="audit-records-page">
        <View className="page-header">
          <Text className="page-title">审核记录</Text>
          <Text className="page-subtitle">查看审核状态和记录</Text>
        </View>

        <View className="tab-bar">
          <View 
            className={`tab-item ${activeTab === 'driver' ? 'active' : ''}`}
            onClick={() => switchTab('driver')}
          >
            <Text className="tab-text">司机审核</Text>
          </View>
          <View 
            className={`tab-item ${activeTab === 'vehicle' ? 'active' : ''}`}
            onClick={() => switchTab('vehicle')}
          >
            <Text className="tab-text">车辆审核</Text>
          </View>
        </View>

        <View className="records-content">
          {activeTab === 'driver' && (
            <View className="records-list">
              {driverRecords.length > 0 ? (
                driverRecords.map((record) => (
                  <View key={record.id} className="record-card">
                    <View className="record-header">
                      <Text className="record-title">司机认证申请</Text>
                      <Text className={`status-badge status-${record.status}`}>
                        {record.status === 'approved' ? '已通过' : 
                         record.status === 'rejected' ? '已拒绝' : '待审核'}
                      </Text>
                    </View>

                    <View className="record-info">
                      <View className="info-row">
                        <Text className="info-label">姓名</Text>
                        <Text className="info-value">{record.name}</Text>
                      </View>
                      <View className="info-row">
                        <Text className="info-label">驾照编号</Text>
                        <Text className="info-value">{record.license_number}</Text>
                      </View>
                      <View className="info-row">
                        <Text className="info-label">提交时间</Text>
                        <Text className="info-value">{formatTime(record.submit_time)}</Text>
                      </View>
                      {record.review_time && (
                        <View className="info-row">
                          <Text className="info-label">审核时间</Text>
                          <Text className="info-value">{formatTime(record.review_time)}</Text>
                        </View>
                      )}
                    </View>

                    <View className="record-actions">
                      <Button
                        className="detail-btn"
                        size="mini"
                        onClick={() => viewDetail('driver', record.id)}
                      >
                        查看详情
                      </Button>
                    </View>
                  </View>
                ))
              ) : (
                <View className="empty-state">
                  <Text className="empty-text">暂无司机审核记录</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'vehicle' && (
            <View className="records-list">
              {vehicleRecords.length > 0 ? (
                vehicleRecords.map((record) => (
                  <View key={record.id} className="record-card">
                    <View className="record-header">
                      <Text className="record-title">车辆认证申请</Text>
                      <Text className={`status-badge status-${record.status}`}>
                        {record.status === 'approved' ? '已通过' : 
                         record.status === 'rejected' ? '已拒绝' : '待审核'}
                      </Text>
                    </View>

                    <View className="record-info">
                      <View className="info-row">
                        <Text className="info-label">车牌号</Text>
                        <Text className="info-value">{record.plate_number}</Text>
                      </View>
                      <View className="info-row">
                        <Text className="info-label">车型</Text>
                        <Text className="info-value">{record.brand} {record.model_name}</Text>
                      </View>
                      <View className="info-row">
                        <Text className="info-label">提交时间</Text>
                        <Text className="info-value">{formatTime(record.submit_time)}</Text>
                      </View>
                      {record.review_time && (
                        <View className="info-row">
                          <Text className="info-label">审核时间</Text>
                          <Text className="info-value">{formatTime(record.review_time)}</Text>
                        </View>
                      )}
                    </View>

                    <View className="record-actions">
                      <Button
                        className="detail-btn"
                        size="mini"
                        onClick={() => viewDetail('vehicle', record.id)}
                      >
                        查看详情
                      </Button>
                    </View>
                  </View>
                ))
              ) : (
                <View className="empty-state">
                  <Text className="empty-text">暂无车辆审核记录</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

export default AuditRecords
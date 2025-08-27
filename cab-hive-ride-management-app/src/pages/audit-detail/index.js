import { useState, useEffect } from 'react'
import { View, Text, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getDriverPendingDetail } from '../../services/driver'
import { getVehiclePendingDetail } from '../../services/vehicle'
import useAuth from '../../hooks/useAuth'
import './index.scss'

const AuditDetail = () => {
  const { isLoggedIn } = useAuth()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Taro.setNavigationBarTitle({
      title: '审核详情'
    })

    // 延迟检查登录状态，给useAuth钩子一些时间来初始化
    const timer = setTimeout(() => {
      if (!isLoggedIn) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none'
        })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isLoggedIn])

  useEffect(() => {
    if (isLoggedIn) {
      fetchDetail()
    }
  }, [isLoggedIn])

  // 获取审核详情
  const fetchDetail = async () => {
    try {
      setLoading(true)
      const router = Taro.getCurrentInstance().router
      const { type, id } = router?.params || {}

      if (!type || !id) {
        throw new Error('缺少必要参数')
      }

      let result
      if (type === 'driver') {
        result = await getDriverPendingDetail(id)
      } else if (type === 'vehicle') {
        result = await getVehiclePendingDetail(id)
      } else {
        throw new Error('不支持的审核类型')
      }

      if (result.success) {
        setDetail(result.data)
      } else {
        throw new Error(result.msg || '获取详情失败')
      }
    } catch (err) {
      console.error('获取审核详情失败:', err)
      setError(err.message || '获取审核详情失败')
      Taro.showToast({
        title: err.message || '获取审核详情失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 格式化时间
  const formatTime = (timeString) => {
    if (!timeString) return '-'
    const date = new Date(timeString)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  // 获取状态文本
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '待审核'
      case 'approved': return '已通过'
      case 'rejected': return '已拒绝'
      default: return status
    }
  }

  // 获取状态类名
  const getStatusClassName = (status) => {
    switch (status) {
      case 'pending': return 'status-pending'
      case 'approved': return 'status-approved'
      case 'rejected': return 'status-rejected'
      default: return ''
    }
  }

  if (!isLoggedIn) {
    return (
      <View className="container">
        <View className="no-permission">
          <Text className="no-permission-text">请先登录</Text>
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

  if (error) {
    return (
      <View className="container">
        <View className="error">
          <Text className="error-text">{error}</Text>
          <Button className="retry-btn" onClick={fetchDetail}>重新加载</Button>
        </View>
      </View>
    )
  }

  if (!detail) {
    return (
      <View className="container">
        <View className="empty-state">
          <Text className="empty-text">暂无数据</Text>
        </View>
      </View>
    )
  }

  // 司机审核详情
  if (detail.license_number) {
    return (
      <View className="container">
        <View className="audit-detail-page">
          <View className="page-header">
            <Text className="page-title">司机认证详情</Text>
          </View>

          <View className="detail-card">
            <View className="card-header">
              <Text className="card-title">基本信息</Text>
              <Text className={`status-badge ${getStatusClassName(detail.status)}`}>
                {getStatusText(detail.status)}
              </Text>
            </View>

            <View className="card-content">
              <View className="info-row">
                <Text className="info-label">姓名</Text>
                <Text className="info-value">{detail.name}</Text>
              </View>
              <View className="info-row">
                <Text className="info-label">手机号</Text>
                <Text className="info-value">{detail.phone}</Text>
              </View>
              <View className="info-row">
                <Text className="info-label">驾照编号</Text>
                <Text className="info-value">{detail.license_number}</Text>
              </View>
              <View className="info-row">
                <Text className="info-label">提交时间</Text>
                <Text className="info-value">{formatTime(detail.submit_time)}</Text>
              </View>
              {detail.review_time && (
                <View className="info-row">
                  <Text className="info-label">审核时间</Text>
                  <Text className="info-value">{formatTime(detail.review_time)}</Text>
                </View>
              )}
              {detail.comment && (
                <View className="info-row">
                  <Text className="info-label">审核意见</Text>
                  <Text className="info-value comment">{detail.comment}</Text>
                </View>
              )}
            </View>
          </View>

          {detail.license_image_url && (
            <View className="detail-card">
              <View className="card-header">
                <Text className="card-title">驾照照片</Text>
              </View>
              <View className="card-content">
                <View className="image-container">
                  <Image
                    className="license-image"
                    src={detail.license_image_url}
                    mode="widthFix"
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    )
  }

  // 车辆审核详情
  if (detail.plate_number) {
    return (
      <View className="container">
        <View className="audit-detail-page">
          <View className="page-header">
            <Text className="page-title">车辆认证详情</Text>
          </View>

          <View className="detail-card">
            <View className="card-header">
              <Text className="card-title">基本信息</Text>
              <Text className={`status-badge ${getStatusClassName(detail.status)}`}>
                {getStatusText(detail.status)}
              </Text>
            </View>

            <View className="card-content">
              <View className="info-row">
                <Text className="info-label">车牌号</Text>
                <Text className="info-value">{detail.plate_number}</Text>
              </View>
              <View className="info-row">
                <Text className="info-label">品牌型号</Text>
                <Text className="info-value">{detail.brand} {detail.model_name}</Text>
              </View>
              <View className="info-row">
                <Text className="info-label">车辆类型</Text>
                <Text className="info-value">{detail.vehicle_type}</Text>
              </View>
              <View className="info-row">
                <Text className="info-label">颜色</Text>
                <Text className="info-value">{detail.color}</Text>
              </View>
              <View className="info-row">
                <Text className="info-label">年份</Text>
                <Text className="info-value">{detail.year}</Text>
              </View>
              <View className="info-row">
                <Text className="info-label">提交时间</Text>
                <Text className="info-value">{formatTime(detail.submit_time)}</Text>
              </View>
              {detail.review_time && (
                <View className="info-row">
                  <Text className="info-label">审核时间</Text>
                  <Text className="info-value">{formatTime(detail.review_time)}</Text>
                </View>
              )}
              {detail.comment && (
                <View className="info-row">
                  <Text className="info-label">审核意见</Text>
                  <Text className="info-value comment">{detail.comment}</Text>
                </View>
              )}
            </View>
          </View>

          {detail.registration_image && (
            <View className="detail-card">
              <View className="card-header">
                <Text className="card-title">行驶证照片</Text>
              </View>
              <View className="card-content">
                <View className="image-container">
                  <Image
                    className="registration-image"
                    src={detail.registration_image}
                    mode="widthFix"
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    )
  }

  return (
    <View className="container">
      <View className="empty-state">
        <Text className="empty-text">暂无数据</Text>
      </View>
    </View>
  )
}

export default AuditDetail
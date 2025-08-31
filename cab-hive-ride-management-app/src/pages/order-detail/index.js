import { useState, useEffect } from 'react'
import { View, Text, Map, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Phone, CommentOutlined } from '@taroify/icons'
import { getOrderDetailById, submitFeedback } from '../../services/order'
import useAuth from '../../hooks/useAuth'
import Feedback from '../../components/Feedback'
import './index.scss'

const OrderDetailPage = () => {
  const { isLoggedIn, checkLoginStatus } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [mapConfig, setMapConfig] = useState({
    longitude: 120.1551,
    latitude: 30.2742,
    scale: 12,
    showLocation: true,
    enableScroll: true,
    enableRotate: false,
    enableZoom: true,
    enable3D: false,
    showCompass: false,
    showScale: true,
  })
  const [markers, setMarkers] = useState([])
  const [polyline, setPolyline] = useState([])

  // 订单状态映射
  const statusMap = {
    reserved: '预约中',
    waiting_for_driver: '等待司机接单',
    waiting_for_pickup: '等待司机到达起点',
    driver_arrived: '等待司机接客',
    in_progress: '进行中',
    waiting_for_payment: '待支付',
    completed: '已完成',
    cancelled: '已取消'
  }

  // 页面加载时检查登录状态并获取订单详情
  useEffect(() => {
    checkLoginStatus()
    if (isLoggedIn) {
      loadOrderDetail()
    }
  }, [isLoggedIn])

  // 获取订单详情
  const loadOrderDetail = async () => {
    setLoading(true)
    try {
      // 从页面参数中获取订单ID
      const params = Taro.getCurrentInstance().router.params
      const orderId = params.id
      
      if (!orderId) {
        Taro.showToast({
          title: '订单ID无效',
          icon: 'none'
        })
        return
      }
      
      const result = await getOrderDetailById(orderId)
      
      if (result.code === 200) {
        setOrder(result.data)
        // 更新地图配置
        updateMapConfig(result.data)
      } else {
        Taro.showToast({
          title: result.msg || '获取订单详情失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('获取订单详情失败:', error)
      Taro.showToast({
        title: '获取订单详情失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 更新地图配置
  const updateMapConfig = (orderData) => {
    if (!orderData || !orderData.route_points || orderData.route_points.length === 0) {
      return
    }

    // 设置地图中心点
    const centerPoint = orderData.route_points[Math.floor(orderData.route_points.length / 2)]
    setMapConfig({
      ...mapConfig,
      longitude: centerPoint.longitude,
      latitude: centerPoint.latitude,
      scale: 14
    })

    // 设置起点和终点标记
    const newMarkers = []
    if (orderData.start_location) {
      newMarkers.push({
        id: 0,
        latitude: orderData.start_location.latitude,
        longitude: orderData.start_location.longitude,
        title: '起点',
        width: 30,
        height: 30,
        callout: {
          content: orderData.start_location.name || '起点',
          color: '#000',
          fontSize: 14,
          borderRadius: 4,
          padding: 8,
          display: 'ALWAYS',
        },
      })
    }
    
    if (orderData.end_location) {
      newMarkers.push({
        id: 1,
        latitude: orderData.end_location.latitude,
        longitude: orderData.end_location.longitude,
        title: '终点',
        width: 30,
        height: 30,
        callout: {
          content: orderData.end_location.name || '终点',
          color: '#000',
          fontSize: 14,
          borderRadius: 4,
          padding: 8,
          display: 'ALWAYS',
        },
      })
    }
    
    setMarkers(newMarkers)

    // 设置路线
    const newPolyline = [{
      points: orderData.route_points,
      color: '#FF0000',
      width: 6,
      dottedLine: false,
      arrowLine: true,
    }]
    
    setPolyline(newPolyline)
  }

  // 格式化时间
  const formatTime = (timeString) => {
    if (!timeString) return ''
    const date = new Date(timeString)
    return date.toLocaleString('zh-CN')
  }

  // 格式化距离
  const formatDistance = (meters) => {
    if (!meters) return '未知距离'
    if (meters < 1000) return `${Math.round(meters)}米`
    return `${(meters / 1000).toFixed(1)}公里`
  }

  // 处理反馈按钮点击
  const handleFeedback = () => {
    setShowFeedback(true)
  }

  // 处理反馈提交
  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      const params = {
        order_id: order.id,
        type: feedbackData.type,
        level: feedbackData.level,
        title: feedbackData.title,
        content: feedbackData.content
      }
      
      const result = await submitFeedback(params)
      
      if (result.code === 200) {
        Taro.showToast({
          title: '反馈提交成功',
          icon: 'success'
        })
        setShowFeedback(false)
        // 重新加载订单详情以更新反馈状态
        loadOrderDetail()
      } else {
        Taro.showToast({
          title: result.msg || '反馈提交失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('提交反馈失败:', error)
      Taro.showToast({
        title: '提交反馈失败',
        icon: 'none'
      })
    }
  }

  // 如果用户未登录，显示提示
  if (!isLoggedIn) {
    return (
      <View className="container">
        <View className="login-prompt">
          <Text>请先登录查看订单详情</Text>
        </View>
      </View>
    )
  }

  // 如果正在加载，显示加载提示
  if (loading) {
    return (
      <View className="container">
        <View className="loading">
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  // 如果没有订单数据，显示空状态
  if (!order) {
    return (
      <View className="container">
        <View className="empty-state">
          <Text>未找到订单信息</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="container">
      <ScrollView className="page-content" scrollY>
        {/* 订单基本信息 */}
        <View className="order-info-section">
          <View className="order-header">
            <Text className="order-id">订单号: {order.id}</Text>
            <Text className={`order-status ${order.status}`}>
              {statusMap[order.status] || order.status}
            </Text>
          </View>
          
          <View className="order-details">
            <View className="detail-row">
              <Text className="detail-label">下单时间:</Text>
              <Text className="detail-value">{formatTime(order.start_time)}</Text>
            </View>
            {order.end_time && (
              <View className="detail-row">
                <Text className="detail-label">完成时间:</Text>
                <Text className="detail-value">{formatTime(order.end_time)}</Text>
              </View>
            )}
            <View className="detail-row">
              <Text className="detail-label">起点:</Text>
              <Text className="detail-value">{order.start_location?.name || '未知'}</Text>
            </View>
            <View className="detail-row">
              <Text className="detail-label">终点:</Text>
              <Text className="detail-value">{order.end_location?.name || '未知'}</Text>
            </View>
            <View className="detail-row">
              <Text className="detail-label">距离:</Text>
              <Text className="detail-value">{formatDistance(order.distance)}</Text>
            </View>
            <View className="detail-row">
              <Text className="detail-label">费用:</Text>
              <Text className="detail-value">¥{order.fare || 0}</Text>
            </View>
            {order.tolls > 0 && (
              <View className="detail-row">
                <Text className="detail-label">过路费:</Text>
                <Text className="detail-value">¥{order.tolls}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 地图展示路线 */}
        <View className="map-section">
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
            markers={markers}
            polyline={polyline}
          />
        </View>

        {/* 司机信息（如果有） */}
        {order.driver_open_id && (
          <View className="driver-info-section">
            <View className="section-title">司机信息</View>
            <View className="driver-info">
              <View className="driver-detail">
                <Text className="detail-label">司机ID:</Text>
                <Text className="detail-value">{order.driver_open_id}</Text>
              </View>
              <View className="driver-actions">
                <View
                  className="action-button"
                  onClick={() => {
                    Taro.navigateTo({
                      url: `/pages/driver-detail/index?id=${order.driver_open_id}`
                    })
                  }}
                >
                  <Text>查看详情</Text>
                </View>
                <View className="action-button">
                  <Phone size="16" color="#1989fa" />
                  <Text>联系司机</Text>
                </View>
                <View className="action-button">
                  <CommentOutlined size="16" color="#1989fa" />
                  <Text>发送消息</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 车辆信息（如果有） */}
        {order.vehicle_id && (
          <View className="vehicle-info-section">
            <View className="section-title">车辆信息</View>
            <View className="vehicle-info">
              <View className="detail-row">
                <Text className="detail-label">车辆ID:</Text>
                <Text className="detail-value">{order.vehicle_id}</Text>
              </View>
              <View className="detail-row">
                <View
                  className="view-detail-button"
                  onClick={() => {
                    Taro.navigateTo({
                      url: `/pages/vehicle-detail/index?id=${order.vehicle_id}`
                    })
                  }}
                >
                  <Text>查看详情</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 底部操作栏 */}
      <View className="bottom-bar">
        <View className="feedback-button" onClick={handleFeedback}>
          <Text>反馈</Text>
        </View>
      </View>

      {/* 反馈模态框 */}
      {showFeedback && (
        <Feedback
          visible={showFeedback}
          onClose={() => setShowFeedback(false)}
          onSubmit={handleFeedbackSubmit}
          orderId={order.id}
        />
      )}
    </View>
  )
}

export default OrderDetailPage
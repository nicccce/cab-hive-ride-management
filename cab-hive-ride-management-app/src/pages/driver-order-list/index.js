import { useState, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { FilterOutlined } from '@taroify/icons'
import { Calendar, Cell } from '@taroify/core'
import { getDriverOrders } from '../../services/order'
import useAuth from '../../hooks/useAuth'
import './index.scss'

const DriverOrderListPage = () => {
  const { isLoggedIn, checkLoginStatus, isDriver } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  
  const [statusFilter, setStatusFilter] = useState('')
  const [open, setOpen] = useState(false)
  const [dateRange, setDateRange] = useState([])
  const [formatValue, setFormatValue] = useState('')
  const [showFilter, setShowFilter] = useState(false)

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

  // 页面加载时检查登录状态并获取订单列表
  useEffect(() => {
    checkLoginStatus()
    if (isLoggedIn && isDriver) {
      loadOrders()
    }
  }, [isLoggedIn, isDriver])

  // 加载订单列表
  const loadOrders = async (reset = false, filterStatus = null) => {
    if (loading) return
    
    setLoading(true)
    try {
      const params = {
        page: reset ? 1 : page,
        page_size: 10
      }
      
      // 使用传入的 filterStatus 参数，如果没有则使用组件状态
      const statusToUse = filterStatus !== null ? filterStatus : statusFilter
      
      // 只有当筛选值不为空时才添加到参数中
      if (statusToUse) {
        params.status = statusToUse
      }
      
      // 如果有日期区间，将其作为时间范围参数处理
      if (dateRange && dateRange.length === 2) {
        const [start, end] = dateRange
        params.start_time = formatDateForAPI(start)
        params.end_time = formatDateForAPI(end)
      }
      
      const result = await getDriverOrders(params)
      
      if (result.code === 200) {
        const newOrders = result.data.orders || []
        setOrders(reset ? newOrders : [...orders, ...newOrders])
        setHasMore(newOrders.length === 10)
        setPage(reset ? 2 : page + 1)
      } else {
        Taro.showToast({
          title: result.msg || '获取订单列表失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('获取订单列表失败:', error)
      Taro.showToast({
        title: '获取订单列表失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 处理下拉刷新
  const handleRefresh = () => {
    loadOrders(true)
  }

  // 处理上拉加载更多
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadOrders()
    }
  }

  // 处理状态筛选
  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    setShowFilter(false)
    loadOrders(true, status)
  }

  // 格式化日期区间显示
  const formatRange = (range) => {
    if (range && range.length === 2) {
      const [start, end] = range
      const formatDate = (date) => {
        if (!date) return ''
        const d = new Date(date)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      }
      return `${formatDate(start)} - ${formatDate(end)}`
    }
    return ''
  }

  // 格式化日期用于API请求
  const formatDateForAPI = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  // 处理日期区间确认
  const handleDateRangeConfirm = (newDateRange) => {
    setDateRange(newDateRange)
    setFormatValue(formatRange(newDateRange))
    setOpen(false)
    // 触发搜索
    loadOrders(true)
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

  // 导航到订单详情页
  const navigateToOrderDetail = (orderId) => {
    Taro.navigateTo({
      url: `/pages/driver-order-detail/index?id=${orderId}`
    })
  }

  // 如果用户未登录，显示提示
  if (!isLoggedIn) {
    return (
      <View className="container">
        <View className="login-prompt">
          <Text>请先登录查看订单列表</Text>
        </View>
      </View>
    )
  }

  // 如果不是司机，显示提示
  if (!isDriver) {
    return (
      <View className="container">
        <View className="login-prompt">
          <Text>您不是司机，无法查看司机订单列表</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="container">
      {/* 搜索和筛选栏 */}
      <View className="search-filter-bar">
        <View className="search-box">
          <Cell
            title="起始日期"
            isLink
            onClick={() => setOpen(true)}
          >
            {formatValue || "请选择日期区间"}
          </Cell>
        </View>
        <View className="filter-button" onClick={() => setShowFilter(true)}>
          <FilterOutlined size="16" color="#999" />
          <Text>筛选</Text>
        </View>
      </View>

      {/* 日期选择器 */}
      <Calendar
        type="range"
        value={dateRange}
        onChange={setDateRange}
        poppable
        showPopup={open}
        onClose={() => setOpen(false)}
        onConfirm={handleDateRangeConfirm}
        min={new Date(2020, 0, 1)}  // 允许选择2020年1月1日之后的日期
        max={new Date(2030, 11, 31)}  // 允许选择2030年12月31日之前的日期
      ></Calendar>

      {/* 状态筛选弹窗 */}
      {showFilter && (
        <View className="filter-modal">
          <View className="filter-overlay" onClick={() => setShowFilter(false)}></View>
          <View className="filter-content">
            <View className="filter-header">
              <Text>订单状态筛选</Text>
              <Text className="close-btn" onClick={() => setShowFilter(false)}>×</Text>
            </View>
            <View className="filter-options">
              <View 
                className={`filter-option ${statusFilter === '' ? 'active' : ''}`} 
                onClick={() => handleStatusFilter('')}
              >
                全部订单
              </View>
              {Object.entries(statusMap).map(([key, value]) => (
                <View 
                  key={key}
                  className={`filter-option ${statusFilter === key ? 'active' : ''}`} 
                  onClick={() => handleStatusFilter(key)}
                >
                  {value}
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* 订单列表 */}
      <ScrollView
        className="order-list"
        scrollY
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={handleRefresh}
        onScrollToLower={handleLoadMore}
      >
        {orders.map(order => (
          <View 
            key={order.id} 
            className="order-item"
            onClick={() => navigateToOrderDetail(order.id)}
          >
            <View className="order-header">
              <Text className="order-id">订单号: {order.id}</Text>
              <Text className={`order-status ${order.status}`}>
                {statusMap[order.status] || order.status}
              </Text>
            </View>
            <View className="order-content">
              <View className="location-info">
                <View className="location-point start-point">
                  <Text className="location-name">{order.start_location?.name || '起点'}</Text>
                </View>
                <View className="location-point end-point">
                  <Text className="location-name">{order.end_location?.name || '终点'}</Text>
                </View>
              </View>
              <View className="order-details">
                <View className="detail-row">
                  <Text className="detail-label">下单时间:</Text>
                  <Text className="detail-value">{formatTime(order.start_time)}</Text>
                </View>
                <View className="detail-row">
                  <Text className="detail-label">距离:</Text>
                  <Text className="detail-value">{formatDistance(order.distance)}</Text>
                </View>
                <View className="detail-row">
                  <Text className="detail-label">费用:</Text>
                  <Text className="detail-value">¥{order.fare || 0}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
        
        {/* 加载更多提示 */}
        {hasMore && (
          <View className="load-more">
            <Text>加载中...</Text>
          </View>
        )}
        
        {/* 没有更多数据提示 */}
        {!hasMore && orders.length > 0 && (
          <View className="no-more">
            <Text>没有更多订单了</Text>
          </View>
        )}
        
        {/* 空状态提示 */}
        {!loading && orders.length === 0 && (
          <View className="empty-state">
            <Text>暂无订单</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

export default DriverOrderListPage
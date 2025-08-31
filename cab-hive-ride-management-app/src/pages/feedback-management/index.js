import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { FilterOutlined, EyeOutlined } from '@taroify/icons'
import { getUserFeedbackList } from '../../services/feedback'
import useAuth from '../../hooks/useAuth'
import './index.scss'

const FeedbackManagementPage = () => {
  const { isLoggedIn, checkLoginStatus } = useAuth()
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showFilter, setShowFilter] = useState(false)

  // 反馈状态映射
  const statusMap = {
    open: '待处理',
    processing: '处理中',
    closed: '已关闭'
  }

  // 反馈类型映射
  const typeMap = {
    complaint: '投诉',
    suggestion: '建议',
    consult: '咨询',
    praise: '表扬',
    other: '其他'
  }

  // 页面加载时检查登录状态并获取反馈列表
  useEffect(() => {
    checkLoginStatus()
    if (isLoggedIn) {
      loadFeedbacks()
    }
  }, [isLoggedIn])

  // 加载反馈列表
  const loadFeedbacks = async (reset = false, filterStatus = null, filterType = null) => {
    if (loading) return
    
    setLoading(true)
    try {
      const params = {
        page: reset ? 1 : page,
        page_size: 10
      }
      
      // 使用传入的 filterStatus 参数，如果没有则使用组件状态
      const statusToUse = filterStatus !== null ? filterStatus : statusFilter
      const typeToUse = filterType !== null ? filterType : typeFilter
      
      // 只有当筛选值不为空时才添加到参数中
      if (statusToUse) {
        params.status = statusToUse
      }
      
      if (typeToUse) {
        params.type = typeToUse
      }
      
      const result = await getUserFeedbackList(params)
      
      if (result.code === 200) {
        const newFeedbacks = result.data.feedbacks || []
        setFeedbacks(reset ? newFeedbacks : [...feedbacks, ...newFeedbacks])
        setHasMore(newFeedbacks.length === 10)
        setPage(reset ? 2 : page + 1)
      } else {
        Taro.showToast({
          title: result.msg || '获取反馈列表失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('获取反馈列表失败:', error)
      Taro.showToast({
        title: '获取反馈列表失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 处理下拉刷新
  const handleRefresh = () => {
    loadFeedbacks(true)
  }

  // 处理上拉加载更多
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadFeedbacks()
    }
  }

  // 处理状态筛选
  const handleStatusFilter = (status) => {
    setStatusFilter(status)
    setShowFilter(false)
    loadFeedbacks(true, status, typeFilter)
  }

  // 处理类型筛选
  const handleTypeFilter = (type) => {
    setTypeFilter(type)
    setShowFilter(false)
    loadFeedbacks(true, statusFilter, type)
  }

  // 重置筛选
  const handleResetFilter = () => {
    setStatusFilter('')
    setTypeFilter('')
    setShowFilter(false)
    loadFeedbacks(true, '', '')
  }

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN')
  }

  // 导航到反馈详情页
  const navigateToFeedbackDetail = (feedbackId) => {
    Taro.navigateTo({
      url: `/pages/feedback-detail/index?id=${feedbackId}`
    })
  }

  // 如果用户未登录，显示提示
  if (!isLoggedIn) {
    return (
      <View className="container">
        <View className="login-prompt">
          <Text>请先登录查看反馈列表</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="container">
      {/* 搜索和筛选栏 */}
      <View className="search-filter-bar">
        <View className="filter-button" onClick={() => setShowFilter(true)}>
          <FilterOutlined size="16" color="#999" />
          <Text>筛选</Text>
        </View>
      </View>

      {/* 筛选弹窗 */}
      {showFilter && (
        <View className="filter-modal">
          <View className="filter-overlay" onClick={() => setShowFilter(false)}></View>
          <View className="filter-content">
            <View className="filter-header">
              <Text>反馈筛选</Text>
              <Text className="close-btn" onClick={() => setShowFilter(false)}>×</Text>
            </View>
            
            <View className="filter-section">
              <Text className="filter-section-title">状态筛选</Text>
              <View className="filter-options">
                <View 
                  className={`filter-option ${statusFilter === '' ? 'active' : ''}`} 
                  onClick={() => handleStatusFilter('')}
                >
                  全部状态
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
            
            <View className="filter-section">
              <Text className="filter-section-title">类型筛选</Text>
              <View className="filter-options">
                <View 
                  className={`filter-option ${typeFilter === '' ? 'active' : ''}`} 
                  onClick={() => handleTypeFilter('')}
                >
                  全部类型
                </View>
                {Object.entries(typeMap).map(([key, value]) => (
                  <View 
                    key={key}
                    className={`filter-option ${typeFilter === key ? 'active' : ''}`} 
                    onClick={() => handleTypeFilter(key)}
                  >
                    {value}
                  </View>
                ))}
              </View>
            </View>
            
            <View className="filter-footer">
              <View className="filter-actions">
                <View className="filter-action-btn reset-btn" onClick={handleResetFilter}>
                  重置
                </View>
                <View className="filter-action-btn confirm-btn" onClick={() => setShowFilter(false)}>
                  确定
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 反馈列表 */}
      <View
        className="feedback-list"
        scrollY
        refresherEnabled
        refresherTriggered={loading}
        onRefresherRefresh={handleRefresh}
        onScrollToLower={handleLoadMore}
      >
        {feedbacks.map(feedback => (
          <View 
            key={feedback.id} 
            className="feedback-item"
            onClick={() => navigateToFeedbackDetail(feedback.id)}
          >
            <View className="feedback-header">
              <Text className="feedback-title">{feedback.title}</Text>
              <EyeOutlined size="16" color="#999" />
            </View>
            <View className="feedback-content">
              <View className="feedback-type-status">
                <Text className="feedback-type">{typeMap[feedback.type] || feedback.type}</Text>
                <Text className={`feedback-status ${feedback.status}`}>
                  {statusMap[feedback.status] || feedback.status}
                </Text>
              </View>
              <View className="feedback-time">
                <Text>{formatTime(feedback.create_time)}</Text>
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
        {!hasMore && feedbacks.length > 0 && (
          <View className="no-more">
            <Text>没有更多反馈了</Text>
          </View>
        )}
        
        {/* 空状态提示 */}
        {!loading && feedbacks.length === 0 && (
          <View className="empty-state">
            <Text>暂无反馈</Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default FeedbackManagementPage
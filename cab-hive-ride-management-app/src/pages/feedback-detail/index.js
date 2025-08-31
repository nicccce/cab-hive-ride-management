import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { getUserFeedbackDetail } from '../../services/feedback'
import useAuth from '../../hooks/useAuth'
import './index.scss'

const FeedbackDetailPage = () => {
  const { isLoggedIn, checkLoginStatus } = useAuth()
  const [feedback, setFeedback] = useState(null)
  const [loading, setLoading] = useState(false)

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

  // 页面加载时检查登录状态并获取反馈详情
  useEffect(() => {
    checkLoginStatus()
    if (isLoggedIn) {
      loadFeedbackDetail()
    }
  }, [isLoggedIn])

  // 加载反馈详情
  const loadFeedbackDetail = async () => {
    // 从路由参数中获取反馈ID
    const pages = Taro.getCurrentPages()
    const current = pages[pages.length - 1]
    const feedbackId = current.options?.id
    
    if (!feedbackId) {
      Taro.showToast({
        title: '缺少反馈ID参数',
        icon: 'none'
      })
      return
    }
    
    setLoading(true)
    try {
      const result = await getUserFeedbackDetail(feedbackId)
      
      if (result.code === 200) {
        setFeedback(result.data)
      } else {
        Taro.showToast({
          title: result.msg || '获取反馈详情失败',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('获取反馈详情失败:', error)
      Taro.showToast({
        title: '获取反馈详情失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN')
  }

  // 如果用户未登录，显示提示
  if (!isLoggedIn) {
    return (
      <View className="container">
        <View className="login-prompt">
          <Text>请先登录查看反馈详情</Text>
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

  // 如果没有反馈数据，显示空状态
  if (!feedback) {
    return (
      <View className="container">
        <View className="empty-state">
          <Text>暂无反馈详情</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="container">
      <View className="feedback-detail">
        {/* 反馈基本信息 */}
        <View className="feedback-header">
          <View className="feedback-title">
            <Text>{feedback.title}</Text>
          </View>
          
          <View className="feedback-meta">
            <View className="feedback-type-status">
              <Text className="feedback-type">{typeMap[feedback.type] || feedback.type}</Text>
              <Text className={`feedback-status ${feedback.status}`}>
                {statusMap[feedback.status] || feedback.status}
              </Text>
            </View>
            
            <View className="feedback-time">
              <Text>创建时间: {formatTime(feedback.create_time)}</Text>
              {feedback.update_time && (
                <Text>更新时间: {formatTime(feedback.update_time)}</Text>
              )}
            </View>
          </View>
        </View>
        
        {/* 反馈内容 */}
        <View className="feedback-content-section">
          <View className="section-title">
            <Text>反馈内容</Text>
          </View>
          <View className="feedback-content">
            <Text>{feedback.content}</Text>
          </View>
        </View>
        
        {/* 回复内容 */}
        {feedback.reply && (
          <View className="feedback-reply-section">
            <View className="section-title">
              <Text>官方回复</Text>
            </View>
            <View className="feedback-reply">
              <Text>{feedback.reply}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

export default FeedbackDetailPage
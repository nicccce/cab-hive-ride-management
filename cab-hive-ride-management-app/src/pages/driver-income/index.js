import { View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import { getTotalIncome, getIncomeList } from '../../services/income'
import './index.scss'

const DriverIncome = () => {
  const [totalIncome, setTotalIncome] = useState(0)
  const [incomeList, setIncomeList] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    Taro.setNavigationBarTitle({
      title: '司机收入'
    })
    loadTotalIncome()
    loadIncomeList()
  }, [])

  // 加载总收入
  const loadTotalIncome = async () => {
    try {
      const res = await getTotalIncome()
      if (res.success) {
        setTotalIncome(res.data.total)
      }
    } catch (error) {
      console.error('获取总收入失败:', error)
    }
  }

  // 加载收入列表
  const loadIncomeList = async (reset = false) => {
    if (loading) return
    if (!reset && !hasMore) return

    setLoading(true)
    try {
      const params = {
        page: reset ? 1 : page,
        page_size: pageSize
      }
      
      const res = await getIncomeList(params)
      if (res.success) {
        const newList = res.data.incomes || []
        const pagination = res.data.pagination || {}
        
        if (reset) {
          setIncomeList(newList)
          setPage(1)
        } else {
          setIncomeList(prev => [...prev, ...newList])
          setPage(prev => prev + 1)
        }
        
        setHasMore(pagination.current_page < pagination.total_pages)
      }
    } catch (error) {
      console.error('获取收入列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 格式化金额
  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(2)
  }

  // 格式化时间
  const formatTime = (time) => {
    return new Date(time).toLocaleString('zh-CN')
  }

  // 获取收入类型显示文本
  const getIncomeTypeText = (type) => {
    switch (type) {
      case 'order':
        return '订单收入'
      case 'activity':
        return '活动奖励'
      case 'other':
        return '其他收入'
      default:
        return '收入'
    }
  }

  // 上拉加载更多
  const onScrollToLower = () => {
    if (hasMore && !loading) {
      loadIncomeList()
    }
  }

  return (
    <View className="driver-income-page">
      {/* 总收入部分 */}
      <View className="total-income-section">
        <View className="total-income-label">总收入(元)</View>
        <View className="total-income-amount">¥{formatAmount(totalIncome)}</View>
      </View>

      {/* 收入列表 */}
      <View className="income-list-header">
        <View className="income-list-title">收入明细</View>
      </View>
      
      <View className="income-list" onScrollToLower={onScrollToLower}>
        {incomeList.length > 0 ? (
          incomeList.map((item) => (
            <View className="income-item" key={item.id}>
              <View className="income-item-left">
                <View className="income-type">{getIncomeTypeText(item.income_type)}</View>
                <View className="income-description">{item.description}</View>
                <View className="income-time">{formatTime(item.created_at)}</View>
              </View>
              <View className="income-item-right">
                <View className="income-amount">+{formatAmount(item.amount)}</View>
              </View>
            </View>
          ))
        ) : (
          <View className="empty-state">
            <View className="empty-text">暂无收入记录</View>
          </View>
        )}
        
        {loading && (
          <View className="loading-state">
            <View className="loading-text">加载中...</View>
          </View>
        )}
        
        {!hasMore && incomeList.length > 0 && (
          <View className="no-more">
            <View className="no-more-text">没有更多了</View>
          </View>
        )}
      </View>
    </View>
  )
}

export default DriverIncome
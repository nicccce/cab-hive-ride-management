import { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import { Tabs, Cell, Picker, Popup, Loading, Empty } from '@taroify/core';
import { ArrowDown, FilterOutlined } from '@taroify/icons';
import { getUserFeedbackList } from '../../services/feedback';
import './index.scss';

const FeedbackManagement = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [filterParams, setFilterParams] = useState({
    status: '',
    type: ''
  });
  const [expandedFeedbackId, setExpandedFeedbackId] = useState(null);

  // 反馈状态选项
  const statusOptions = [
    { label: '全部状态', value: '' },
    { label: '待处理', value: 'open' },
    { label: '处理中', value: 'processing' },
    { label: '已关闭', value: 'closed' }
  ];

  // 反馈类型选项
  const typeOptions = [
    { label: '全部类型', value: '' },
    { label: '投诉', value: 'complaint' },
    { label: '建议', value: 'suggestion' },
    { label: '咨询', value: 'consult' },
    { label: '表扬', value: 'praise' },
    { label: '其他', value: 'other' }
  ];

  // 获取反馈列表
  const fetchFeedbackList = async () => {
    setLoading(true);
    try {
      const params = {
        page: 1,
        page_size: 100, // 获取较多数据以展示
        ...filterParams
      };
      
      const response = await getUserFeedbackList(params);
      if (response.code === 200) {
        setFeedbackList(response.data.feedbacks || []);
      }
    } catch (error) {
      console.error('获取反馈列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 切换反馈详情展开状态
  const toggleFeedbackDetail = (id) => {
    setExpandedFeedbackId(expandedFeedbackId === id ? null : id);
  };

  // 重置筛选条件
  const resetFilters = () => {
    setFilterParams({
      status: '',
      type: ''
    });
  };

  // 应用筛选条件
  const applyFilters = () => {
    setShowFilterPopup(false);
    fetchFeedbackList();
  };

  // 根据反馈类型获取标签文本
  const getFeedbackTypeLabel = (type) => {
    const typeMap = {
      complaint: '投诉',
      suggestion: '建议',
      consult: '咨询',
      praise: '表扬',
      other: '其他'
    };
    return typeMap[type] || type;
  };

  // 根据反馈状态获取标签文本
  const getFeedbackStatusLabel = (status) => {
    const statusMap = {
      open: '待处理',
      processing: '处理中',
      closed: '已关闭'
    };
    return statusMap[status] || status;
  };

  // 根据反馈级别渲染星标
  const renderStars = (level) => {
    return (
      <View className="stars">
        {[...Array(5)].map((_, index) => (
          <Text 
            key={index} 
            className={`star ${index < level ? 'active' : ''}`}
          >
            ★
          </Text>
        ))}
      </View>
    );
  };

  useEffect(() => {
    fetchFeedbackList();
  }, []);

  return (
    <View className="feedback-management">
      <Tabs value={activeTab} onChange={setActiveTab} animated>
        <Tabs.Tab title="反馈列表" description="查看所有反馈">
          <View className="feedback-list-container">
            {/* 筛选区域 */}
            <View className="filter-section">
              <View 
                className="filter-trigger" 
                onClick={() => setShowFilterPopup(true)}
              >
                <FilterOutlined />
                <Text className="filter-text">筛选</Text>
                <ArrowDown />
              </View>
            </View>

            {/* 反馈列表 */}
            {loading ? (
              <Loading className="loading-container">加载中...</Loading>
            ) : feedbackList.length === 0 ? (
              <Empty className="empty-container" description="暂无反馈记录" />
            ) : (
              <Cell.Group title="反馈列表" inset className="feedback-list">
                {feedbackList.map((feedback) => (
                  <Cell 
                    key={feedback.id} 
                    className="feedback-item"
                    onClick={() => toggleFeedbackDetail(feedback.id)}
                  >
                    <View className="feedback-header">
                      <View className="feedback-title">{feedback.title}</View>
                      <View className="feedback-meta">
                        <Text className="feedback-type">{getFeedbackTypeLabel(feedback.type)}</Text>
                        <Text className="feedback-status">{getFeedbackStatusLabel(feedback.status)}</Text>
                      </View>
                    </View>
                    
                    <View className="feedback-summary">
                      <Text className="feedback-content-preview">
                        {feedback.content.length > 50 
                          ? `${feedback.content.substring(0, 50)}...` 
                          : feedback.content}
                      </Text>
                    </View>
                    
                    <View className="feedback-footer">
                      <Text className="feedback-time">
                        {new Date(feedback.create_time).toLocaleString()}
                      </Text>
                      {renderStars(feedback.level)}
                    </View>
                    
                    {/* 展开详情 */}
                    {expandedFeedbackId === feedback.id && (
                      <View className="feedback-detail">
                        <View className="detail-row">
                          <Text className="detail-label">反馈ID:</Text>
                          <Text className="detail-value">{feedback.id}</Text>
                        </View>
                        <View className="detail-row">
                          <Text className="detail-label">订单ID:</Text>
                          <Text className="detail-value">{feedback.order_id}</Text>
                        </View>
                        <View className="detail-row">
                          <Text className="detail-label">反馈类型:</Text>
                          <Text className="detail-value">{getFeedbackTypeLabel(feedback.type)}</Text>
                        </View>
                        <View className="detail-row">
                          <Text className="detail-label">反馈状态:</Text>
                          <Text className="detail-value">{getFeedbackStatusLabel(feedback.status)}</Text>
                        </View>
                        <View className="detail-row">
                          <Text className="detail-label">反馈级别:</Text>
                          <View className="detail-value">{renderStars(feedback.level)}</View>
                        </View>
                        <View className="detail-row">
                          <Text className="detail-label">反馈内容:</Text>
                          <Text className="detail-value content">{feedback.content}</Text>
                        </View>
                        {feedback.reply && (
                          <View className="detail-row">
                            <Text className="detail-label">管理员回复:</Text>
                            <Text className="detail-value content reply">{feedback.reply}</Text>
                          </View>
                        )}
                        <View className="detail-row">
                          <Text className="detail-label">创建时间:</Text>
                          <Text className="detail-value">
                            {new Date(feedback.create_time).toLocaleString()}
                          </Text>
                        </View>
                        <View className="detail-row">
                          <Text className="detail-label">更新时间:</Text>
                          <Text className="detail-value">
                            {new Date(feedback.update_time).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    )}
                  </Cell>
                ))}
              </Cell.Group>
            )}
          </View>
        </Tabs.Tab>
      </Tabs>

      {/* 筛选弹窗 */}
      <Popup 
        open={showFilterPopup} 
        rounded 
        placement="bottom" 
        onClose={() => setShowFilterPopup(false)}
      >
        <View className="filter-popup">
          <View className="filter-header">
            <Text className="filter-title">筛选条件</Text>
            <View className="filter-actions">
              <Text className="reset-btn" onClick={resetFilters}>重置</Text>
              <Text className="confirm-btn" onClick={applyFilters}>确定</Text>
            </View>
          </View>
          
          <View className="filter-content">
            <Cell.Group title="筛选条件" inset>
              <Cell title="反馈状态" arrow>
                <Picker
                  value={[statusOptions.findIndex(item => item.value === filterParams.status)]}
                  onChange={(e) => {
                    const selectedIndex = e.detail.value[0];
                    setFilterParams({
                      ...filterParams,
                      status: statusOptions[selectedIndex].value
                    });
                  }}
                >
                  <Picker.Columns>
                    <Picker.Column>
                      {statusOptions.map((item, index) => (
                        <Picker.Option key={index} value={index}>
                          {item.label}
                        </Picker.Option>
                      ))}
                    </Picker.Column>
                  </Picker.Columns>
                </Picker>
                <Text>
                  {statusOptions.find(item => item.value === filterParams.status)?.label || '全部状态'}
                </Text>
              </Cell>
              
              <Cell title="反馈类型" arrow>
                <Picker
                  value={[typeOptions.findIndex(item => item.value === filterParams.type)]}
                  onChange={(e) => {
                    const selectedIndex = e.detail.value[0];
                    setFilterParams({
                      ...filterParams,
                      type: typeOptions[selectedIndex].value
                    });
                  }}
                >
                  <Picker.Columns>
                    <Picker.Column>
                      {typeOptions.map((item, index) => (
                        <Picker.Option key={index} value={index}>
                          {item.label}
                        </Picker.Option>
                      ))}
                    </Picker.Column>
                  </Picker.Columns>
                </Picker>
                <Text>
                  {typeOptions.find(item => item.value === filterParams.type)?.label || '全部类型'}
                </Text>
              </Cell>
            </Cell.Group>
          </View>
        </View>
      </Popup>
    </View>
  );
};

export default FeedbackManagement;
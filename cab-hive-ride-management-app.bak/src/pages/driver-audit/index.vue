<template>
  <view class="audit-container">
    <van-nav-bar
      title="审核记录"
      left-text="返回"
      left-arrow
      @click-left="goBack"
    />

    <view class="audit-content">
      <!-- 筛选标签 -->
      <view class="filter-section">
        <van-tabs v-model:active="activeTab" @change="onTabChange">
          <van-tab title="全部" />
          <van-tab title="待审核" />
          <van-tab title="审核通过" />
          <van-tab title="审核拒绝" />
        </van-tabs>
      </view>

      <!-- 审核记录列表 -->
      <view class="record-list">
        <view 
          v-for="(record, index) in filteredRecords"
          :key="index"
          class="record-item"
        >
          <view class="record-header">
            <view class="record-title">{{ getRecordTitle(record.type) }}</view>
            <van-tag :type="getStatusType(record.status)" size="medium">
              {{ getStatusText(record.status) }}
            </van-tag>
          </view>
          
          <view class="record-content">
            <view class="record-time">提交时间：{{ formatDate(record.createTime) }}</view>
            <view v-if="record.rejectReason" class="reject-reason">
              <view class="reason-label">拒绝原因：</view>
              <view class="reason-text">{{ record.rejectReason }}</view>
            </view>
          </view>

          <view class="record-actions" v-if="record.status === 2">
            <van-button 
              type="primary" 
              size="small"
              @tap="resubmit(record)"
            >
              重新提交
            </van-button>
          </view>
        </view>

        <view v-if="filteredRecords.length === 0" class="empty-state">
          <view class="empty-icon">📋</view>
          <view class="empty-text">暂无审核记录</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { getAuditRecords } from '@/api/user'
import type { AuditRecord } from '@/types/user'

const activeTab = ref(0)
const auditRecords = ref<AuditRecord[]>([])
const loading = ref(false)

// 筛选后的记录
const filteredRecords = computed(() => {
  if (activeTab.value === 0) return auditRecords.value
  
  const statusMap = [null, 0, 1, 2] // 对应tab的状态值
  const targetStatus = statusMap[activeTab.value]
  
  return auditRecords.value.filter(record => record.status === targetStatus)
})

onMounted(() => {
  loadAuditRecords()
})

// 加载审核记录
const loadAuditRecords = async () => {
  loading.value = true
  try {
    const response = await getAuditRecords()
    if (response.code === 0) {
      auditRecords.value = response.data || []
    }
  } catch (error) {
    console.error('获取审核记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 切换标签
const onTabChange = (index: number) => {
  activeTab.value = index
}

// 获取记录标题
const getRecordTitle = (type: string) => {
  const titleMap = {
    'driver': '司机信息审核',
    'vehicle': '车辆信息审核'
  }
  return titleMap[type] || '未知类型'
}

// 获取状态类型
const getStatusType = (status: number) => {
  const typeMap = {
    0: 'warning',
    1: 'success',
    2: 'danger'
  }
  return typeMap[status] || 'default'
}

// 获取状态文本
const getStatusText = (status: number) => {
  const textMap = {
    0: '待审核',
    1: '审核通过',
    2: '审核拒绝'
  }
  return textMap[status] || '未知状态'
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 重新提交
const resubmit = (record: AuditRecord) => {
  const routeMap = {
    'driver': '/pages/driver-register/index',
    'vehicle': '/pages/vehicle-info/index'
  }
  
  const url = routeMap[record.type]
  if (url) {
    Taro.navigateTo({ url })
  }
}

// 返回上一页
const goBack = () => {
  Taro.navigateBack()
}
</script>

<style lang="scss" scoped>
.audit-container {
  min-height: 100vh;
  background-color: var(--background-color);
}

.audit-content {
  padding-bottom: 32px;
}

.filter-section {
  background-color: white;
  padding: 0 32px;
  margin-bottom: 16px;
}

:deep(.van-tabs__wrap) {
  border-bottom: 1px solid var(--border-color);
}

.record-list {
  padding: 0 32px;
}

.record-item {
  background-color: white;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.record-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
}

.record-content {
  margin-bottom: 16px;
}

.record-time {
  font-size: 24px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.reject-reason {
  padding: 16px;
  background-color: #fff2f0;
  border-radius: 8px;
  border-left: 4px solid #ff4d4f;
  margin-top: 16px;
}

.reason-label {
  font-size: 24px;
  color: #cf1322;
  margin-bottom: 8px;
}

.reason-text {
  font-size: 24px;
  color: #a8071a;
  line-height: 1.6;
}

.record-actions {
  text-align: right;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 32px;
}

.empty-icon {
  font-size: 100px;
  margin-bottom: 24px;
}

.empty-text {
  font-size: 32px;
  color: var(--text-secondary);
}
</style>
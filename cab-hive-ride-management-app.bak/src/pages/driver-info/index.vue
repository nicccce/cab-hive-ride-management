<template>
  <view class="driver-info-container">
    <van-nav-bar
      title="司机信息管理"
      left-text="返回"
      left-arrow
      @click-left="goBack"
    />

    <view class="info-content" v-if="driverInfo">
      <!-- 审核状态 -->
      <view class="status-card">
        <view class="status-info">
          <van-tag :type="statusConfig.type" size="large">{{ statusConfig.text }}</van-tag>
          <view v-if="driverInfo.rejectReason" class="reject-reason">
            <view class="reason-title">拒绝原因：</view>
            <view class="reason-text">{{ driverInfo.rejectReason }}</view>
          </view>
        </view>
        <van-button
          v-if="canEdit"
          type="primary"
          size="small"
          @tap="editInfo"
        >
          修改信息
        </van-button>
      </view>

      <!-- 基本信息 -->
      <view class="info-section">
        <view class="section-title">基本信息</view>
        <van-cell-group>
          <van-cell title="真实姓名" :value="driverInfo.realName" />
          <van-cell title="身份证号" :value="maskIdCard(driverInfo.idCard)" />
          <van-cell title="紧急联系人" :value="driverInfo.emergencyContact" />
          <van-cell title="联系人电话" :value="driverInfo.emergencyPhone" />
        </van-cell-group>
      </view>

      <!-- 驾驶证信息 -->
      <view class="info-section">
        <view class="section-title">驾驶证信息</view>
        <van-cell-group>
          <van-cell title="驾驶证号" :value="driverInfo.driverLicense" />
          <van-cell title="到期时间" :value="driverInfo.driverLicenseExpiry" />
        </van-cell-group>
      </view>

      <!-- 操作按钮 -->
      <view class="action-section">
        <van-button
          type="default"
          size="large"
          custom-class="action-btn"
          @tap="viewAuditRecords"
        >
          查看审核记录
        </van-button>
        <van-button
          v-if="canResubmit"
          type="primary"
          size="large"
          custom-class="action-btn"
          @tap="resubmitInfo"
        >
          重新提交
        </van-button>
      </view>
    </view>

    <view class="empty-state" v-else-if="!loading">
      <view class="empty-icon">📝</view>
      <view class="empty-text">暂无司机信息</view>
      <van-button
        type="primary"
        size="large"
        custom-class="register-btn"
        @tap="goToRegister"
      >
        立即注册
      </van-button>
    </view>

    <van-loading v-if="loading" type="spinner" color="#1989fa" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { getDriverInfo } from '@/api/user'
import type { DriverInfo } from '@/types/user'

const driverInfo = ref<DriverInfo | null>(null)
const loading = ref(true)

// 审核状态配置
const statusConfig = computed(() => {
  if (!driverInfo.value) return { type: 'default', text: '未知状态' }
  
  switch (driverInfo.value.status) {
    case 0:
      return { type: 'warning', text: '待审核' }
    case 1:
      return { type: 'success', text: '审核通过' }
    case 2:
      return { type: 'danger', text: '审核拒绝' }
    default:
      return { type: 'default', text: '未知状态' }
  }
})

// 是否可以编辑
const canEdit = computed(() => {
  return driverInfo.value && driverInfo.value.status === 1
})

// 是否可以重新提交
const canResubmit = computed(() => {
  return driverInfo.value && driverInfo.value.status === 2
})

onMounted(() => {
  loadDriverInfo()
})

// 加载司机信息
const loadDriverInfo = async () => {
  loading.value = true
  try {
    const response = await getDriverInfo()
    if (response.code === 0 && response.data) {
      driverInfo.value = response.data
    }
  } catch (error) {
    console.error('获取司机信息失败:', error)
  } finally {
    loading.value = false
  }
}

// 遮罩身份证号
const maskIdCard = (idCard: string) => {
  if (!idCard) return ''
  return idCard.replace(/^(.{6})(?:\d+)(.{4})$/, '$1****$2')
}

// 编辑信息
const editInfo = () => {
  Taro.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

// 查看审核记录
const viewAuditRecords = () => {
  Taro.navigateTo({
    url: '/pages/driver-audit/index?type=driver'
  })
}

// 重新提交
const resubmitInfo = () => {
  Taro.navigateTo({
    url: '/pages/driver-register/index'
  })
}

// 前往注册
const goToRegister = () => {
  Taro.navigateTo({
    url: '/pages/driver-register/index'
  })
}

// 返回上一页
const goBack = () => {
  Taro.navigateBack()
}
</script>

<style lang="scss" scoped>
.driver-info-container {
  min-height: 100vh;
  background-color: var(--background-color);
}

.info-content {
  padding: 32px;
}

.status-card {
  background-color: white;
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 32px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.status-info {
  flex: 1;
}

.reject-reason {
  margin-top: 16px;
  padding: 16px;
  background-color: #fff2f0;
  border-radius: 8px;
  border-left: 4px solid #ff4d4f;
}

.reason-title {
  font-size: 24px;
  color: #cf1322;
  margin-bottom: 8px;
}

.reason-text {
  font-size: 24px;
  color: #a8071a;
  line-height: 1.6;
}

.info-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24px;
}

:deep(.van-cell-group) {
  border-radius: 16px;
  overflow: hidden;
}

.action-section {
  margin-top: 48px;
}

.action-btn {
  border-radius: 48px !important;
  height: 88px !important;
  font-size: 32px !important;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
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
  margin-bottom: 48px;
}

.register-btn {
  border-radius: 48px !important;
  height: 88px !important;
  font-size: 32px !important;
  width: 300px !important;
}
</style>
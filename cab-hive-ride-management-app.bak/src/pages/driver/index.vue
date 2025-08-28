<template>
  <view class="driver-container">
    <!-- 自定义导航栏 -->
    <custom-tabbar />
    
    <!-- 司机状态栏 -->
    <view class="status-section">
      <view class="status-card">
        <view class="status-info">
          <view class="status-avatar">
            <image 
              :src="userStore.userInfo?.avatar || '/assets/images/default-avatar.png'"
              mode="aspectFill"
              class="avatar-img"
            />
            <view class="status-dot" :class="{ online: isOnline }"></view>
          </view>
          <view class="status-detail">
            <view class="driver-name">{{ userStore.userInfo?.nickname || '司机' }}</view>
            <view class="status-text">{{ statusText }}</view>
          </view>
        </view>
        <van-button
          :type="isOnline ? 'default' : 'primary'"
          size="small"
          @tap="toggleOnline"
        >
          {{ isOnline ? '下线' : '上线' }}
        </van-button>
      </view>
    </view>

    <!-- 今日数据 -->
    <view class="data-section">
      <view class="section-title">今日数据</view>
      <view class="data-grid">
        <view class="data-item">
          <view class="data-value">{{ todayData.orders }}</view>
          <view class="data-label">接单数</view>
        </view>
        <view class="data-item">
          <view class="data-value">{{ todayData.distance }}</view>
          <view class="data-label">行驶里程</view>
        </view>
        <view class="data-item">
          <view class="data-value">{{ todayData.income }}</view>
          <view class="data-label">今日收入</view>
        </view>
        <view class="data-item">
          <view class="data-value">{{ todayData.time }}</view>
          <view class="data-label">在线时长</view>
        </view>
      </view>
    </view>

    <!-- 快捷功能 -->
    <view class="function-section">
      <view class="section-title">快捷功能</view>
      <view class="function-grid">
        <view class="function-item" @tap="goToOrders">
          <view class="function-icon">📋</view>
          <view class="function-text">我的订单</view>
        </view>
        <view class="function-item" @tap="goToIncome">
          <view class="function-icon">💰</view>
          <view class="function-text">收入明细</view>
        </view>
        <view class="function-item" @tap="goToRoute">
          <view class="function-icon">🗺️</view>
          <view class="function-text">路线导航</view>
        </view>
        <view class="function-item" @tap="goToHelp">
          <view class="function-icon">❓</view>
          <view class="function-text">帮助中心</view>
        </view>
      </view>
    </view>

    <!-- 当前订单 -->
    <view class="current-order" v-if="currentOrder">
      <view class="order-header">
        <view class="order-title">当前订单</view>
        <view class="order-status">{{ currentOrder.status }}</view>
      </view>
      <view class="order-route">
        <view class="route-item">
          <view class="route-dot start"></view>
          <view class="route-info">
            <view class="route-address">{{ currentOrder.startAddress }}</view>
            <view class="route-time">{{ currentOrder.startTime }}</view>
          </view>
        </view>
        <view class="route-line"></view>
        <view class="route-item">
          <view class="route-dot end"></view>
          <view class="route-info">
            <view class="route-address">{{ currentOrder.endAddress }}</view>
            <view class="route-time">预计{{ currentOrder.estimatedTime }}</view>
          </view>
        </view>
      </view>
      <view class="order-actions">
        <van-button size="small" @tap="contactCustomer">联系乘客</van-button>
        <van-button type="primary" size="small" @tap="completeOrder">完成订单</van-button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/stores/user'
import CustomTabbar from '@/components/custom-tabbar/index.vue'

const userStore = useUserStore()

// 司机状态
const isOnline = ref(false)
const statusText = computed(() => isOnline.value ? '在线接单中' : '已下线')

// 今日数据
const todayData = ref({
  orders: 12,
  distance: '128km',
  income: '￥485',
  time: '8小时'
})

// 当前订单
const currentOrder = ref(null)

onMounted(async () => {
  await userStore.initUserData()
  loadTodayData()
  checkCurrentOrder()
})

// 切换在线状态
const toggleOnline = () => {
  isOnline.value = !isOnline.value
  Taro.showToast({
    title: isOnline.value ? '已上线' : '已下线',
    icon: 'success'
  })
}

// 加载今日数据
const loadTodayData = () => {
  // 这里应该调用API获取真实数据
  console.log('加载今日数据')
}

// 检查当前订单
const checkCurrentOrder = () => {
  // 模拟当前订单数据
  // currentOrder.value = {
  //   status: '乘客已上车',
  //   startAddress: '天安门广场',
  //   startTime: '14:30',
  //   endAddress: '王府井大街',
  //   estimatedTime: '15分钟'
  // }
}

// 页面跳转
const goToOrders = () => {
  Taro.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const goToIncome = () => {
  Taro.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const goToRoute = () => {
  Taro.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const goToHelp = () => {
  Taro.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

// 订单操作
const contactCustomer = () => {
  Taro.makePhoneCall({
    phoneNumber: '13800138000'
  })
}

const completeOrder = () => {
  Taro.showModal({
    title: '确认完成',
    content: '确定要完成当前订单吗？',
    success: (res) => {
      if (res.confirm) {
        currentOrder.value = null
        Taro.showToast({
          title: '订单已完成',
          icon: 'success'
        })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.driver-container {
  min-height: 100vh;
  background-color: var(--background-color);
  padding-bottom: 160px;
}

.status-section {
  padding: 32px;
}

.status-card {
  background-color: white;
  border-radius: 16px;
  padding: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.status-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.status-avatar {
  position: relative;
  margin-right: 24px;
}

.avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

.status-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #ccc;
  border: 3px solid white;

  &.online {
    background-color: #52c41a;
  }
}

.status-detail {
  flex: 1;
}

.driver-name {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.status-text {
  font-size: 24px;
  color: var(--text-secondary);
}

.data-section, .function-section {
  padding: 0 32px 32px;
}

.section-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24px;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.data-item {
  background-color: white;
  border-radius: 16px;
  padding: 24px 16px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.data-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.data-label {
  font-size: 24px;
  color: var(--text-secondary);
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.function-item {
  background-color: white;
  border-radius: 16px;
  padding: 32px 16px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.function-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.function-text {
  font-size: 24px;
  color: var(--text-primary);
}

.current-order {
  margin: 0 32px;
  background-color: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.order-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
}

.order-status {
  padding: 8px 16px;
  background-color: var(--primary-light);
  color: var(--primary-color);
  border-radius: 20px;
  font-size: 24px;
}

.order-route {
  margin-bottom: 24px;
  position: relative;
}

.route-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.route-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-right: 16px;
  flex-shrink: 0;

  &.start {
    background-color: #52c41a;
  }

  &.end {
    background-color: var(--primary-color);
  }
}

.route-line {
  width: 2px;
  height: 32px;
  background-color: var(--border-color);
  margin-left: 7px;
  margin-bottom: 8px;
}

.route-info {
  flex: 1;
}

.route-address {
  font-size: 28px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.route-time {
  font-size: 24px;
  color: var(--text-secondary);
}

.order-actions {
  display: flex;
  gap: 16px;
}
</style>
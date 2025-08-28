<template>
  <view class="home-container">
    <!-- 自定义导航栏 -->
    <custom-tabbar />
    
    <!-- 轮播图区域 -->
    <view class="banner-section">
      <swiper :autoplay="true" :interval="3000" indicator-dots indicator-color="rgba(255, 255, 255, 0.3)" indicator-active-color="white">
        <swiper-item>
          <view class="banner-item banner1">
            <view class="banner-content">
              <view class="banner-title">智蜂出行</view>
              <view class="banner-subtitle">安全便捷的出行服务</view>
            </view>
          </view>
        </swiper-item>
        <swiper-item>
          <view class="banner-item banner2">
            <view class="banner-content">
              <view class="banner-title">绿色出行</view>
              <view class="banner-subtitle">共享美好生活</view>
            </view>
          </view>
        </swiper-item>
      </swiper>
    </view>

    <!-- 快捷服务 -->
    <view class="service-section">
      <view class="section-title">快捷服务</view>
      <view class="service-grid">
        <view class="service-item" @tap="goToRide">
          <view class="service-icon">🚖</view>
          <view class="service-text">立即打车</view>
        </view>
        <view class="service-item" @tap="goToSchedule">
          <view class="service-icon">⏰</view>
          <view class="service-text">预约用车</view>
        </view>
        <view class="service-item" @tap="goToOrders">
          <view class="service-icon">📋</view>
          <view class="service-text">我的订单</view>
        </view>
        <view class="service-item" @tap="goToDriver">
          <view class="service-icon">👤</view>
          <view class="service-text">成为司机</view>
        </view>
      </view>
    </view>

    <!-- 公告通知 -->
    <view class="notice-section">
      <view class="section-title">公告通知</view>
      <view class="notice-list">
        <view class="notice-item">
          <view class="notice-dot"></view>
          <view class="notice-content">
            <view class="notice-title">春节期间服务公告</view>
            <view class="notice-time">2025-01-10</view>
          </view>
        </view>
        <view class="notice-item">
          <view class="notice-dot"></view>
          <view class="notice-content">
            <view class="notice-title">安全出行温馨提示</view>
            <view class="notice-time">2025-01-08</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/stores/user'
import CustomTabbar from '@/components/custom-tabbar/index.vue'

const userStore = useUserStore()

onMounted(async () => {
  try {
    await userStore.initUserData()
  } catch (error) {
    console.log('在游客模式下初始化用户数据失败:', error)
  }
})

const goToRide = () => {
  if (!userStore.isLoggedIn) {
    Taro.navigateTo({
      url: '/pages/login/index'
    })
    return
  }
  Taro.switchTab({
    url: '/pages/ride/index'
  })
}

const goToSchedule = () => {
  Taro.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const goToOrders = () => {
  if (!userStore.isLoggedIn) {
    Taro.navigateTo({
      url: '/pages/login/index'
    })
    return
  }
  Taro.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const goToDriver = () => {
  if (!userStore.isLoggedIn) {
    Taro.navigateTo({
      url: '/pages/login/index'
    })
    return
  }
  Taro.navigateTo({
    url: '/pages/driver-register/index'
  })
}
</script>

<style lang="scss" scoped>
.home-container {
  min-height: 100vh;
  background-color: var(--background-color);
  padding-bottom: 160px;
}

.banner-section {
  height: 300px;
  margin-bottom: 32px;
}

.banner-item {
  height: 100%;
  border-radius: 0 0 32px 32px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  &.banner1 {
    background: linear-gradient(135deg, var(--primary-color), #ff8f65);
  }

  &.banner2 {
    background: linear-gradient(135deg, #52c41a, #73d13d);
  }
}

.banner-content {
  text-align: center;
  color: white;
}

.banner-title {
  font-size: 44px;
  font-weight: 600;
  margin-bottom: 16px;
}

.banner-subtitle {
  font-size: 28px;
  opacity: 0.9;
}

.service-section {
  padding: 0 32px 32px;
}

.section-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 24px;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.service-item {
  background-color: white;
  border-radius: 16px;
  padding: 32px 16px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.service-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.service-text {
  font-size: 24px;
  color: var(--text-primary);
}

.notice-section {
  padding: 0 32px;
}

.notice-list {
  background-color: white;
  border-radius: 16px;
  padding: 24px;
}

.notice-item {
  display: flex;
  align-items: center;
  padding: 16px 0;

  &:not(:last-child) {
    border-bottom: 1px solid var(--border-color);
  }
}

.notice-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--primary-color);
  margin-right: 16px;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
}

.notice-title {
  font-size: 28px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.notice-time {
  font-size: 24px;
  color: var(--text-secondary);
}
</style>
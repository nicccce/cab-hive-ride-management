<template>
  <view class="ride-container">
    <!-- 自定义导航栏 -->
    <custom-tabbar />
    
    <!-- 地图区域 -->
    <view class="map-section">
      <view class="map-placeholder">
        <view class="map-icon">🗺️</view>
        <view class="map-text">地图加载中...</view>
      </view>
    </view>

    <!-- 打车面板 -->
    <view class="ride-panel">
      <view class="location-inputs">
        <view class="input-group">
          <view class="location-dot start"></view>
          <van-field
            v-model="startLocation"
            placeholder="您在哪儿？"
            readonly
            @tap="selectStartLocation"
          />
        </view>
        <view class="input-group">
          <view class="location-dot end"></view>
          <van-field
            v-model="endLocation"
            placeholder="您要去哪儿？"
            readonly
            @tap="selectEndLocation"
          />
        </view>
        <view class="swap-btn" @tap="swapLocations">
          <text class="iconfont">🔄</text>
        </view>
      </view>

      <!-- 车型选择 -->
      <view class="car-types" v-if="showCarTypes">
        <view class="types-title">选择车型</view>
        <view class="types-list">
          <view 
            v-for="(car, index) in carTypes" 
            :key="index"
            class="car-type-item"
            :class="{ active: selectedCarType === index }"
            @tap="selectCarType(index)"
          >
            <view class="car-info">
              <view class="car-name">{{ car.name }}</view>
              <view class="car-desc">{{ car.desc }}</view>
            </view>
            <view class="car-price">￥{{ car.price }}</view>
          </view>
        </view>
      </view>

      <!-- 确认按钮 -->
      <van-button
        type="primary"
        size="large"
        custom-class="confirm-btn"
        :disabled="!canConfirm"
        @tap="confirmRide"
      >
        {{ confirmText }}
      </van-button>
    </view>

    <!-- 位置选择弹窗 -->
    <van-popup
      v-model:show="showLocationPicker"
      position="bottom"
      custom-style="height: 60%"
    >
      <view class="location-picker">
        <view class="picker-header">
          <text @tap="cancelLocationPicker">取消</text>
          <text class="picker-title">{{ pickerTitle }}</text>
          <text @tap="confirmLocationPicker">确定</text>
        </view>
        <view class="search-box">
          <van-field
            v-model="searchKeyword"
            placeholder="搜索地点"
            @input="searchLocation"
          />
        </view>
        <view class="location-list">
          <view 
            v-for="(location, index) in searchResults"
            :key="index"
            class="location-item"
            @tap="selectLocation(location)"
          >
            <view class="location-name">{{ location.name }}</view>
            <view class="location-address">{{ location.address }}</view>
          </view>
        </view>
      </view>
    </van-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/stores/user'
import CustomTabbar from '@/components/custom-tabbar/index.vue'

const userStore = useUserStore()

// 位置信息
const startLocation = ref('')
const endLocation = ref('')
const showLocationPicker = ref(false)
const pickerTitle = ref('')
const searchKeyword = ref('')
const isSelectingStart = ref(true)

// 车型信息
const selectedCarType = ref(0)
const carTypes = [
  { name: '经济型', desc: '实惠出行', price: '12.5' },
  { name: '舒适型', desc: '舒适体验', price: '18.0' },
  { name: '商务型', desc: '商务首选', price: '25.0' }
]

// 搜索结果
const searchResults = ref([
  { name: '天安门广场', address: '北京市东城区' },
  { name: '故宫博物院', address: '北京市东城区景山前街4号' },
  { name: '王府井大街', address: '北京市东城区王府井大街' }
])

// 计算属性
const showCarTypes = computed(() => startLocation.value && endLocation.value)
const canConfirm = computed(() => startLocation.value && endLocation.value)
const confirmText = computed(() => {
  if (!startLocation.value || !endLocation.value) {
    return '请选择出发地和目的地'
  }
  return '立即叫车'
})

onMounted(async () => {
  await userStore.initUserData()
  getCurrentLocation()
})

// 获取当前位置
const getCurrentLocation = () => {
  // 模拟获取当前位置
  startLocation.value = '当前位置'
}

// 选择起点
const selectStartLocation = () => {
  isSelectingStart.value = true
  pickerTitle.value = '选择出发地'
  showLocationPicker.value = true
}

// 选择终点
const selectEndLocation = () => {
  isSelectingStart.value = false
  pickerTitle.value = '选择目的地'
  showLocationPicker.value = true
}

// 交换起点终点
const swapLocations = () => {
  const temp = startLocation.value
  startLocation.value = endLocation.value
  endLocation.value = temp
}

// 选择车型
const selectCarType = (index: number) => {
  selectedCarType.value = index
}

// 搜索地点
const searchLocation = (value: string) => {
  // 这里应该调用真实的地点搜索API
  console.log('搜索关键词:', value)
}

// 选择地点
const selectLocation = (location: any) => {
  if (isSelectingStart.value) {
    startLocation.value = location.name
  } else {
    endLocation.value = location.name
  }
  showLocationPicker.value = false
}

// 取消位置选择
const cancelLocationPicker = () => {
  showLocationPicker.value = false
  searchKeyword.value = ''
}

// 确认位置选择
const confirmLocationPicker = () => {
  showLocationPicker.value = false
  searchKeyword.value = ''
}

// 确认叫车
const confirmRide = () => {
  if (!userStore.isLoggedIn) {
    Taro.navigateTo({
      url: '/pages/login/index'
    })
    return
  }

  Taro.showModal({
    title: '确认叫车',
    content: `从${startLocation.value}到${endLocation.value}，预计费用${carTypes[selectedCarType.value].price}元`,
    success: (res) => {
      if (res.confirm) {
        Taro.showToast({
          title: '正在为您叫车...',
          icon: 'loading'
        })
        // 这里应该调用叫车API
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.ride-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.map-section {
  flex: 1;
  background-color: #f0f0f0;
}

.map-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.map-icon {
  font-size: 80px;
  margin-bottom: 16px;
}

.map-text {
  font-size: 28px;
}

.ride-panel {
  background-color: white;
  border-radius: 32px 32px 0 0;
  padding: 32px;
  margin-bottom: 160px;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);
}

.location-inputs {
  position: relative;
  margin-bottom: 32px;
}

.input-group {
  display: flex;
  align-items: center;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.location-dot {
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

.swap-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  background-color: var(--background-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.car-types {
  margin-bottom: 32px;
}

.types-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.types-list {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.car-type-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  background-color: white;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }

  &.active {
    background-color: var(--primary-light);
    border-color: var(--primary-color);
  }
}

.car-info {
  flex: 1;
}

.car-name {
  font-size: 28px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.car-desc {
  font-size: 24px;
  color: var(--text-secondary);
}

.car-price {
  font-size: 32px;
  font-weight: 600;
  color: var(--primary-color);
}

.confirm-btn {
  border-radius: 48px !important;
  height: 88px !important;
  font-size: 32px !important;
}

.location-picker {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px;
  border-bottom: 1px solid var(--border-color);
}

.picker-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
}

.search-box {
  padding: 24px 32px;
  border-bottom: 1px solid var(--border-color);
}

.location-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 32px;
}

.location-item {
  padding: 20px 0;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }
}

.location-name {
  font-size: 28px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.location-address {
  font-size: 24px;
  color: var(--text-secondary);
}
</style>
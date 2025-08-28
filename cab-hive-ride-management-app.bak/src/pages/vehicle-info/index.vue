<template>
  <view class="vehicle-info-container">
    <van-nav-bar
      title="车辆信息管理"
      left-text="返回"
      left-arrow
      @click-left="goBack"
    />

    <view class="info-content" v-if="vehicleInfo">
      <!-- 审核状态 -->
      <view class="status-card">
        <view class="status-info">
          <van-tag :type="statusConfig.type" size="large">{{ statusConfig.text }}</van-tag>
          <view v-if="vehicleInfo.rejectReason" class="reject-reason">
            <view class="reason-title">拒绝原因：</view>
            <view class="reason-text">{{ vehicleInfo.rejectReason }}</view>
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

      <!-- 车辆信息 -->
      <view class="info-section">
        <view class="section-title">车辆信息</view>
        <van-cell-group>
          <van-cell title="车牌号码" :value="vehicleInfo.licensePlate" />
          <van-cell title="车辆型号" :value="vehicleInfo.vehicleModel" />
          <van-cell title="车身颜色" :value="vehicleInfo.vehicleColor" />
        </van-cell-group>
      </view>

      <!-- 车辆照片 -->
      <view class="info-section">
        <view class="section-title">车辆照片</view>
        <view class="photo-grid">
          <view 
            v-for="(photo, index) in vehicleInfo.vehiclePhotos"
            :key="index"
            class="photo-item"
            @tap="previewPhoto(index)"
          >
            <image :src="photo" mode="aspectFill" class="photo-img" />
          </view>
        </view>
      </view>

      <!-- 行驶证信息 -->
      <view class="info-section">
        <view class="section-title">行驶证</view>
        <view class="document-item" @tap="previewDocument">
          <image :src="vehicleInfo.drivingLicense" mode="aspectFill" class="document-img" />
          <view class="document-label">点击查看大图</view>
        </view>
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
      <view class="empty-icon">🚗</view>
      <view class="empty-text">暂无车辆信息</view>
      <van-button
        type="primary"
        size="large"
        custom-class="add-btn"
        @tap="addVehicle"
      >
        添加车辆信息
      </van-button>
    </view>

    <van-loading v-if="loading" type="spinner" color="#1989fa" />

    <!-- 车辆信息表单弹窗 -->
    <van-popup
      v-model:show="showForm"
      position="bottom"
      custom-style="height: 80%"
    >
      <view class="form-popup">
        <view class="form-header">
          <text @tap="cancelForm">取消</text>
          <text class="form-title">{{ formTitle }}</text>
          <text @tap="saveForm">保存</text>
        </view>
        
        <view class="form-content">
          <van-cell-group>
            <van-field
              v-model="formData.licensePlate"
              label="车牌号码"
              placeholder="请输入车牌号码"
              required
            />
            <van-field
              v-model="formData.vehicleModel"
              label="车辆型号"
              placeholder="请输入车辆型号"
              required
            />
            <van-field
              v-model="formData.vehicleColor"
              label="车身颜色"
              placeholder="请输入车身颜色"
              required
            />
          </van-cell-group>

          <view class="upload-section">
            <view class="upload-title">车辆照片</view>
            <van-uploader 
              v-model="vehiclePhotos" 
              :max-count="4"
              multiple
              :after-read="afterRead"
            />
          </view>

          <view class="upload-section">
            <view class="upload-title">行驶证</view>
            <van-uploader 
              v-model="drivingLicenseFile" 
              :max-count="1"
              :after-read="afterReadLicense"
            />
          </view>
        </view>
      </view>
    </van-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { getVehicleInfo, submitVehicleInfo, updateVehicleInfo } from '@/api/user'
import type { VehicleInfo } from '@/types/user'

const vehicleInfo = ref<VehicleInfo | null>(null)
const loading = ref(true)
const showForm = ref(false)

// 表单数据
const formData = ref({
  licensePlate: '',
  vehicleModel: '',
  vehicleColor: ''
})

const vehiclePhotos = ref([])
const drivingLicenseFile = ref([])

// 审核状态配置
const statusConfig = computed(() => {
  if (!vehicleInfo.value) return { type: 'default', text: '未知状态' }
  
  switch (vehicleInfo.value.status) {
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

// 表单标题
const formTitle = computed(() => {
  return vehicleInfo.value ? '编辑车辆信息' : '添加车辆信息'
})

// 是否可以编辑
const canEdit = computed(() => {
  return vehicleInfo.value && vehicleInfo.value.status === 1
})

// 是否可以重新提交
const canResubmit = computed(() => {
  return vehicleInfo.value && vehicleInfo.value.status === 2
})

onMounted(() => {
  loadVehicleInfo()
})

// 加载车辆信息
const loadVehicleInfo = async () => {
  loading.value = true
  try {
    const response = await getVehicleInfo()
    if (response.code === 0 && response.data) {
      vehicleInfo.value = response.data
    }
  } catch (error) {
    console.error('获取车辆信息失败:', error)
  } finally {
    loading.value = false
  }
}

// 预览车辆照片
const previewPhoto = (index: number) => {
  Taro.previewImage({
    current: vehicleInfo.value?.vehiclePhotos[index],
    urls: vehicleInfo.value?.vehiclePhotos || []
  })
}

// 预览行驶证
const previewDocument = () => {
  if (vehicleInfo.value?.drivingLicense) {
    Taro.previewImage({
      urls: [vehicleInfo.value.drivingLicense]
    })
  }
}

// 编辑信息
const editInfo = () => {
  if (vehicleInfo.value) {
    formData.value = {
      licensePlate: vehicleInfo.value.licensePlate,
      vehicleModel: vehicleInfo.value.vehicleModel,
      vehicleColor: vehicleInfo.value.vehicleColor
    }
  }
  showForm.value = true
}

// 添加车辆
const addVehicle = () => {
  formData.value = {
    licensePlate: '',
    vehicleModel: '',
    vehicleColor: ''
  }
  vehiclePhotos.value = []
  drivingLicenseFile.value = []
  showForm.value = true
}

// 重新提交
const resubmitInfo = () => {
  addVehicle()
}

// 查看审核记录
const viewAuditRecords = () => {
  Taro.navigateTo({
    url: '/pages/vehicle-audit/index'
  })
}

// 取消表单
const cancelForm = () => {
  showForm.value = false
}

// 保存表单
const saveForm = async () => {
  if (!validateForm()) return

  try {
    const data = {
      ...formData.value,
      vehiclePhotos: vehiclePhotos.value.map(item => item.url || ''),
      drivingLicense: drivingLicenseFile.value[0]?.url || ''
    }

    let response
    if (vehicleInfo.value) {
      response = await updateVehicleInfo(data)
    } else {
      response = await submitVehicleInfo(data)
    }

    if (response.code === 0) {
      Taro.showToast({
        title: '保存成功',
        icon: 'success'
      })
      showForm.value = false
      loadVehicleInfo()
    }
  } catch (error) {
    console.error('保存失败:', error)
  }
}

// 验证表单
const validateForm = () => {
  const { licensePlate, vehicleModel, vehicleColor } = formData.value

  if (!licensePlate.trim()) {
    Taro.showToast({ title: '请输入车牌号码', icon: 'error' })
    return false
  }

  if (!vehicleModel.trim()) {
    Taro.showToast({ title: '请输入车辆型号', icon: 'error' })
    return false
  }

  if (!vehicleColor.trim()) {
    Taro.showToast({ title: '请输入车身颜色', icon: 'error' })
    return false
  }

  if (vehiclePhotos.value.length === 0) {
    Taro.showToast({ title: '请上传车辆照片', icon: 'error' })
    return false
  }

  if (drivingLicenseFile.value.length === 0) {
    Taro.showToast({ title: '请上传行驶证', icon: 'error' })
    return false
  }

  return true
}

// 上传车辆照片后的回调
const afterRead = (file: any) => {
  // 这里应该上传到服务器
  console.log('上传车辆照片:', file)
}

// 上传行驶证后的回调
const afterReadLicense = (file: any) => {
  // 这里应该上传到服务器
  console.log('上传行驶证:', file)
}

// 返回上一页
const goBack = () => {
  Taro.navigateBack()
}
</script>

<style lang="scss" scoped>
.vehicle-info-container {
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

.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  background-color: white;
  border-radius: 16px;
  padding: 24px;
}

.photo-item {
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.photo-img {
  width: 100%;
  height: 100%;
}

.document-item {
  background-color: white;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
}

.document-img {
  width: 300px;
  height: 200px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.document-label {
  font-size: 24px;
  color: var(--text-secondary);
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

.add-btn {
  border-radius: 48px !important;
  height: 88px !important;
  font-size: 32px !important;
  width: 300px !important;
}

.form-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32px;
  border-bottom: 1px solid var(--border-color);
}

.form-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
}

.form-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

:deep(.van-cell-group) {
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 32px;
}

.upload-section {
  margin-bottom: 32px;
}

.upload-title {
  font-size: 28px;
  color: var(--text-primary);
  margin-bottom: 16px;
}
</style>
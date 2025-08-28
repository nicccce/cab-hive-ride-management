<template>
  <view class="register-container">
    <van-nav-bar
      title="司机注册"
      left-text="返回"
      left-arrow
      @click-left="goBack"
    />
    
    <view class="register-content">
      <view class="form-section">
        <view class="section-title">基本信息</view>
        <van-cell-group>
          <van-field
            v-model="formData.realName"
            label="真实姓名"
            placeholder="请输入真实姓名"
            required
          />
          <van-field
            v-model="formData.idCard"
            label="身份证号"
            placeholder="请输入身份证号"
            required
          />
          <van-field
            v-model="formData.emergencyContact"
            label="紧急联系人"
            placeholder="请输入紧急联系人姓名"
            required
          />
          <van-field
            v-model="formData.emergencyPhone"
            label="联系人电话"
            placeholder="请输入联系人电话"
            required
          />
        </van-cell-group>
      </view>

      <view class="form-section">
        <view class="section-title">驾驶证信息</view>
        <van-cell-group>
          <van-field
            v-model="formData.driverLicense"
            label="驾驶证号"
            placeholder="请输入驾驶证号"
            required
          />
          <van-cell title="驾驶证到期时间" :value="formData.driverLicenseExpiry || '请选择'" is-link @tap="showDatePicker = true" />
        </van-cell-group>
      </view>

      <view class="form-section">
        <view class="section-title">证件照片</view>
        <view class="upload-section">
          <view class="upload-item">
            <view class="upload-label">身份证正面</view>
            <van-uploader v-model="idCardFront" :max-count="1" />
          </view>
          <view class="upload-item">
            <view class="upload-label">身份证反面</view>
            <van-uploader v-model="idCardBack" :max-count="1" />
          </view>
          <view class="upload-item">
            <view class="upload-label">驾驶证正页</view>
            <van-uploader v-model="driverLicenseFront" :max-count="1" />
          </view>
          <view class="upload-item">
            <view class="upload-label">驾驶证副页</view>
            <van-uploader v-model="driverLicenseBack" :max-count="1" />
          </view>
        </view>
      </view>

      <van-button
        type="primary"
        size="large"
        custom-class="submit-btn"
        :loading="submitting"
        @tap="submitForm"
      >
        提交审核
      </van-button>
    </view>

    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePicker" position="bottom">
      <van-datetime-picker
        v-model="selectedDate"
        type="date"
        :min-date="minDate"
        @confirm="confirmDate"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Taro from '@tarojs/taro'
import { submitDriverInfo } from '@/api/user'

// 表单数据
const formData = ref({
  realName: '',
  idCard: '',
  driverLicense: '',
  driverLicenseExpiry: '',
  emergencyContact: '',
  emergencyPhone: ''
})

// 上传文件
const idCardFront = ref([])
const idCardBack = ref([])
const driverLicenseFront = ref([])
const driverLicenseBack = ref([])

// 日期选择器
const showDatePicker = ref(false)
const selectedDate = ref(new Date())
const minDate = new Date()

const submitting = ref(false)

// 确认日期
const confirmDate = () => {
  formData.value.driverLicenseExpiry = formatDate(selectedDate.value)
  showDatePicker.value = false
}

// 格式化日期
const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 验证表单
const validateForm = () => {
  const { realName, idCard, driverLicense, driverLicenseExpiry, emergencyContact, emergencyPhone } = formData.value
  
  if (!realName.trim()) {
    Taro.showToast({ title: '请输入真实姓名', icon: 'error' })
    return false
  }

  if (!idCard.trim()) {
    Taro.showToast({ title: '请输入身份证号', icon: 'error' })
    return false
  }

  // 简单的身份证格式验证
  const idCardReg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  if (!idCardReg.test(idCard)) {
    Taro.showToast({ title: '身份证号格式不正确', icon: 'error' })
    return false
  }

  if (!driverLicense.trim()) {
    Taro.showToast({ title: '请输入驾驶证号', icon: 'error' })
    return false
  }

  if (!driverLicenseExpiry) {
    Taro.showToast({ title: '请选择驾驶证到期时间', icon: 'error' })
    return false
  }

  if (!emergencyContact.trim()) {
    Taro.showToast({ title: '请输入紧急联系人', icon: 'error' })
    return false
  }

  if (!emergencyPhone.trim()) {
    Taro.showToast({ title: '请输入联系人电话', icon: 'error' })
    return false
  }

  const phoneReg = /^1[3-9]\d{9}$/
  if (!phoneReg.test(emergencyPhone)) {
    Taro.showToast({ title: '联系人电话格式不正确', icon: 'error' })
    return false
  }

  if (idCardFront.value.length === 0 || idCardBack.value.length === 0) {
    Taro.showToast({ title: '请上传身份证照片', icon: 'error' })
    return false
  }

  if (driverLicenseFront.value.length === 0 || driverLicenseBack.value.length === 0) {
    Taro.showToast({ title: '请上传驾驶证照片', icon: 'error' })
    return false
  }

  return true
}

// 提交表单
const submitForm = async () => {
  if (!validateForm()) return

  submitting.value = true

  try {
    const response = await submitDriverInfo({
      ...formData.value,
      // 这里应该上传图片并获取URL
      idCardFrontUrl: 'https://example.com/id-front.jpg',
      idCardBackUrl: 'https://example.com/id-back.jpg',
      driverLicenseFrontUrl: 'https://example.com/license-front.jpg',
      driverLicenseBackUrl: 'https://example.com/license-back.jpg'
    })

    if (response.code === 0) {
      Taro.showToast({
        title: '提交成功，等待审核',
        icon: 'success'
      })
      
      setTimeout(() => {
        Taro.navigateBack()
      }, 2000)
    }
  } catch (error) {
    console.error('提交失败:', error)
  } finally {
    submitting.value = false
  }
}

// 返回上一页
const goBack = () => {
  Taro.navigateBack()
}
</script>

<style lang="scss" scoped>
.register-container {
  min-height: 100vh;
  background-color: var(--background-color);
}

.register-content {
  padding: 32px;
}

.form-section {
  margin-bottom: 48px;
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

:deep(.van-field__label) {
  width: 160px;
  color: var(--text-primary);
}

.upload-section {
  background-color: white;
  border-radius: 16px;
  padding: 32px;
}

.upload-item {
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
}

.upload-label {
  font-size: 28px;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.submit-btn {
  border-radius: 48px !important;
  height: 88px !important;
  font-size: 32px !important;
  margin-top: 32px;
}
</style>
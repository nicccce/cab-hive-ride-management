<template>
  <view class="login-container">
    <view class="login-header">
      <view class="logo">
        <text class="logo-text">🚗</text>
      </view>
      <view class="title">智蜂出行</view>
      <view class="subtitle">安全便捷的出行服务</view>
    </view>

    <view class="login-form">
      <van-cell-group>
        <van-field
          v-model="phone"
          type="number"
          label="手机号"
          placeholder="请输入手机号"
          maxlength="11"
          clearable
        />
        <van-field
          v-model="smsCode"
          type="number"
          label="验证码"
          placeholder="请输入验证码"
          maxlength="6"
          clearable
          use-button-slot
        >
          <template #button>
            <van-button
              size="small"
              type="primary"
              :disabled="countdown > 0"
              @tap="sendCode"
            >
              {{ countdown > 0 ? `${countdown}s后重发` : '获取验证码' }}
            </van-button>
          </template>
        </van-field>
      </van-cell-group>

      <van-button
        type="primary"
        size="large"
        custom-class="login-btn"
        :loading="loading"
        @tap="handleLogin"
      >
        登录
      </van-button>

      <view class="agreement">
        <van-checkbox v-model="agreed">
          我已阅读并同意
        </van-checkbox>
        <text class="link" @tap="showAgreement">《用户协议》</text>
        和
        <text class="link" @tap="showPrivacy">《隐私政策》</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/stores/user'
import { sendSmsCode } from '@/api/user'

const userStore = useUserStore()

const phone = ref('')
const smsCode = ref('')
const agreed = ref(false)
const loading = ref(false)
const countdown = ref(0)

// 验证手机号格式
const validatePhone = (phone: string) => {
  const phoneReg = /^1[3-9]\d{9}$/
  return phoneReg.test(phone)
}

// 发送验证码
const sendCode = async () => {
  if (!phone.value) {
    Taro.showToast({
      title: '请输入手机号',
      icon: 'error'
    })
    return
  }

  if (!validatePhone(phone.value)) {
    Taro.showToast({
      title: '手机号格式不正确',
      icon: 'error'
    })
    return
  }

  try {
    await sendSmsCode(phone.value)
    
    Taro.showToast({
      title: '验证码已发送',
      icon: 'success'
    })

    // 开始倒计时
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)

  } catch (error) {
    console.error('发送验证码失败:', error)
  }
}

// 登录处理
const handleLogin = async () => {
  if (!phone.value) {
    Taro.showToast({
      title: '请输入手机号',
      icon: 'error'
    })
    return
  }

  if (!validatePhone(phone.value)) {
    Taro.showToast({
      title: '手机号格式不正确',
      icon: 'error'
    })
    return
  }

  if (!smsCode.value) {
    Taro.showToast({
      title: '请输入验证码',
      icon: 'error'
    })
    return
  }

  if (smsCode.value.length !== 6) {
    Taro.showToast({
      title: '验证码格式不正确',
      icon: 'error'
    })
    return
  }

  if (!agreed.value) {
    Taro.showToast({
      title: '请阅读并同意用户协议',
      icon: 'error'
    })
    return
  }

  loading.value = true

  try {
    const result = await userStore.loginAction(phone.value, smsCode.value)
    
    if (result.success) {
      Taro.showToast({
        title: '登录成功',
        icon: 'success'
      })

      // 返回上一页或跳转到首页
      setTimeout(() => {
        const pages = Taro.getCurrentPages()
        if (pages.length > 1) {
          Taro.navigateBack()
        } else {
          Taro.switchTab({
            url: '/pages/personal/index'
          })
        }
      }, 1500)
    }
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}

// 显示用户协议
const showAgreement = () => {
  Taro.showModal({
    title: '用户协议',
    content: '这里是用户协议内容...',
    showCancel: false
  })
}

// 显示隐私政策
const showPrivacy = () => {
  Taro.showModal({
    title: '隐私政策',
    content: '这里是隐私政策内容...',
    showCancel: false
  })
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-color), #ff8f65);
  display: flex;
  flex-direction: column;
}

.login-header {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 120px 32px 60px;
  color: white;
}

.logo {
  margin-bottom: 40px;
}

.logo-text {
  font-size: 120px;
}

.title {
  font-size: 48px;
  font-weight: 600;
  margin-bottom: 16px;
}

.subtitle {
  font-size: 28px;
  color: rgba(255, 255, 255, 0.8);
}

.login-form {
  background-color: white;
  border-radius: 32px 32px 0 0;
  padding: 48px 32px;
}

:deep(.van-cell-group) {
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 48px;
}

:deep(.van-field__label) {
  width: 120px;
  color: var(--text-primary);
}

:deep(.van-field__control) {
  color: var(--text-primary);
}

.login-btn {
  background-color: var(--primary-color) !important;
  border: none !important;
  border-radius: 48px !important;
  height: 88px !important;
  font-size: 32px !important;
  margin-bottom: 32px;
}

.agreement {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.link {
  color: var(--primary-color);
  text-decoration: underline;
  margin: 0 4px;
}

:deep(.van-checkbox) {
  margin-right: 8px;
}
</style>
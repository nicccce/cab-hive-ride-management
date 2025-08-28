<template>
  <view class="personal-container">
    <!-- 自定义导航栏 -->
    <custom-tabbar />
    
    <!-- 用户信息区域 -->
    <view class="user-section">
      <view v-if="!userStore.isLoggedIn" class="login-section">
        <view class="avatar-placeholder">
          <text class="iconfont icon-user-large">👤</text>
        </view>
        <view class="login-text">
          <view class="welcome-text">欢迎使用智蜂出行</view>
          <van-button 
            type="primary" 
            size="small" 
            round 
            custom-class="login-btn"
            @tap="goToLogin"
          >
            立即登录
          </van-button>
        </view>
      </view>
      
      <view v-else class="user-info">
        <view class="user-avatar" @tap="changeAvatar">
          <image 
            :src="userStore.userInfo?.avatar || '/assets/images/default-avatar.png'" 
            mode="aspectFill"
            class="avatar-image"
          />
          <view class="avatar-edit">
            <text class="iconfont">📷</text>
          </view>
        </view>
        <view class="user-detail">
          <view class="user-name" @tap="changeNickname">
            {{ userStore.userInfo?.nickname || '设置昵称' }}
            <text class="iconfont arrow-right">›</text>
          </view>
          <view class="user-phone">{{ formatPhone(userStore.userInfo?.phone) }}</view>
          <view v-if="userStore.isDriver" class="driver-badge">
            <text class="badge-text">司机</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view v-if="userStore.isLoggedIn" class="menu-section">
      <!-- 基础功能 -->
      <view class="menu-group">
        <view class="group-title">基础功能</view>
        <van-cell-group>
          <van-cell 
            title="我的订单" 
            icon="orders-o" 
            is-link 
            @tap="goToOrders"
          />
          <van-cell 
            title="意见反馈" 
            icon="chat-o" 
            is-link 
            @tap="goToFeedback"
          />
        </van-cell-group>
      </view>

      <!-- 司机管理 -->
      <view class="menu-group">
        <view class="group-title">司机管理</view>
        <van-cell-group v-if="!userStore.isDriver">
          <van-cell 
            title="查看司机信息" 
            icon="manager-o" 
            is-link 
            @tap="goToDriverRegister"
          />
          <van-cell 
            title="审核信息" 
            icon="pending-payment" 
            is-link 
            @tap="goToAuditRecords"
          />
        </van-cell-group>
        
        <van-cell-group v-else>
          <van-cell 
            title="司机信息管理" 
            icon="manager-o" 
            is-link 
            @tap="goToDriverInfo"
          />
          <van-cell 
            title="车辆信息管理" 
            icon="logistics" 
            is-link 
            @tap="goToVehicleInfo"
          />
        </van-cell-group>
      </view>

      <!-- 设置 -->
      <view class="menu-group">
        <van-cell-group>
          <van-cell 
            title="设置" 
            icon="setting-o" 
            is-link 
            @tap="goToSettings"
          />
          <van-cell 
            title="退出登录" 
            icon="revoke" 
            @tap="handleLogout"
          />
        </van-cell-group>
      </view>
    </view>

    <!-- 修改昵称弹窗 -->
    <van-dialog
      v-model:show="showNicknameDialog"
      title="修改昵称"
      show-cancel-button
      @confirm="confirmNickname"
      @cancel="cancelNickname"
    >
      <van-field
        v-model="newNickname"
        placeholder="请输入新昵称"
        maxlength="20"
      />
    </van-dialog>

    <!-- 头像选择弹窗 -->
    <van-action-sheet
      v-model:show="showAvatarSheet"
      :actions="avatarActions"
      @select="selectAvatarAction"
      cancel-text="取消"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/stores/user'
import CustomTabbar from '@/components/custom-tabbar/index.vue'

const userStore = useUserStore()

// 弹窗状态
const showNicknameDialog = ref(false)
const showAvatarSheet = ref(false)
const newNickname = ref('')

// 头像操作选项
const avatarActions = [
  { name: '从相册选择', value: 'album' },
  { name: '拍照', value: 'camera' }
]

// 页面初始化
onMounted(async () => {
  await userStore.initUserData()
  if (userStore.isLoggedIn) {
    await userStore.fetchUserInfo()
  }
})

// 格式化手机号
const formatPhone = (phone?: string) => {
  if (!phone) return ''
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$2')
}

// 跳转到登录页
const goToLogin = () => {
  Taro.navigateTo({
    url: '/pages/login/index'
  })
}

// 修改昵称
const changeNickname = () => {
  newNickname.value = userStore.userInfo?.nickname || ''
  showNicknameDialog.value = true
}

const confirmNickname = async () => {
  if (!newNickname.value.trim()) {
    Taro.showToast({
      title: '请输入昵称',
      icon: 'error'
    })
    return
  }

  const result = await userStore.updateUserInfoAction({
    nickname: newNickname.value.trim()
  })

  if (result.success) {
    Taro.showToast({
      title: '修改成功',
      icon: 'success'
    })
    showNicknameDialog.value = false
  }
}

const cancelNickname = () => {
  showNicknameDialog.value = false
  newNickname.value = ''
}

// 修改头像
const changeAvatar = () => {
  showAvatarSheet.value = true
}

const selectAvatarAction = async (action: any) => {
  try {
    const sourceType = action.value === 'album' ? ['album'] : ['camera']
    
    const result = await Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType
    })

    const tempFilePath = result.tempFilePaths[0]
    
    // 上传图片（这里需要实现具体的上传逻辑）
    const uploadResult = await uploadAvatar(tempFilePath)
    
    if (uploadResult.success) {
      await userStore.updateUserInfoAction({
        avatar: uploadResult.url
      })
      
      Taro.showToast({
        title: '头像更新成功',
        icon: 'success'
      })
    }
    
    showAvatarSheet.value = false
  } catch (error) {
    console.error('选择图片失败:', error)
    Taro.showToast({
      title: '选择图片失败',
      icon: 'error'
    })
  }
}

// 上传头像（模拟实现）
const uploadAvatar = async (filePath: string) => {
  // 这里应该调用实际的上传接口
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        url: 'https://example.com/new-avatar.jpg'
      })
    }, 1000)
  })
}

// 页面跳转
const goToOrders = () => {
  Taro.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const goToFeedback = () => {
  Taro.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const goToDriverRegister = () => {
  Taro.navigateTo({
    url: '/pages/driver-register/index'
  })
}

const goToDriverInfo = () => {
  Taro.navigateTo({
    url: '/pages/driver-info/index'
  })
}

const goToVehicleInfo = () => {
  Taro.navigateTo({
    url: '/pages/vehicle-info/index'
  })
}

const goToAuditRecords = () => {
  Taro.navigateTo({
    url: '/pages/driver-audit/index'
  })
}

const goToSettings = () => {
  Taro.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

// 退出登录
const handleLogout = () => {
  Taro.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (res.confirm) {
        await userStore.logout()
        Taro.showToast({
          title: '退出成功',
          icon: 'success'
        })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.personal-container {
  min-height: 100vh;
  background-color: var(--background-color);
  padding-bottom: 160px;
}

.user-section {
  background: linear-gradient(135deg, var(--primary-color), #ff8f65);
  padding: 60px 32px 40px;
  color: white;
}

.login-section {
  display: flex;
  align-items: center;
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 32px;

  .iconfont {
    font-size: 60px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.login-text {
  flex: 1;
}

.welcome-text {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 20px;
}

.login-btn {
  background-color: white !important;
  color: var(--primary-color) !important;
  border: none !important;
  width: 160px !important;
  height: 60px !important;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  position: relative;
  margin-right: 32px;
}

.avatar-image {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.3);
}

.avatar-edit {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 40px;
  height: 40px;
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  .iconfont {
    font-size: 20px;
    color: white;
  }
}

.user-detail {
  flex: 1;
}

.user-name {
  font-size: 36px;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;

  .arrow-right {
    margin-left: 8px;
    font-size: 24px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.user-phone {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 16px;
}

.driver-badge {
  display: inline-block;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 8px 16px;

  .badge-text {
    font-size: 20px;
    color: white;
  }
}

.menu-section {
  padding: 32px;
}

.menu-group {
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
}

.group-title {
  font-size: 28px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  padding-left: 8px;
}

:deep(.van-cell-group) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.van-cell) {
  background-color: white;
  
  &:not(:last-child)::after {
    border-bottom: 1px solid var(--border-color);
  }
}

:deep(.van-field__control) {
  padding: 20px 0;
}
</style>
<template>
  <view class="custom-tabbar">
    <view class="tabbar-container">
      <view 
        v-for="(item, index) in tabList" 
        :key="index"
        class="tabbar-item"
        :class="{ 'active': current === index }"
        @tap="switchTab(item, index)"
      >
        <view class="tabbar-icon">
          <text :class="`iconfont ${item.iconClass}`"></text>
        </view>
        <view class="tabbar-text">{{ item.text }}</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const current = ref(0)

// 根据用户角色动态生成导航栏
const tabList = computed(() => {
  const isDriver = userStore.isDriver && !userStore.isBanned
  
  if (isDriver) {
    return [
      {
        pagePath: '/pages/driver/index',
        text: '首页',
        iconClass: 'icon-driver'
      },
      {
        pagePath: '/pages/ride/index',
        text: '打车',
        iconClass: 'icon-ride'
      },
      {
        pagePath: '/pages/personal/index',
        text: '我的',
        iconClass: 'icon-user'
      }
    ]
  } else {
    return [
      {
        pagePath: '/pages/home/index',
        text: '首页',
        iconClass: 'icon-home'
      },
      {
        pagePath: '/pages/personal/index',
        text: '我的',
        iconClass: 'icon-user'
      }
    ]
  }
})

const switchTab = (item: any, index: number) => {
  current.value = index
  Taro.switchTab({
    url: item.pagePath
  })
}

onMounted(() => {
  // 获取当前页面路径
  const pages = Taro.getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const route = currentPage?.route
  
  // 设置当前激活的tab
  const activeIndex = tabList.value.findIndex(item => 
    item.pagePath === `/${route}`
  )
  if (activeIndex !== -1) {
    current.value = activeIndex
  }
})
</script>

<style lang="scss">
.custom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #ffffff;
  border-top: 1px solid #ebedf0;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 9999;
}

.tabbar-container {
  display: flex;
  height: 100px;
}

.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  &.active {
    .tabbar-icon text {
      color: var(--primary-color);
    }
    
    .tabbar-text {
      color: var(--primary-color);
    }
  }
}

.tabbar-icon {
  margin-bottom: 8px;
  
  text {
    font-size: 48px;
    color: #7a7e83;
  }
}

.tabbar-text {
  font-size: 20px;
  color: #7a7e83;
}

// 图标字体（这里使用简单的emoji代替，实际项目中应该使用图标字体）
.iconfont {
  &.icon-home::before { content: '🏠'; }
  &.icon-driver::before { content: '🚗'; }
  &.icon-ride::before { content: '🚖'; }
  &.icon-user::before { content: '👤'; }
}
</style>
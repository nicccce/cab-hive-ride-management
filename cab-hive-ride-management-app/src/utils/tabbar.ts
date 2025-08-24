import Taro from '@tarojs/taro'
import { USER_ROLES, STORAGE_KEYS } from '@/constants'
import type { User } from '@/types'

// 设置TabBar显示状态
export const setTabBarVisibility = () => {
  try {
    const userInfoStr = Taro.getStorageSync(STORAGE_KEYS.USER_INFO)
    if (!userInfoStr) return

    const userInfo: User = JSON.parse(userInfoStr)
    const isDriver = userInfo.role_id === USER_ROLES.DRIVER && !userInfo.is_banned

    if (isDriver) {
      // 司机：显示首页（司机页）、打车页、个人中心页
      Taro.showTabBar()
      // 可以根据需要动态修改TabBar文本
      Taro.setTabBarItem({
        index: 0,
        text: '司机接单'
      })
    } else {
      // 非司机：显示首页（打车页）、个人中心页
      Taro.showTabBar()
      Taro.setTabBarItem({
        index: 0,
        text: '首页'
      })
    }
  } catch (error) {
    console.error('设置TabBar失败:', error)
  }
}

// 隐藏特定TabBar项（小程序API限制，实际需要在app.config.ts中配置）
export const updateTabBarForRole = (roleId: number, isBanned: boolean = false) => {
  const isDriver = roleId === USER_ROLES.DRIVER && !isBanned
  
  // 根据角色显示不同的首页文本
  if (isDriver) {
    Taro.setTabBarItem({
      index: 0,
      text: '司机接单'
    })
  } else {
    Taro.setTabBarItem({
      index: 0, 
      text: '首页'
    })
  }
}
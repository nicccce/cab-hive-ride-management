import { useState, useEffect } from 'react'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import {
  User,
  IdCard,
  Bookmark,
  ClockOutlined,
  Close,
  Replay
} from '@taroify/icons'
import { Dialog } from '@taroify/core'

import useAuth from '../../hooks/useAuth'
import ProfileHeader from '../../components/ProfileHeader'
import MenuSection from '../../components/MenuSection'
import MenuItem from '../../components/MenuItem'
import LoginModal from '../../components/LoginModal'
import EditProfileModal from '../../components/EditProfileModal'
import './index.scss'

const Profile = () => {
  // 从 useAuth 钩子中解构出用户信息、登录状态、司机身份、加载状态以及更新用户信息和检查登录状态的函数
  const { userInfo, isLoggedIn, isDriver, loading, updateUserInfo, checkLoginStatus, logout, refreshInfo } = useAuth()
  // 控制登录模态框显示状态的变量，true 表示显示，false 表示隐藏
  const [showLoginModal, setShowLoginModal] = useState(false)
  // 控制编辑个人资料模态框显示状态的变量，true 表示显示，false 表示隐藏
  const [showEditModal, setShowEditModal] = useState(false)

  // 页面加载时设置导航栏标题为"个人中心"
  useEffect(() => {
    Taro.setNavigationBarTitle({
      title: '个人中心'
    })
  }, [])

  /**
   * 处理用户头像点击事件
   * 如果用户已登录，则显示编辑个人资料模态框
   * 如果用户未登录，则显示登录模态框
   */
  const handleProfileClick = () => {
    if (isLoggedIn) {
      setShowEditModal(true)
    } else {
      setShowLoginModal(true)
    }
  }

  /**
   * 登录成功回调函数
   * 更新用户信息并重新检查登录状态
   * @param {Object} newUserInfo - 新的用户信息对象
   */
  const handleLoginSuccess = (newUserInfo) => {
    updateUserInfo(newUserInfo)
    checkLoginStatus()
  }

  /**
   * 个人资料修改成功回调函数
   * 更新用户信息
   * @param {Object} newUserInfo - 更新后的用户信息对象
   */
  const handleEditProfileSuccess = (newUserInfo) => {
    updateUserInfo(newUserInfo)
  }

  /**
   * 导航到指定页面的函数
   * 如果用户未登录，则先显示登录模态框
   * @param {string} url - 要导航到的页面路径
   */
  const navigateTo = (url) => {
    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }
    
    Taro.navigateTo({ url })
  }

  /**
   * 退出登录处理函数
   * 显示确认对话框，用户确认后执行退出登录操作
   */
  const handleLogout = () => {
    Dialog.confirm({
      title: '提示',
      message: '确定要退出登录吗？',
      confirm: {
        children: '确定',
        onClick: () => {
          // 调用 useAuth hook 提供的 logout 函数
          logout()
          // 显示退出登录成功的提示
          Taro.showToast({
            title: '已退出登录',
            icon: 'success'
          })
          // 延迟一段时间后跳转到首页
          setTimeout(() => {
            Taro.switchTab({
              url: '/pages/home/index'
            })
          }, 1500)
        }
      },
      cancel: {
        children: '取消',
        onClick: () => {
          // 用户取消操作，不需要做任何事情
        }
      }
    })
  }

  const handleRefreshInfo = async () => {
    await refreshInfo()
    Dialog.alert({title: "提示", message:"用户信息刷新成功！"})

  }

  /**
   * 渲染司机管理菜单
   * 根据用户登录状态和司机身份显示不同的菜单项
   * @returns {JSX.Element|null} 返回司机管理菜单的 JSX 元素或 null
   */
  const renderDriverMenu = () => {
    // 如果用户未登录，不显示司机菜单
    if (!isLoggedIn) return null

    // 根据用户是否为司机显示不同的菜单
    if (isDriver) {
      // 已认证司机的菜单
      return (
        <MenuSection title="司机管理">
          <MenuItem
            icon={<IdCard size="20" color="#3b82f6" />}
            title="司机信息管理"
            subtitle="查看和编辑司机资料"
            onClick={() => navigateTo('/pages/driver-info/index')}
          />
          <MenuItem
            icon={<Bookmark size="20" color="#14b8a6" />}
            title="车辆信息管理"
            subtitle="管理您的车辆信息"
            onClick={() => navigateTo('/pages/vehicle-info/index')}
          />
          <MenuItem
            icon={<ClockOutlined size="20" color="#f59e0b" />}
            title="审核记录"
            subtitle="查看司机和车辆审核记录"
            onClick={() => navigateTo('/pages/audit-records/index')}
          />
        </MenuSection>
      )
    } else {
      // 非司机用户的菜单
      return (
        <MenuSection title="司机管理">
          <MenuItem
            icon={<User size="20" color="#3b82f6" />}
            title="我的司机信息"
            subtitle="查看或注册成为司机"
            onClick={() => navigateTo('/pages/driver-register/index')}
          />
          <MenuItem
            icon={<ClockOutlined size="20" color="#f59e0b" />}
            title="待审核信息"
            subtitle="查看审核状态和记录"
            onClick={() => navigateTo('/pages/audit-records/index')}
          />
        </MenuSection>
      )
    }
  }

  // 如果数据正在加载中，显示加载提示
  if (loading) {
    return (
      <View className="container">
        <View className="loading">加载中...</View>
      </View>
    )
  }

  // 渲染个人中心页面
  return (
    <View className="container">
      <View className="profile-page">
        {/* 个人资料头部组件，显示用户基本信息 */}
        <ProfileHeader
          userInfo={userInfo}
          isLoggedIn={isLoggedIn}
          onEditProfile={handleProfileClick}
        />

        {/* 渲染司机管理菜单 */}
        {renderDriverMenu()}

        {/* 渲染退出登录按钮 */}
        {isLoggedIn && (
          <MenuSection title="登录管理">
            <MenuItem
              icon={<Replay size="20" color="#3b82f6" />}
              title="刷新"
              subtitle="刷新用户信息"
              onClick={handleRefreshInfo}
            />
            <MenuItem
              icon={<Close size="20" color="#e74c3c" />}
              title="退出登录"
              subtitle="退出当前账号"
              onClick={handleLogout}
              className="logout-menu-item"
            />
          </MenuSection>
        )}
      </View>

      {/* 登录模态框组件 */}
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* 编辑个人资料模态框组件 */}
      <EditProfileModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        userInfo={userInfo}
        onSuccess={handleEditProfileSuccess}
      />
    </View>
  )
}

export default Profile
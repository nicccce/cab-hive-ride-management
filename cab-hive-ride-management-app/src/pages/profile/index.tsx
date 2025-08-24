import React, { useState, useEffect } from 'react'
import { View, Image } from '@tarojs/components'
import { Button, Cell, CellGroup, Avatar, Dialog, Field, Toast, ActionSheet, Uploader } from 'taroify'
import { Arrow, User, Setting, CustomerService, Orders, Car, Shield } from '@taroify/icons'
import { useSelector, useDispatch } from 'react-redux'
import Taro from '@tarojs/taro'
import { useAuth } from '@/hooks/useAuth'
import LoginModal from '@/components/LoginModal'
import { getUserProfile, updateUserProfile, logout } from '@/store/slices/userSlice'
import { getDriverInfo } from '@/store/slices/driverSlice'
import { USER_ROLES, PAGES } from '@/constants'
import { chooseImage, imageToBase64 } from '@/utils'
import type { AppDispatch } from '@/store'
import './index.scss'

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { userInfo, isLoggedIn, isDriver, isBanned, canAccessDriverFeatures } = useAuth()
  
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editType, setEditType] = useState<'nickname' | 'avatar'>('nickname')
  const [editValue, setEditValue] = useState('')
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // 页面加载时检查登录状态
  useEffect(() => {
    if (isLoggedIn) {
      dispatch(getUserProfile())
      if (isDriver) {
        dispatch(getDriverInfo())
      }
    }
  }, [isLoggedIn, isDriver, dispatch])

  // 显示登录弹窗
  const handleShowLogin = () => {
    setShowLoginModal(true)
  }

  // 处理退出登录
  const handleLogout = async () => {
    Dialog.confirm({
      title: '确认退出',
      message: '确定要退出登录吗？',
      onConfirm: () => {
        dispatch(logout())
        Toast.open('已退出登录')
      }
    })
  }

  // 处理修改昵称
  const handleEditNickname = () => {
    setEditType('nickname')
    setEditValue(userInfo?.nick_name || '')
    setShowEditDialog(true)
  }

  // 处理修改头像
  const handleEditAvatar = () => {
    setShowActionSheet(true)
  }

  // 选择头像来源
  const handleAvatarAction = async (action: string) => {
    if (action === 'camera' || action === 'album') {
      try {
        setLoading(true)
        const imagePath = await chooseImage()
        const base64Image = await imageToBase64(imagePath)
        
        await dispatch(updateUserProfile({
          avatar_url: base64Image
        })).unwrap()
        
        Toast.open('头像更新成功')
      } catch (error) {
        Toast.open('头像更新失败')
      } finally {
        setLoading(false)
        setShowActionSheet(false)
      }
    } else {
      setShowActionSheet(false)
    }
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editValue.trim()) {
      Toast.open('请输入内容')
      return
    }

    try {
      setLoading(true)
      await dispatch(updateUserProfile({
        nick_name: editValue.trim()
      })).unwrap()
      
      setShowEditDialog(false)
      Toast.open('更新成功')
    } catch (error) {
      Toast.open('更新失败')
    } finally {
      setLoading(false)
    }
  }

  // 导航到页面
  const navigateTo = (url: string) => {
    Taro.navigateTo({ url })
  }

  return (
    <View className="profile-page">
      {/* 用户信息区域 */}
      <View className="profile-header">
        <View className="profile-bg">
          <Image 
            className="bg-image"
            src="https://images.pexels.com/photos/1036857/pexels-photo-1036857.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750"
            mode="aspectFill"
          />
          <View className="bg-overlay" />
        </View>
        
        <View className="profile-info">
          {isLoggedIn ? (
            <>
              <Avatar
                className="profile-avatar"
                src={userInfo?.avatar_url}
                size="large"
                onClick={handleEditAvatar}
              >
                {!userInfo?.avatar_url && <User />}
              </Avatar>
              
              <View className="profile-details">
                <View className="profile-name" onClick={handleEditNickname}>
                  {userInfo?.nick_name || '未设置昵称'}
                  <Setting className="edit-icon" />
                </View>
                <View className="profile-role">
                  {isDriver ? '认证司机' : '普通用户'}
                  {isBanned && <View className="banned-badge">已封禁</View>}
                </View>
              </View>
            </>
          ) : (
            <>
              <Avatar className="profile-avatar" size="large">
                <User />
              </Avatar>
              <View className="profile-details">
                <Button className="login-btn" onClick={handleShowLogin}>
                  点击登录
                </Button>
              </View>
            </>
          )}
        </View>
      </View>

      {/* 功能菜单 */}
      <View className="profile-content">
        {/* 基础功能 */}
        <CellGroup className="menu-group" title="基础功能">
          <Cell
            className="menu-item"
            icon={<Orders />}
            title="我的订单"
            rightIcon={<Arrow />}
            clickable
            onClick={() => Toast.open('功能开发中')}
          />
          <Cell
            className="menu-item"
            icon={<CustomerService />}
            title="意见反馈"
            rightIcon={<Arrow />}
            clickable
            onClick={() => Toast.open('功能开发中')}
          />
        </CellGroup>

        {/* 司机管理 */}
        {isLoggedIn && (
          <CellGroup className="menu-group" title="司机管理">
            {!isDriver ? (
              // 非司机用户菜单
              <>
                <Cell
                  className="menu-item"
                  icon={<Car />}
                  title="司机信息注册"
                  label="成为认证司机"
                  rightIcon={<Arrow />}
                  clickable
                  onClick={() => navigateTo(PAGES.DRIVER_REGISTER)}
                />
                <Cell
                  className="menu-item"
                  icon={<Shield />}
                  title="待审核信息"
                  label="查看审核进度"
                  rightIcon={<Arrow />}
                  clickable
                  onClick={() => navigateTo(PAGES.AUDIT_RECORDS)}
                />
              </>
            ) : (
              // 司机用户菜单
              <>
                <Cell
                  className="menu-item"
                  icon={<User />}
                  title="司机信息管理"
                  label="查看和修改司机信息"
                  rightIcon={<Arrow />}
                  clickable
                  onClick={() => navigateTo(PAGES.DRIVER_INFO)}
                />
                <Cell
                  className="menu-item"
                  icon={<Car />}
                  title="车辆信息管理"
                  label="管理我的车辆"
                  rightIcon={<Arrow />}
                  clickable
                  onClick={() => navigateTo(PAGES.VEHICLE_INFO)}
                />
                <Cell
                  className="menu-item"
                  icon={<Shield />}
                  title="司机审核记录"
                  label="查看历史审核记录"
                  rightIcon={<Arrow />}
                  clickable
                  onClick={() => navigateTo(PAGES.AUDIT_RECORDS)}
                />
                <Cell
                  className="menu-item"
                  icon={<Shield />}
                  title="车辆审核记录"
                  label="查看车辆审核记录"
                  rightIcon={<Arrow />}
                  clickable
                  onClick={() => navigateTo(PAGES.VEHICLE_AUDIT_RECORDS)}
                />
              </>
            )}
          </CellGroup>
        )}

        {/* 退出登录 */}
        {isLoggedIn && (
          <View className="logout-section">
            <Button className="logout-btn" onClick={handleLogout}>
              退出登录
            </Button>
          </View>
        )}
      </View>

      {/* 登录弹窗 */}
      <LoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          dispatch(getUserProfile())
        }}
      />

      {/* 编辑昵称对话框 */}
      <Dialog
        open={showEditDialog}
        title="修改昵称"
        onClose={() => setShowEditDialog(false)}
        onConfirm={handleSaveEdit}
        loading={loading}
      >
        <Field
          value={editValue}
          placeholder="请输入昵称"
          onChange={(value) => setEditValue(value)}
        />
      </Dialog>

      {/* 头像选择操作表 */}
      <ActionSheet
        open={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        actions={[
          { name: '拍照', value: 'camera' },
          { name: '从相册选择', value: 'album' },
          { name: '取消', value: 'cancel' }
        ]}
        onSelect={handleAvatarAction}
      />

      {/* Toast组件 */}
      <Toast />
    </View>
  )
}

export default ProfilePage
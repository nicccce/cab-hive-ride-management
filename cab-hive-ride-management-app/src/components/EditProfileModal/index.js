import { useState, useEffect } from 'react'
import { View, Input, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Popup } from '@taroify/core'
import { updateUserProfile, uploadImage } from '../../services/user'
import './index.scss'

const EditProfileModal = ({ visible, onClose, userInfo, onSuccess }) => {
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (userInfo) {
      setNickname(userInfo.nick_name || '')
      setAvatar(userInfo.avatar_url || '')
    }
  }, [userInfo])

  // 选择头像
  const chooseAvatar = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0];
        
        // 显示上传中提示
        Taro.showLoading({
          title: '上传中...'
        });
        
        try {
          // 调用上传接口
          const uploadResult = await uploadImage(tempFilePath);
          
          if (uploadResult.success) {
            // 上传成功，设置头像URL
            setAvatar(uploadResult.data.url);
            Taro.showToast({
              title: '头像上传成功',
              icon: 'success'
            });
          } else {
            // 上传失败
            Taro.showToast({
              title: uploadResult.error || '上传失败',
              icon: 'error'
            });
          }
        } catch (error) {
          console.error('Upload image failed:', error);
          Taro.showToast({
            title: '上传失败',
            icon: 'error'
          });
        } finally {
          Taro.hideLoading();
        }
      }
    })
  }

  // 保存修改
  const handleSave = async () => {
    if (!nickname.trim()) {
      Taro.showToast({
        title: '请输入昵称',
        icon: 'error'
      })
      return
    }

    try {
      setLoading(true)
      
      const result = await updateUserProfile({
        nick_name: nickname.trim(),
        avatar_url: avatar
      })

      if (result.success) {
        Taro.showToast({
          title: '修改成功',
          icon: 'success'
        })

        // 更新用户信息
        const newUserInfo = {
          ...userInfo,
          nick_name: nickname.trim(),
          avatar_url: avatar
        }
        
        if (onSuccess) {
          onSuccess(newUserInfo)
        }
        
        onClose()
      }
    } catch (error) {
      console.error('Update profile failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Popup
      open={visible}
      onClose={onClose}
      placement="center"
      className="edit-profile-modal"
    >
      <View className="edit-profile-content">
        <View className="edit-profile-header">
          <View className="edit-profile-title">编辑个人资料</View>
        </View>

        <View className="edit-profile-body">
          <View className="form-item">
            <View className="form-label">头像</View>
            <View className="avatar-section" onClick={chooseAvatar}>
              <Image
                src={avatar || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150'}
                className="avatar-preview"
                mode="aspectFill"
              />
              <View className="avatar-tip">点击更换头像</View>
            </View>
          </View>

          <View className="form-item">
            <View className="form-label">昵称</View>
            <Input
              className="form-input"
              placeholder="请输入昵称"
              value={nickname}
              onInput={(e) => setNickname(e.detail.value)}
              maxlength={20}
            />
          </View>
        </View>

        <View className="edit-profile-footer">
          <Button
            className="cancel-btn"
            onClick={onClose}
          >
            取消
          </Button>
          <Button
            className="save-btn"
            loading={loading}
            onClick={handleSave}
          >
            {loading ? '保存中...' : '保存'}
          </Button>
        </View>
      </View>
    </Popup>
  )
}

export default EditProfileModal
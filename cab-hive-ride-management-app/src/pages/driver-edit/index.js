import { useState, useEffect } from 'react'
import { View, Text, Input, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Toast } from '@taroify/core'
import { getDriverInfo, updateDriverInfo } from '../../services/driver'
import { uploadImage } from '../../services/user'
import useAuth from '../../hooks/useAuth'
import './index.scss'

const DriverEdit = () => {
  const { isDriver } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license_number: '',
    license_image: ''
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    Taro.setNavigationBarTitle({
      title: '编辑司机信息'
    })
    
    // 获取司机信息
    fetchDriverInfo()
  }, [])

  // 获取司机信息
  const fetchDriverInfo = async () => {
    try {
      const result = await getDriverInfo()
      if (result.success) {
        // 填充表单数据
        setFormData({
          name: result.data.name || '',
          phone: result.data.phone || '',
          license_number: result.data.license_number || '',
          license_image: result.data.license_image_url || ''
        })
      }
    } catch (error) {
      console.error('Get driver info failed:', error)
      Taro.showToast({
        title: '获取司机信息失败',
        icon: 'error'
      })
    } finally {
      setPageLoading(false)
    }
  }

  // 选择驾照图片
  const chooseLicenseImage = async () => {
    try {
      setUploading(true)
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })
      
      // 上传图片到服务器获得 URL
      const tempFile = res.tempFiles[0]
      const uploadResult = await uploadImage(tempFile)
      
      if (uploadResult.success) {
        setFormData(prev => ({
          ...prev,
          license_image: uploadResult.data.image_url
        }))
        Taro.showToast({
          title: '图片上传成功',
          icon: 'success'
        })
      } else {
        throw new Error(uploadResult.error || '图片上传失败')
      }
    } catch (error) {
      console.error('Upload image failed:', error)
      Taro.showToast({
        title: error.message || '图片上传失败',
        icon: 'error'
      })
    } finally {
      setUploading(false)
    }
  }

  // 表单输入处理
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 提交更新
  const handleSubmit = async () => {
    const { name, phone, license_number, license_image } = formData
    
    if (!name.trim()) {
      Taro.showToast({
        title: '请输入姓名',
        icon: 'error'
      })
      return
    }

    if (!phone.trim()) {
      Taro.showToast({
        title: '请输入手机号',
        icon: 'error'
      })
      return
    }

    if (!license_number.trim()) {
      Taro.showToast({
        title: '请输入驾照编号',
        icon: 'error'
      })
      return
    }

    if (!license_image) {
      Taro.showToast({
        title: '请上传驾照图片',
        icon: 'error'
      })
      return
    }

    try {
      setLoading(true)
      
      const result = await updateDriverInfo({
        name: name.trim(),
        phone: phone.trim(),
        license_number: license_number.trim(),
        license_image_url: license_image
      })

      if (result.success) {
        setToastMessage('您的信息修改已经提交管理员审核')
        setToastOpen(true)
        
        // 2秒后跳转回上一页
        setTimeout(() => {
          Taro.navigateBack()
        }, 2000)
      } else {
        throw new Error(result.msg || '更新失败')
      }
    } catch (error) {
      console.error('Driver update failed:', error)
      Taro.showToast({
        title: error.message || '更新失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return (
      <View className="container">
        <View className="loading">加载中...</View>
      </View>
    )
  }

  // 如果不是司机，显示无权限页面
  if (!isDriver) {
    return (
      <View className="container">
        <View className="loading">您没有权限访问此页面</View>
      </View>
    )
  }

  // 编辑司机信息表单
  return (
    <View className="container">
      <Toast open={toastOpen} onClose={() => setToastOpen(false)}>
        {toastMessage}
      </Toast>
      <View className="edit-page">
        <View className="edit-header">
          <Text className="edit-title">编辑司机信息</Text>
          <Text className="edit-subtitle">修改您的司机资料</Text>
        </View>

        <View className="form-container">
          <View className="form-item">
            <Text className="form-label">真实姓名</Text>
            <Input
              className="form-input"
              placeholder="请输入真实姓名"
              value={formData.name}
              onInput={(e) => handleInputChange('name', e.detail.value)}
            />
          </View>

          <View className="form-item">
            <Text className="form-label">手机号码</Text>
            <Input
              className="form-input"
              placeholder="请输入手机号"
              type="number"
              value={formData.phone}
              onInput={(e) => handleInputChange('phone', e.detail.value)}
            />
          </View>

          <View className="form-item">
            <Text className="form-label">驾照编号</Text>
            <Input
              className="form-input"
              placeholder="请输入驾照编号"
              value={formData.license_number}
              onInput={(e) => handleInputChange('license_number', e.detail.value)}
            />
          </View>

          <View className="form-item">
            <Text className="form-label">驾照图片</Text>
            <View className="image-upload" onClick={chooseLicenseImage}>
              {formData.license_image ? (
                <Image
                  src={formData.license_image}
                  className="uploaded-image"
                  mode="aspectFit"
                />
              ) : (
                <View className="upload-placeholder">
                  <Text className="upload-text">点击上传驾照图片</Text>
                  <Text className="upload-tip">请确保图片清晰可见</Text>
                </View>
              )}
            </View>
          </View>

          <Button
            className="submit-btn"
            loading={loading || uploading}
            onClick={handleSubmit}
            disabled={uploading}
          >
            {uploading ? '上传中...' : loading ? '提交中...' : '提交修改'}
          </Button>
        </View>
      </View>
    </View>
  )
}

export default DriverEdit
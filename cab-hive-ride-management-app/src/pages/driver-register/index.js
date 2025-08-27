import { useState, useEffect } from 'react'
import { View, Text, Input, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Cell, Field } from '@taroify/core'
import { driverRegister } from '../../services/auth'
import { getDriverInfo } from '../../services/driver'
import { uploadImage } from '../../services/user'
import useAuth from '../../hooks/useAuth'
import './index.scss'

const DriverRegister = () => {
  const { userInfo, isDriver } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license_number: '',
    license_image: ''
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [driverInfo, setDriverInfo] = useState(null)
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    Taro.setNavigationBarTitle({
      title: '司机信息'
    })
    
    // 检查是否已有司机信息
    checkDriverInfo()
  }, [])

  // 检查司机信息
  const checkDriverInfo = async () => {
    try {
      const result = await getDriverInfo()
      if (result.success) {
        setDriverInfo(result.data)
      }
    } catch (error) {
      console.error('Get driver info failed:', error)
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

  // 提交注册
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
      
      const result = await driverRegister({
        name: name.trim(),
        phone: phone.trim(),
        license_number: license_number.trim(),
        license_image_url: license_image
      })

      if (result.success) {
        Taro.showToast({
          title: '提交成功，等待审核',
          icon: 'success'
        })

        // 清空表单
        setFormData({
          name: '',
          phone: '',
          license_number: '',
          license_image: ''
        })

        // 返回上一页
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      }
    } catch (error) {
      console.error('Driver register failed:', error)
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

  // 如果已经是司机，显示已认证司机信息
  if (isDriver && driverInfo) {
    return (
      <View className="container">
        <View className="driver-info-page">
          <View className="info-header">
            <Text className="info-title">司机信息</Text>
            <Text className="info-subtitle">您已通过司机认证</Text>
          </View>

          <View className="info-card">
            <View className="info-item">
              <Text className="info-label">姓名</Text>
              <Text className="info-value">{driverInfo.name}</Text>
            </View>
            <View className="info-item">
              <Text className="info-label">手机号</Text>
              <Text className="info-value">{driverInfo.phone}</Text>
            </View>
            <View className="info-item">
              <Text className="info-label">驾照编号</Text>
              <Text className="info-value">{driverInfo.license_number}</Text>
            </View>
            <View className="info-item">
              <Text className="info-label">审核状态</Text>
              <Text className={`status-badge status-${driverInfo.status}`}>
                {driverInfo.status === 'approved' ? '已通过' : 
                 driverInfo.status === 'rejected' ? '已拒绝' : '待审核'}
              </Text>
            </View>
          </View>

          {driverInfo.license_image_url && (
            <View className="license-preview">
              <Text className="preview-title">驾照图片</Text>
              <Image
                src={driverInfo.license_image_url}
                className="license-image"
                mode="aspectFit"
              />
            </View>
          )}
        </View>
      </View>
    )
  }

  // 司机注册表单
  return (
    <View className="container">
      <View className="register-page">
        <View className="register-header">
          <Text className="register-title">司机认证</Text>
          <Text className="register-subtitle">完善信息，成为司机</Text>
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
            {uploading ? '上传中...' : loading ? '提交中...' : '提交审核'}
          </Button>
        </View>
      </View>
    </View>
  )
}

export default DriverRegister
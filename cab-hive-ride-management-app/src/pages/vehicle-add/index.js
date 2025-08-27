import { useState, useEffect } from 'react'
import { View, Text, Input, Button, Image, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Toast } from '@taroify/core'
import { submitVehicleForReview, getVehicleDetail, updateVehicleForReview } from '../../services/vehicle'
import { uploadImage } from '../../services/user'
import useAuth from '../../hooks/useAuth'
import './index.scss'

const VehicleAdd = () => {
  const { isDriver } = useAuth()
  const [formData, setFormData] = useState({
    plate_number: '',
    vehicle_type: '',
    brand: '',
    model: '',
    color: '',
    year: new Date().getFullYear(),
    registration_image: '',
    insurance_expiry: ''
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [isEditMode, setIsEditMode] = useState(false)
  const [vehicleId, setVehicleId] = useState(null)
  
  // 车辆类型选项
  const vehicleTypes = ['轿车', 'SUV', 'MPV', '跑车', '皮卡', '其他']
  
  // 年份选项（近20年）
  const yearOptions = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i)

  // 获取页面参数
  useEffect(() => {
    const params = Taro.getCurrentInstance().router.params
    if (params && params.id) {
      setVehicleId(params.id)
      setIsEditMode(true)
      fetchVehicleDetail(params.id)
    }
  }, [])

  // 获取车辆详情
  const fetchVehicleDetail = async (id) => {
    try {
      const result = await getVehicleDetail(id)
      if (result.success && result.data) {
        const vehicle = result.data
        setFormData({
          plate_number: vehicle.plate_number,
          vehicle_type: vehicle.vehicle_type,
          brand: vehicle.brand,
          model: vehicle.model,
          color: vehicle.color,
          year: vehicle.year,
          registration_image: vehicle.registration_image,
          insurance_expiry: vehicle.insurance_expiry
        })
      }
    } catch (error) {
      console.error('获取车辆详情失败:', error)
      Taro.showToast({
        title: '获取车辆详情失败',
        icon: 'error'
      })
    }
  }

  // 选择行驶证图片
  const chooseRegistrationImage = async () => {
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
          registration_image: uploadResult.data.image_url
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
  
  // 处理年份选择
  const handleYearChange = (e) => {
    const selectedYear = yearOptions[e.detail.value]
    handleInputChange('year', selectedYear)
  }
  
  // 处理车辆类型选择
  const handleVehicleTypeChange = (e) => {
    const selectedType = vehicleTypes[e.detail.value]
    handleInputChange('vehicle_type', selectedType)
  }
  
  // 处理保险到期时间选择
  const handleInsuranceExpiryChange = (e) => {
    handleInputChange('insurance_expiry', e.detail.value)
  }

  // 提交车辆信息
  const handleSubmit = async () => {
    const { plate_number, vehicle_type, brand, model, color, year, registration_image, insurance_expiry } = formData
    
    if (!plate_number.trim()) {
      Taro.showToast({
        title: '请输入车牌号码',
        icon: 'error'
      })
      return
    }

    if (!vehicle_type) {
      Taro.showToast({
        title: '请选择车辆类型',
        icon: 'error'
      })
      return
    }

    if (!brand.trim()) {
      Taro.showToast({
        title: '请输入车辆品牌',
        icon: 'error'
      })
      return
    }

    if (!model.trim()) {
      Taro.showToast({
        title: '请输入车辆型号',
        icon: 'error'
      })
      return
    }

    if (!color.trim()) {
      Taro.showToast({
        title: '请输入车辆颜色',
        icon: 'error'
      })
      return
    }

    if (!registration_image) {
      Taro.showToast({
        title: '请上传行驶证图片',
        icon: 'error'
      })
      return
    }

    if (!insurance_expiry) {
      Taro.showToast({
        title: '请选择保险到期时间',
        icon: 'error'
      })
      return
    }

    try {
      setLoading(true)
      
      const result = await (
        isEditMode ? 
        updateVehicleForReview ({
          plate_number: plate_number.trim(),
          vehicle_type: vehicle_type,
          brand: brand.trim(),
          model: model.trim(),
          color: color.trim(),
          year: year,
          registration_image: registration_image,
          insurance_expiry: insurance_expiry
        }, vehicleId)
        : submitVehicleForReview({
          plate_number: plate_number.trim(),
          vehicle_type: vehicle_type,
          brand: brand.trim(),
          model: model.trim(),
          color: color.trim(),
          year: year,
          registration_image: registration_image,
          insurance_expiry: insurance_expiry
        })
      )

      if (result.success) {
        setToastMessage(isEditMode ? '您的车辆信息已更新并提交审核' : '您的车辆信息已提交审核')
        setToastOpen(true)
        
        // 2秒后跳转回上一页
        setTimeout(() => {
          Taro.navigateBack()
        }, 2000)
      } else {
        throw new Error(result.msg || '提交失败')
      }
    } catch (error) {
      console.error('Vehicle submission failed:', error)
      Taro.showToast({
        title: error.message || '提交失败',
        icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // 如果不是司机，显示无权限页面
  if (!isDriver) {
    return (
      <View className="container">
        <View className="loading">您没有权限访问此页面</View>
      </View>
    )
  }

  // 添加车辆信息表单
  return (
    <View className="container">
      <Toast open={toastOpen} onClose={() => setToastOpen(false)}>
        {toastMessage}
      </Toast>
      <View className="add-page">
        <View className="add-header">
          <Text className="add-title">{isEditMode ? '编辑车辆' : '添加车辆'}</Text>
          <Text className="add-subtitle">{isEditMode ? '修改您的车辆信息并重新提交审核' : '提交您的车辆信息进行审核'}</Text>
        </View>

        <View className="form-container">
          <View className="form-item">
            <Text className="form-label">车牌号码</Text>
            <Input
              className="form-input"
              placeholder="请输入车牌号码"
              value={formData.plate_number}
              onInput={(e) => handleInputChange('plate_number', e.detail.value)}
            />
          </View>

          <View className="form-item">
            <Text className="form-label">车辆类型</Text>
            <Picker 
              mode="selector" 
              range={vehicleTypes}
              onChange={handleVehicleTypeChange}
            >
              <View className="picker-selector">
                {formData.vehicle_type || '请选择车辆类型'}
              </View>
            </Picker>
          </View>

          <View className="form-item">
            <Text className="form-label">车辆品牌</Text>
            <Input
              className="form-input"
              placeholder="请输入车辆品牌"
              value={formData.brand}
              onInput={(e) => handleInputChange('brand', e.detail.value)}
            />
          </View>

          <View className="form-item">
            <Text className="form-label">车辆型号</Text>
            <Input
              className="form-input"
              placeholder="请输入车辆型号"
              value={formData.model}
              onInput={(e) => handleInputChange('model', e.detail.value)}
            />
          </View>

          <View className="form-item">
            <Text className="form-label">车辆颜色</Text>
            <Input
              className="form-input"
              placeholder="请输入车辆颜色"
              value={formData.color}
              onInput={(e) => handleInputChange('color', e.detail.value)}
            />
          </View>

          <View className="form-item">
            <Text className="form-label">车辆年份</Text>
            <Picker 
              mode="selector" 
              range={yearOptions}
              onChange={handleYearChange}
            >
              <View className="picker-selector">
                {formData.year}
              </View>
            </Picker>
          </View>

          <View className="form-item">
            <Text className="form-label">行驶证图片</Text>
            <View className="image-upload" onClick={chooseRegistrationImage}>
              {formData.registration_image ? (
                <Image
                  src={formData.registration_image}
                  className="uploaded-image"
                  mode="aspectFit"
                />
              ) : (
                <View className="upload-placeholder">
                  <Text className="upload-text">点击上传行驶证图片</Text>
                  <Text className="upload-tip">请确保图片清晰可见</Text>
                </View>
              )}
            </View>
          </View>

          <View className="form-item">
            <Text className="form-label">保险到期时间</Text>
            <Picker 
              mode="date" 
              onChange={handleInsuranceExpiryChange}
              value={formData.insurance_expiry}
            >
              <View className="picker-selector">
                {formData.insurance_expiry || '请选择保险到期时间'}
              </View>
            </Picker>
          </View>

          <Button
            className="submit-btn"
            loading={loading || uploading}
            onClick={handleSubmit}
            disabled={uploading}
          >
            {uploading ? '上传中...' : loading ? '提交中...' : (isEditMode ? '更新并提交审核' : '提交审核')}
          </Button>
        </View>
      </View>
    </View>
  )
}

export default VehicleAdd
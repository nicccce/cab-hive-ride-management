import React, { useState } from 'react'
import { View } from '@tarojs/components'
import { Button, Field, Cell, CellGroup, Toast, Uploader } from 'taroify'
import { useDispatch } from 'react-redux'
import Taro from '@tarojs/taro'
import { registerDriver } from '@/store/slices/driverSlice'
import { chooseImage, imageToBase64 } from '@/utils'
import type { AppDispatch } from '@/store'
import './index.scss'

const DriverRegisterPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license_number: '',
    license_image: ''
  })
  const [loading, setLoading] = useState(false)

  // 处理表单输入
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 选择驾照图片
  const handleChooseImage = async () => {
    try {
      const imagePath = await chooseImage()
      const base64Image = await imageToBase64(imagePath)
      setFormData(prev => ({
        ...prev,
        license_image: base64Image
      }))
      Toast.open('图片上传成功')
    } catch (error) {
      Toast.open('图片上传失败')
    }
  }

  // 提交注册
  const handleSubmit = async () => {
    // 表单验证
    if (!formData.name.trim()) {
      Toast.open('请输入姓名')
      return
    }
    if (!formData.phone.trim()) {
      Toast.open('请输入手机号')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      Toast.open('请输入正确的手机号')
      return
    }
    if (!formData.license_number.trim()) {
      Toast.open('请输入驾照编号')
      return
    }
    if (!formData.license_image) {
      Toast.open('请上传驾照图片')
      return
    }

    try {
      setLoading(true)
      await dispatch(registerDriver({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        license_number: formData.license_number.trim(),
        license_image: formData.license_image
      })).unwrap()

      Toast.open('注册申请提交成功')
      
      // 延迟返回上一页
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
      
    } catch (error: any) {
      Toast.open(error.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="driver-register-page">
      <View className="page-header">
        <View className="page-title">司机注册</View>
        <View className="page-subtitle">成为智蜂出行认证司机</View>
      </View>

      <View className="page-content">
        <CellGroup className="form-group" title="基本信息">
          <Cell title="真实姓名">
            <Field
              value={formData.name}
              placeholder="请输入真实姓名"
              onChange={(value) => handleFieldChange('name', value)}
            />
          </Cell>
          <Cell title="手机号码">
            <Field
              value={formData.phone}
              placeholder="请输入手机号码"
              type="tel"
              onChange={(value) => handleFieldChange('phone', value)}
            />
          </Cell>
          <Cell title="驾照编号">
            <Field
              value={formData.license_number}
              placeholder="请输入驾照编号"
              onChange={(value) => handleFieldChange('license_number', value)}
            />
          </Cell>
        </CellGroup>

        <CellGroup className="form-group" title="驾照信息">
          <Cell title="驾照照片" rightIcon={false}>
            <View className="upload-section">
              {formData.license_image ? (
                <View className="uploaded-image">
                  <View className="image-preview" onClick={handleChooseImage}>
                    已上传，点击重新选择
                  </View>
                </View>
              ) : (
                <Button className="upload-btn" onClick={handleChooseImage}>
                  点击上传驾照照片
                </Button>
              )}
            </View>
          </Cell>
        </CellGroup>

        <View className="submit-section">
          <Button
            className="submit-btn"
            loading={loading}
            onClick={handleSubmit}
          >
            提交注册申请
          </Button>
          
          <View className="tips">
            <View className="tips-title">注册须知：</View>
            <View className="tips-content">
              1. 请确保提供的信息真实有效
              <br />
              2. 驾照照片需清晰可见所有信息
              <br />
              3. 审核时间通常为24小时内
              <br />
              4. 如有疑问请联系客服
            </View>
          </View>
        </View>
      </View>

      <Toast />
    </View>
  )
}

export default DriverRegisterPage
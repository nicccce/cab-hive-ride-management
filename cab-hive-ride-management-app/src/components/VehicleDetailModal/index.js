import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import PropTypes from 'prop-types'
import { getVehicleDetail, deleteVehicle } from '../../services/vehicle'
import './index.scss'

const VehicleDetailModal = ({ vehicleId, isOpen, onClose }) => {
  const [vehicle, setVehicle] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && vehicleId) {
      fetchVehicleDetail()
    } else {
      setVehicle(null)
    }
  }, [isOpen, vehicleId])

  const fetchVehicleDetail = async () => {
    try {
      setLoading(true)
      const result = await getVehicleDetail(vehicleId)
      if (result.success && result.data) {
        setVehicle(result.data)
      }
    } catch (error) {
      console.error('获取车辆详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !vehicleId) return null
  if (loading) return (
    <View className="modal-overlay" onClick={onClose}>
      <View className="modal-content">
        <View className="modal-body">
          <View className="loading">加载中...</View>
        </View>
      </View>
    </View>
  )

  if (!vehicle) return null

  // 根据审核状态显示不同颜色的状态标签
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved':
        return 'status-badge status-approved'
      case 'rejected':
        return 'status-badge status-rejected'
      default:
        return 'status-badge status-pending'
    }
  }

  // 根据审核状态显示中文标签
  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return '已通过'
      case 'rejected':
        return '已拒绝'
      default:
        return '待审核'
    }
  }

  // 格式化日期显示
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <View className="modal-overlay" onClick={onClose}>
      <View className="modal-content" onClick={(e) => e.stopPropagation()}>
        <View className="modal-header">
          <Text className="modal-title">车辆详情</Text>
          <View className="close-btn" onClick={onClose}>×</View>
        </View>
        
        <View className="modal-body">
          <View className="detail-item">
            <Text className="detail-label">车牌号码</Text>
            <Text className="detail-value plate-number">{vehicle.plate_number}</Text>
          </View>
          
          <View className="detail-item">
            <Text className="detail-label">车辆状态</Text>
            <Text className={getStatusBadgeClass(vehicle.status)}>
              {getStatusText(vehicle.status)}
            </Text>
          </View>
          
          <View className="detail-item">
            <Text className="detail-label">车辆类型</Text>
            <Text className="detail-value">{vehicle.vehicle_type}</Text>
          </View>
          
          <View className="detail-item">
            <Text className="detail-label">车辆品牌</Text>
            <Text className="detail-value">{vehicle.brand}</Text>
          </View>
          
          <View className="detail-item">
            <Text className="detail-label">车辆型号</Text>
            <Text className="detail-value">{vehicle.model}</Text>
          </View>
          
          <View className="detail-item">
            <Text className="detail-label">车辆颜色</Text>
            <Text className="detail-value">{vehicle.color}</Text>
          </View>
          
          <View className="detail-item">
            <Text className="detail-label">车辆年份</Text>
            <Text className="detail-value">{vehicle.year}</Text>
          </View>
          
          <View className="detail-item">
            <Text className="detail-label">保险到期时间</Text>
            <Text className="detail-value">{formatDate(vehicle.insurance_expiry)}</Text>
          </View>
          
          {vehicle.comment && (
            <View className="detail-item">
              <Text className="detail-label">审核备注</Text>
              <Text className="detail-value comment">{vehicle.comment}</Text>
            </View>
          )}
        </View>
        
        <View className="modal-footer">
          <View
            className="btn btn-secondary"
            onClick={() => {
              onClose();
              // 跳转到车辆编辑页面（复用添加页面）
              Taro.navigateTo({
                url: `/pages/vehicle-add/index?id=${vehicleId}`
              });
            }}
          >
            修改
          </View>
          <View
            className="btn btn-danger"
            onClick={async () => {
              try {
                await deleteVehicle(vehicleId);
                Taro.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                onClose();
              } catch (error) {
                Taro.showToast({
                  title: '删除失败',
                  icon: 'error'
                });
                console.error('删除车辆失败:', error);
              }
            }}
          >
            删除
          </View>
          <View className="btn btn-primary" onClick={onClose}>关闭</View>
        </View>
      </View>
    </View>
  )
}

VehicleDetailModal.propTypes = {
  vehicleId: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
}

export default VehicleDetailModal
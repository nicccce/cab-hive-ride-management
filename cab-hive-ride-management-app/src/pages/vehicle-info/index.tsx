import React, { useEffect } from 'react'
import { View } from '@tarojs/components'
import { Cell, CellGroup, Loading, Button } from 'taroify'
import { useSelector, useDispatch } from 'react-redux'
import { getVehicles } from '@/store/slices/vehicleSlice'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import type { RootState, AppDispatch } from '@/store'
import './index.scss'

const VehicleInfoPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { vehicles, loading, error } = useSelector((state: RootState) => state.vehicle)

  useEffect(() => {
    dispatch(getVehicles())
  }, [dispatch])

  if (loading) {
    return (
      <View className="vehicle-info-page">
        <View className="loading-container">
          <Loading size="24px" />
          <View className="loading-text">加载中...</View>
        </View>
      </View>
    )
  }

  return (
    <View className="vehicle-info-page">
      <View className="page-header">
        <View className="page-title">车辆管理</View>
        <View className="page-subtitle">我的车辆信息</View>
      </View>

      <View className="page-content">
        {vehicles.length === 0 ? (
          <EmptyState 
            title="暂无车辆信息"
            description="您还没有添加车辆信息"
          >
            <Button className="add-vehicle-btn">
              添加车辆
            </Button>
          </EmptyState>
        ) : (
          <View className="vehicle-list">
            {vehicles.map((vehicle) => (
              <CellGroup key={vehicle.id} className="vehicle-card" title={`车辆信息 - ${vehicle.plate_number}`}>
                <Cell 
                  title="审核状态" 
                  value={<StatusBadge status={vehicle.status} />}
                />
                <Cell title="车牌号码" value={vehicle.plate_number} />
                <Cell title="车辆类型" value={vehicle.vehicle_type} />
                <Cell title="品牌型号" value={`${vehicle.brand} ${vehicle.model_name || vehicle.model || ''}`} />
                {vehicle.color && (
                  <Cell title="车辆颜色" value={vehicle.color} />
                )}
                {vehicle.year && (
                  <Cell title="出厂年份" value={`${vehicle.year}年`} />
                )}
                <Cell 
                  title="提交时间" 
                  value={new Date(vehicle.submit_time).toLocaleDateString()} 
                />
                {vehicle.review_time && (
                  <Cell 
                    title="审核时间" 
                    value={new Date(vehicle.review_time).toLocaleDateString()} 
                  />
                )}
                {vehicle.comment && (
                  <Cell 
                    title="审核意见"
                    value={vehicle.comment}
                    className="comment-cell"
                  />
                )}
              </CellGroup>
            ))}
          </View>
        )}

        <View className="add-section">
          <Button className="add-btn">
            添加新车辆
          </Button>
        </View>
      </View>
    </View>
  )
}

export default VehicleInfoPage
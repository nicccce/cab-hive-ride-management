import React, { useEffect } from 'react'
import { View } from '@tarojs/components'
import { Cell, CellGroup, Loading } from 'taroify'
import { useSelector, useDispatch } from 'react-redux'
import { getDriverInfo } from '@/store/slices/driverSlice'
import { maskPhone } from '@/utils'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import type { RootState, AppDispatch } from '@/store'
import './index.scss'

const DriverInfoPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { driverInfo, loading, error } = useSelector((state: RootState) => state.driver)

  useEffect(() => {
    dispatch(getDriverInfo())
  }, [dispatch])

  if (loading) {
    return (
      <View className="driver-info-page">
        <View className="loading-container">
          <Loading size="24px" />
          <View className="loading-text">加载中...</View>
        </View>
      </View>
    )
  }

  if (error || !driverInfo) {
    return (
      <View className="driver-info-page">
        <EmptyState 
          title="暂无司机信息"
          description="您还没有注册成为司机"
        />
      </View>
    )
  }

  return (
    <View className="driver-info-page">
      <View className="page-header">
        <View className="page-title">司机信息</View>
        <View className="page-subtitle">我的认证信息</View>
      </View>

      <View className="page-content">
        {/* 认证状态 */}
        <CellGroup className="status-group" title="认证状态">
          <Cell 
            title="审核状态" 
            value={<StatusBadge status={driverInfo.status} />}
          />
          {driverInfo.comment && (
            <Cell 
              title="审核意见"
              value={driverInfo.comment}
              className="comment-cell"
            />
          )}
        </CellGroup>

        {/* 基本信息 */}
        <CellGroup className="info-group" title="基本信息">
          <Cell title="真实姓名" value={driverInfo.name} />
          <Cell title="手机号码" value={maskPhone(driverInfo.phone)} />
          <Cell title="驾照编号" value={driverInfo.license_number} />
        </CellGroup>

        {/* 时间信息 */}
        <CellGroup className="time-group" title="时间信息">
          <Cell 
            title="提交时间" 
            value={new Date(driverInfo.submit_time).toLocaleString()} 
          />
          {driverInfo.review_time && (
            <Cell 
              title="审核时间" 
              value={new Date(driverInfo.review_time).toLocaleString()} 
            />
          )}
        </CellGroup>

        {/* 驾照图片 */}
        {driverInfo.license_image_url && (
          <CellGroup className="image-group" title="驾照照片">
            <Cell title="">
              <View className="license-image-container">
                <image 
                  className="license-image"
                  src={driverInfo.license_image_url}
                  mode="aspectFit"
                />
              </View>
            </Cell>
          </CellGroup>
        )}
      </View>
    </View>
  )
}

export default DriverInfoPage
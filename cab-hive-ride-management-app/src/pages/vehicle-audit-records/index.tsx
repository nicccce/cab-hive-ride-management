import React, { useEffect } from 'react'
import { View } from '@tarojs/components'
import { Cell, CellGroup, Loading } from 'taroify'
import { useSelector, useDispatch } from 'react-redux'
import { getVehicleAuditRecords } from '@/store/slices/vehicleSlice'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { formatDate } from '@/utils'
import type { RootState, AppDispatch } from '@/store'
import './index.scss'

const VehicleAuditRecordsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { auditRecords, loading, error } = useSelector((state: RootState) => state.vehicle)

  useEffect(() => {
    dispatch(getVehicleAuditRecords())
  }, [dispatch])

  if (loading) {
    return (
      <View className="vehicle-audit-records-page">
        <View className="loading-container">
          <Loading size="24px" />
          <View className="loading-text">加载中...</View>
        </View>
      </View>
    )
  }

  return (
    <View className="vehicle-audit-records-page">
      <View className="page-header">
        <View className="page-title">车辆审核记录</View>
        <View className="page-subtitle">查看车辆申请记录</View>
      </View>

      <View className="page-content">
        {auditRecords.length === 0 ? (
          <EmptyState 
            title="暂无审核记录"
            description="您还没有提交过车辆认证申请"
          />
        ) : (
          <View className="records-list">
            {auditRecords.map((record) => (
              <CellGroup key={record.id} className="record-card" title={`车辆申请 #${record.id}`}>
                <Cell 
                  title="审核状态" 
                  value={<StatusBadge status={record.status} />}
                />
                <Cell title="车牌号码" value={record.plate_number} />
                <Cell title="车辆类型" value={record.vehicle_type} />
                <Cell title="品牌型号" value={`${record.brand} ${record.model_name || ''}`} />
                {record.color && (
                  <Cell title="车辆颜色" value={record.color} />
                )}
                {record.year && (
                  <Cell title="出厂年份" value={`${record.year}年`} />
                )}
                <Cell 
                  title="提交时间" 
                  value={formatDate(record.submit_time)} 
                />
                {record.review_time && (
                  <Cell 
                    title="审核时间" 
                    value={formatDate(record.review_time)} 
                  />
                )}
                {record.comment && (
                  <Cell 
                    title="审核意见"
                    value={record.comment}
                    className="comment-cell"
                  />
                )}
                {record.insurance_expiry && (
                  <Cell 
                    title="保险到期" 
                    value={new Date(record.insurance_expiry).toLocaleDateString()} 
                  />
                )}
              </CellGroup>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

export default VehicleAuditRecordsPage
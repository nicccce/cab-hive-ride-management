import React, { useEffect } from 'react'
import { View } from '@tarojs/components'
import { Cell, CellGroup, Loading } from 'taroify'
import { useSelector, useDispatch } from 'react-redux'
import { getDriverAuditRecords } from '@/store/slices/driverSlice'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { formatDate, maskPhone } from '@/utils'
import type { RootState, AppDispatch } from '@/store'
import './index.scss'

const AuditRecordsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { auditRecords, loading, error } = useSelector((state: RootState) => state.driver)

  useEffect(() => {
    dispatch(getDriverAuditRecords())
  }, [dispatch])

  if (loading) {
    return (
      <View className="audit-records-page">
        <View className="loading-container">
          <Loading size="24px" />
          <View className="loading-text">加载中...</View>
        </View>
      </View>
    )
  }

  return (
    <View className="audit-records-page">
      <View className="page-header">
        <View className="page-title">司机审核记录</View>
        <View className="page-subtitle">查看历史申请记录</View>
      </View>

      <View className="page-content">
        {auditRecords.length === 0 ? (
          <EmptyState 
            title="暂无审核记录"
            description="您还没有提交过司机认证申请"
          />
        ) : (
          <View className="records-list">
            {auditRecords.map((record) => (
              <CellGroup key={record.id} className="record-card" title={`申请记录 #${record.id}`}>
                <Cell 
                  title="审核状态" 
                  value={<StatusBadge status={record.status} />}
                />
                <Cell title="申请姓名" value={record.name} />
                <Cell title="手机号码" value={maskPhone(record.phone)} />
                <Cell title="驾照编号" value={record.license_number} />
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
              </CellGroup>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

export default AuditRecordsPage
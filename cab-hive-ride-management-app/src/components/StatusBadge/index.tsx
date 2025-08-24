import React from 'react'
import { View } from '@tarojs/components'
import { AUDIT_STATUS_TEXT } from '@/constants'
import type { AuditStatus } from '@/types'
import './index.scss'

interface StatusBadgeProps {
  status: AuditStatus
  size?: 'small' | 'medium' | 'large'
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const statusClass = `status-badge status-${status} size-${size}`
  const statusText = AUDIT_STATUS_TEXT[status] || status

  return (
    <View className={statusClass}>
      {statusText}
    </View>
  )
}

export default StatusBadge
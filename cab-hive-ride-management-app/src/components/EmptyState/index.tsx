import React from 'react'
import { View, Image } from '@tarojs/components'
import './index.scss'

interface EmptyStateProps {
  title?: string
  description?: string
  image?: string
  children?: React.ReactNode
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = '暂无数据',
  description,
  image = 'https://images.pexels.com/photos/2882552/pexels-photo-2882552.jpeg?auto=compress&cs=tinysrgb&w=400',
  children
}) => {
  return (
    <View className="empty-state">
      <Image className="empty-image" src={image} mode="aspectFit" />
      <View className="empty-title">{title}</View>
      {description && (
        <View className="empty-description">{description}</View>
      )}
      {children && (
        <View className="empty-actions">{children}</View>
      )}
    </View>
  )
}

export default EmptyState
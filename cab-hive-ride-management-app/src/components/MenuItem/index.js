import { View, Text } from '@tarojs/components'
import { ArrowRight } from '@taroify/icons'
import './index.scss'

const MenuItem = ({ 
  icon, 
  title, 
  subtitle, 
  badge, 
  arrow = true, 
  onClick, 
  className = '' 
}) => {
  return (
    <View 
      className={`menu-item ${className}`}
      onClick={onClick}
    >
      <View className="menu-item-content">
        {icon && (
          <View className="menu-item-icon">
            {icon}
          </View>
        )}
        
        <View className="menu-item-info">
          <View className="menu-item-title">
            {title}
            {badge && (
              <View className="menu-item-badge">
                {badge}
              </View>
            )}
          </View>
          {subtitle && (
            <View className="menu-item-subtitle">
              {subtitle}
            </View>
          )}
        </View>
      </View>
      
      {arrow && (
        <View className="menu-item-arrow">
          <ArrowRight size="16" color="#9ca3af" />
        </View>
      )}
    </View>
  )
}

export default MenuItem
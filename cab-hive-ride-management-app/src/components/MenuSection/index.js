import { View } from '@tarojs/components'
import './index.scss'

const MenuSection = ({ title, children }) => {
  return (
    <View className="menu-section">
      {title && (
        <View className="menu-section-title">
          {title}
        </View>
      )}
      <View className="menu-section-content">
        {children}
      </View>
    </View>
  )
}

export default MenuSection
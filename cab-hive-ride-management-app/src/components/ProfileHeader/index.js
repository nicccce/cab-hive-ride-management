import { View, Image } from '@tarojs/components'
import { ArrowRight } from '@taroify/icons'
import './index.scss'

const ProfileHeader = ({ userInfo, onEditProfile, isLoggedIn }) => {
  const defaultAvatar = 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=150'

  return (
    <View className="profile-header" onClick={onEditProfile}>
      <View className="profile-avatar">
        <Image
          src={userInfo?.avatar_url || defaultAvatar}
          className="avatar-img"
          mode="aspectFill"
        />
      </View>
      
      <View className="profile-info">
        <View className="profile-name">
          {isLoggedIn ? (userInfo?.nick_name || '未设置昵称') : '点击登录'}
        </View>
        <View className="profile-subtitle">
          {isLoggedIn ? '编辑个人资料' : '登录享受完整服务'}
        </View>
      </View>
      
      <View className="profile-arrow">
        <ArrowRight size="20" color="#9ca3af" />
      </View>
    </View>
  )
}

export default ProfileHeader
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { USER_ROLES } from '@/constants'

export const useAuth = () => {
  const { userInfo, isLoggedIn, loading } = useSelector((state: RootState) => state.user)
  
  const isDriver = userInfo?.role_id === USER_ROLES.DRIVER
  const isAdmin = userInfo?.role_id === USER_ROLES.ADMIN
  const isBanned = userInfo?.is_banned || false
  
  return {
    userInfo,
    isLoggedIn,
    loading,
    isDriver,
    isAdmin,
    isBanned,
    canAccessDriverFeatures: isDriver && !isBanned
  }
}
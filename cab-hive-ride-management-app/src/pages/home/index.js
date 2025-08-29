import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import useAuth from '../../hooks/useAuth'
import PassengerHome from './PassengerHome'
import DriverHome from './DriverHome'

const Home = () => {
  const { isDriver, isBanned } = useAuth()

  useEffect(() => {
    // 根据用户角色设置页面标题
    const title = (isDriver && !isBanned) ? '司机工作台' : '智蜂出行'
    Taro.setNavigationBarTitle({ title })
  }, [isDriver, isBanned])

  // 司机工作台页面
  if (isDriver && !isBanned) {
    return <DriverHome />
  }

  // 普通用户首页（打车页面）
  return <PassengerHome />
}

export default Home
import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import useAuth from '../../hooks/useAuth'
import './index.scss'
import PassengerHome from '../home/PassengerHome'

const Booking = () => {
  const {  } = useAuth()

  useEffect(() => {
    // 根据用户角色设置页面标题
    const title = '智蜂出行'
    Taro.setNavigationBarTitle({ title })
  })

  return <PassengerHome />
}

export default Booking
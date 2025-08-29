import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'
import useAuth from '../../hooks/useAuth'

const Home = () => {
  const { isDriver, isBanned } = useAuth()
  const [Component, setComponent] = useState(null)

  useEffect(() => {
    // 根据用户角色设置页面标题
    const title = (isDriver && !isBanned) ? '司机工作台' : '智蜂出行'
    Taro.setNavigationBarTitle({ title })
  }, [isDriver, isBanned])

  useEffect(() => {
    // 动态导入组件
    const loadComponent = async () => {
      if (isDriver && !isBanned) {
        const { default: DriverHome } = await import('./DriverHome')
        setComponent(() => DriverHome)
      } else {
        const { default: PassengerHome } = await import('./PassengerHome')
        setComponent(() => PassengerHome)
      }
    }

    loadComponent()
  }, [isDriver, isBanned])

  // 显示加载状态或组件
  if (!Component) {
    return null
  }

  const ComponentToRender = Component
  return <ComponentToRender />
}

export default Home
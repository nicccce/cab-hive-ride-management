import { Component, PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { ConfigProvider } from 'taroify'
import { useLaunch } from '@tarojs/taro'
import { store } from '@/store'
import { getUserProfile } from '@/store/slices/userSlice'
import { setTabBarVisibility } from '@/utils/tabbar'

import './app.scss'
import 'taroify/dist/index.css'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')
    
    // 初始化用户信息
    const token = wx.getStorageSync('token')
    if (token) {
      store.dispatch(getUserProfile())
    }
    
    // 初始化TabBar显示状态
    setTabBarVisibility()
  })

  return (
    <Provider store={store}>
      <ConfigProvider>
        {children}
      </ConfigProvider>
    </Provider>
  )
}

export default App
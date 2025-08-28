import Taro from '@tarojs/taro'
import { WebView } from '@tarojs/components'
import { useEffect, useState } from 'react'

export default function PayPage() {
  const [payUrl, setPayUrl] = useState('')
  
  useEffect(() => {
    const eventChannel = Taro.getCurrentInstance().page?.getOpenerEventChannel()
    
    eventChannel?.on('acceptDataFromOpenerPage', (data) => {
      setPayUrl(data.payUrl)
    })
    
    // 或者从路由参数获取
    const params = Taro.getCurrentInstance().router?.params
    if (params?.payUrl) {
      setPayUrl(decodeURIComponent(params.payUrl))
    }
  }, [])
  
  return (
    <WebView src={payUrl} />
  )
}
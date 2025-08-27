import Taro from '@tarojs/taro'
import { LBS_CONFIG } from '../config/api'

const chooseLocation = requirePlugin('chooseLocation')

// 导航到位置选择插件
export const navigateToLocationPlugin = async (options = {}) => {
  const { key, referer, category } = LBS_CONFIG

  let url = `plugin://chooseLocation/index?key=${key}&referer=${referer}`

  if (options.location) {
    const locationStr = JSON.stringify(options.location)
    url += `&location=${locationStr}`
  }

  if (category) {
    url += `&category=${category}`
  }

  try {
    await Taro.navigateTo({ url })
  } catch (error) {
    console.error('打开位置选择插件失败：', error)
    Taro.showToast({
      title: '打开地图失败',
      icon: 'none'
    })
  }
}

// 获取选点结果
export const getLocationResult = () => {
  return chooseLocation.getLocation()
}

// 清除选点数据
export const clearLocationData = () => {
  chooseLocation.setLocation(null)
}

// 创建地图标记
export const createMapMarker = (location, title = '位置', iconPath = null) => {
  return {
    id: Date.now(),
    latitude: location.latitude,
    longitude: location.longitude,
    title: title,
    iconPath: iconPath || '/assets/images/location-marker.png',
    width: 30,
    height: 30,
    callout: {
      content: title,
      color: '#000',
      fontSize: 14,
      borderRadius: 4,
      padding: 8,
      display: 'ALWAYS'
    }
  }
}
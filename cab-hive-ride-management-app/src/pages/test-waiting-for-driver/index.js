import { Component } from 'react'
import { View } from '@tarojs/components'
import WaitingForDriver from '../../components/WaitingForDriver'
import './index.scss'

export default class TestWaitingForDriver extends Component {
  render () {
    // 模拟订单信息
    const mockOrderInfo = {
      id: "123456",
      start_location: {
        latitude: 30.2742,
        longitude: 120.1551,
        name: "杭州市西湖区"
      },
      end_location: {
        latitude: 30.2542,
        longitude: 120.1351,
        name: "杭州市滨江区"
      },
      distance: 5000,
      duration: 30,
      toll: 10,
      points: [
        { latitude: 30.2742, longitude: 120.1551 },
        { latitude: 30.2642, longitude: 120.1451 },
        { latitude: 30.2542, longitude: 120.1351 }
      ]
    };

    return (
      <View>
        <WaitingForDriver orderInfo={mockOrderInfo} />
      </View>
    )
  }
}
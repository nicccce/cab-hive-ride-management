import Taro from '@tarojs/taro'
import { View, Button, Input, Text } from '@tarojs/components'
import { useState } from 'react'

export default function PaymentPage() {
  const [orderId, setOrderId] = useState('')
  const [amount, setAmount] = useState('')
  const [subject, setSubject] = useState('')
  const [userId, setUserId] = useState('')

  async function handlePayment() {
    if (!orderId || !amount || !subject || !userId) {
      Taro.showToast({
        title: '请填写所有字段',
        icon: 'none'
      })
      return
    }

    try {
      // 调用后端接口创建支付
      const response = await Taro.request({
        url: 'http://localhost:8080/api/payment/create', // 请根据实际情况修改API地址
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          // 如果需要认证，请添加相应的认证头
          // 'Authorization': 'Bearer your_token_here'
        },
        data: {
          order_id: orderId,
          amount: parseFloat(amount),
          subject: subject,
          user_id: userId
        }
      })

      if (response.statusCode === 200 && response.data.code === 0) {
        // 跳转到支付页面
        Taro.navigateTo({
          url: `/pages/pay/index?payUrl=${encodeURIComponent(response.data.data.pay_url)}`,
          events: {
            acceptDataFromOpenedPage: (data) => {
              console.log('支付页面返回数据:', data)
            }
          },
          success: (res) => {
            // 也可以通过 eventChannel 传递数据
            res.eventChannel.emit('acceptDataFromOpenerPage', {
              payUrl: response.data.data.pay_url
            })
          }
        })
      } else {
        Taro.showToast({
          title: response.data.message || '支付发起失败',
          icon: 'none'
        })
      }
    } catch (error) {
      Taro.showToast({
        title: '支付发起失败',
        icon: 'none'
      })
      console.error('支付错误:', error)
    }
  }

  return (
    <View style={{ padding: '20px' }}>
      <Text style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>
        支付宝支付示例
      </Text>
      
      <View style={{ marginBottom: '15px' }}>
        <Text style={{ marginBottom: '5px' }}>订单ID:</Text>
        <Input
          type='text'
          placeholder='请输入订单ID'
          value={orderId}
          onInput={(e) => setOrderId(e.detail.value)}
        />
      </View>
      
      <View style={{ marginBottom: '15px' }}>
        <Text style={{ marginBottom: '5px' }}>金额:</Text>
        <Input
          type='digit'
          placeholder='请输入金额'
          value={amount}
          onInput={(e) => setAmount(e.detail.value)}
        />
      </View>
      
      <View style={{ marginBottom: '15px' }}>
        <Text style={{ marginBottom: '5px' }}>商品名称:</Text>
        <Input
          type='text'
          placeholder='请输入商品名称'
          value={subject}
          onInput={(e) => setSubject(e.detail.value)}
        />
      </View>
      
      <View style={{ marginBottom: '15px' }}>
        <Text style={{ marginBottom: '5px' }}>用户ID:</Text>
        <Input
          type='text'
          placeholder='请输入用户ID'
          value={userId}
          onInput={(e) => setUserId(e.detail.value)}
        />
      </View>
      
      <Button 
        type='primary' 
        onClick={handlePayment}
        style={{ marginTop: '20px' }}
      >
        发起支付
      </Button>
    </View>
  )
}
# 支付宝支付模块使用说明

## 概述

本模块实现了基于Taro框架和Go语言后端的支付宝支付解决方案。通过该模块，用户可以在小程序中完成订单支付流程。

## 功能特性

1. 创建支付宝手机网站支付订单
2. 处理支付宝异步通知回调
3. 处理支付宝同步返回
4. 查询订单支付状态
5. 自动更新订单状态和支付时间

## 配置说明

### 1. 配置文件设置

在 `config.yaml` 文件中添加支付宝相关配置：

```yaml
alipay:
  app_id: "你的支付宝应用ID"
  private_key: "你的应用私钥"
  public_key: "支付宝公钥"
  notify_url: "http://your-domain.com/api/payment/notify"
  return_url: "http://your-domain.com/api/payment/return"
  server_url: "https://openapi.alipay.com/gateway.do"  # 生产环境
  # server_url: "https://openapi.alipaydev.com/gateway.do"  # 沙箱环境
  seller_id: "收款支付宝用户ID"
  is_production: true  # true为生产环境，false为沙箱环境
```

### 2. 环境变量设置（可选）

也可以通过环境变量进行配置：

```bash
ALIPAY_APP_ID=你的支付宝应用ID
ALIPAY_PRIVATE_KEY=你的应用私钥
ALIPAY_PUBLIC_KEY=支付宝公钥
ALIPAY_NOTIFY_URL=http://your-domain.com/api/payment/notify
ALIPAY_RETURN_URL=http://your-domain.com/api/payment/return
ALIPAY_SERVER_URL=https://openapi.alipay.com/gateway.do
ALIPAY_SELLER_ID=收款支付宝用户ID
ALIPAY_IS_PRODUCTION=true
```

## API接口说明

### 1. 创建支付订单

**接口地址**: `POST /api/payment/create`

**请求参数**:
```json
{
  "order_id": "订单ID",
  "amount": 100.00,     // 支付金额
  "subject": "商品名称", // 商品标题
  "user_id": "用户ID"    // 用户标识
}
```

**响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "pay_url": "https://openapi.alipay.com/gateway.do?..."
  }
}
```

### 2. 查询订单支付状态

**接口地址**: `POST /api/payment/query`

**请求参数**:
```json
{
  "order_id": "订单ID"
}
```

**响应示例**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "trade_status": "TRADE_SUCCESS",
    "trade_no": "支付宝交易号"
  }
}
```

### 3. 支付宝异步通知回调

**接口地址**: `POST /api/payment/notify`

**说明**: 支付宝服务器会向此接口发送支付结果通知，服务端会自动处理并更新订单状态。

### 4. 支付宝同步返回

**接口地址**: `GET /api/payment/return`

**说明**: 用户支付完成后，支付宝会跳转到此页面，显示支付结果。

## 前端使用示例

### 1. 发起支付页面

```tsx
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
          url: `/pages/pay/index?payUrl=${encodeURIComponent(response.data.data.pay_url)}`
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

  // ... JSX渲染代码
}
```

### 2. 支付页面组件

```tsx
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
```

## 订单状态说明

支付流程中订单状态的变化：

1. 用户创建订单后，订单状态为 `waiting_for_driver`（等待司机接单）
2. 用户发起支付时，订单状态变为 `waiting_for_payment`（等待付款）
3. 用户完成支付后，订单状态变为 `waiting_for_pickup`（等待司机到达起点）

## 注意事项

1. 确保支付宝配置信息正确无误
2. 在生产环境中，确保 `notify_url` 和 `return_url` 是公网可访问的地址
3. 异步通知回调接口需要能处理支付宝服务器的请求
4. 建议在沙箱环境中充分测试后再上线
5. 注意保护私钥安全，不要泄露给他人

## 错误处理

- 如果创建支付链接失败，系统会返回相应的错误信息
- 如果支付宝回调处理失败，系统会记录日志并返回失败状态
- 前端应根据返回的错误信息进行相应的用户提示

## 日志记录

所有支付相关操作都会记录在系统日志中，便于排查问题和审计。

## 优化说明

支付宝模块已经过优化，采用单例模式管理支付宝客户端实例，避免了在每个请求中重复创建客户端实例，提高了性能和资源利用率。
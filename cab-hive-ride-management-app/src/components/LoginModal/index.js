import { useState } from 'react'
import { View, Button, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Popup } from '@taroify/core'
import { wechatLogin } from '../../services/auth'
import './index.scss'

const LoginModal = ({ visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)

  // 微信登录
  const handleWechatLogin = async (userInfoRes) => {
    try {
      setLoading(true)
      
      // 获取微信登录凭证
      const loginRes = await Taro.login()
      
      if (!loginRes.code) {
        Taro.showToast({
          title: '获取登录凭证失败',
          icon: 'error'
        })
        return
      }

      // 调用登录接口
      const result = await wechatLogin({
        code: loginRes.code,
        encryptedData: userInfoRes.encryptedData,
        iv: userInfoRes.iv
      })

      if (result.success) {
        // 调试日志，查看实际的响应数据结构
        console.log('Login response data:', result.data)
        
        // 保存用户信息和 token
        Taro.setStorageSync('token', result.data.token)
        Taro.setStorageSync('userInfo', result.data.user_info)
        
        Taro.showToast({
          title: '登录成功',
          icon: 'success'
        })

        if (onSuccess) {
          onSuccess(result.data.user_info)
        }
        
        onClose()
      }
    } catch (error) {
      console.error('Login failed:', error)
      Taro.showToast({
          title: '登录失败',
          icon: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  // 处理微信登录按钮点击事件
  const handleWechatLoginClick = () => {
    // 获取用户信息授权（必须在用户点击事件中直接调用）
    Taro.getUserProfile({
      desc: '用于完善用户资料',
      success: (userInfoRes) => {
        // 用户同意授权后，执行登录逻辑
        handleWechatLogin(userInfoRes)
      },
      fail: (error) => {
        console.error('用户拒绝授权:', error)
        Taro.showToast({
          title: '需要授权才能登录',
          icon: 'none'
        })
      }
    })
  }

  // 显示用户服务协议
  const showUserAgreement = () => {
    Taro.showModal({
      title: '用户服务协议',
      content: `一、协议的确认与接纳
1. 智蜂出行（以下简称"本网站"）各项服务的所有权和运作权归本公司所有。
2. 用户在使用本网站服务时，必须遵守中华人民共和国相关法律法规，不得利用本站危害国家、社会安全或干扰网络秩序。
3. 用户应当同意本协议条款并按照页面提示完成全部注册程序，方可成为正式用户。

二、用户信息
1. 用户在注册时应提供真实、准确、完整的个人资料，并及时更新注册资料。
2. 本网站有权审查用户注册信息，并根据实际情况决定是否同意用户注册申请。
3. 用户应妥善保管账户密码，因密码泄露造成的损失由用户自行承担。

三、服务条款
1. 本网站仅提供出行信息服务，不涉及实际车辆运营。
2. 用户在使用服务时应遵守交通法规，文明出行。
3. 本网站有权根据业务发展需要修改服务条款，修改后会及时公布。

四、免责声明
1. 因不可抗力导致服务中断，本网站不承担责任。
2. 用户使用第三方服务时产生的纠纷，本网站不承担责任。
3. 用户应自行承担使用服务的风险。`,
      showCancel: false,
      confirmText: '关闭'
    })
  }

  // 显示隐私政策
  const showPrivacyPolicy = () => {
    Taro.showModal({
      title: '隐私政策',
      content: `一、信息收集
1. 我们收集您在注册和使用服务时主动提供的信息，包括但不限于姓名、手机号码、位置信息等。
2. 为提供更好的服务，我们会收集您使用我们服务时的设备信息、日志信息等。
3. 我们不会收集法律法规禁止收集的个人信息。

二、信息使用
1. 我们仅在为您提供服务、改善服务质量、开发新产品等合法目的范围内使用您的个人信息。
2. 未经您同意，我们不会将您的个人信息用于其他目的。
3. 我们会采取技术措施保护您的信息安全，防止信息泄露、损毁或丢失。

三、信息披露
1. 我们不会向任何无关第三方披露、出售、出租、分享或交易您的个人信息。
2. 在获得您同意的情况下，我们可能会与合作伙伴共享必要信息以提供服务。
3. 根据法律法规要求或司法机关合法要求，我们可能会披露相关信息。

四、信息安全
1. 我们采用符合行业标准的安全防护措施保护您的个人信息。
2. 我们建立了完善的管理制度，防止个人信息被非法获取、使用或泄露。
3. 尽管我们采取了合理安全措施，但互联网传输存在风险，您需要理解并承担相应风险。`,
      showCancel: false,
      confirmText: '关闭'
    })
  }

  return (
    <Popup
      open={visible}
      onClose={onClose}
      placement="center"
      className="login-modal"
      rounded
    >
      <View className="login-content">
        <View className="login-header">
          <View className="login-title">欢迎使用智蜂出行</View>
          <View className="login-subtitle">请登录以享受完整服务</View>
        </View>

        <View className="login-body">
          <Button
            className="login-btn"
            loading={loading}
            onClick={handleWechatLoginClick}
          >
            {loading ? '登录中...' : '微信一键登录'}
          </Button>
        </View>

        <View className="login-footer">
          <View className="login-tips">
            登录即表示同意《
            <Text className="link" onClick={showUserAgreement}>用户服务协议</Text>
            》和《
            <Text className="link" onClick={showPrivacyPolicy}>隐私政策</Text>
            》
          </View>
        </View>
      </View>
    </Popup>
  )
}

export default LoginModal
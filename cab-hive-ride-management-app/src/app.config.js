export default defineAppConfig({
  pages: [
    'pages/profile/index',
    'pages/home/index',
    'pages/booking/index',
    'pages/driver-register/index',
    'pages/driver-info/index',
    'pages/driver-edit/index',
    'pages/vehicle-info/index',
    'pages/vehicle-add/index',
    'pages/audit-records/index',
    'pages/audit-detail/index',
    'pages/test-vehicle-card/index'
  ],
  // 配置 permission
  permission: {
    'scope.userLocation': {
      desc: '你的位置信息将用于小程序定位' // 这里会显示在授权弹窗上，请务必填写清晰
    }
  },
  requiredPrivateInfos: ['getLocation', 'chooseLocation'],
  tabBar: {
    custom: false,
    color: '#6b7280',
    selectedColor: '#3b82f6',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'assets/icons/home.png',
        selectedIconPath: 'assets/icons/home-active.png'
      },
      {
        pagePath: 'pages/booking/index',
        text: '打车',
        iconPath: 'assets/icons/car.png',
        selectedIconPath: 'assets/icons/car-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '个人中心',
        iconPath: 'assets/icons/profile.png',
        selectedIconPath: 'assets/icons/profile-active.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#3b82f6',
    navigationBarTitleText: '智蜂出行',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f9fafb'
  },
  plugins: {
    chooseLocation: {
      version: "1.0.12",
      provider: "wx76a9a06e5b4e693e"
    }
  }
})
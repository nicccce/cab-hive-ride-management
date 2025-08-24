export default defineAppConfig({
  pages: [
    'pages/profile/index',
    'pages/home/index',
    'pages/booking/index',
    'pages/driver-register/index',
    'pages/driver-info/index',
    'pages/vehicle-info/index',
    'pages/audit-records/index',
    'pages/vehicle-audit-records/index'
  ],
  tabBar: {
    custom: false,
    color: '#666',
    selectedColor: '#1976d2',
    backgroundColor: '#fafafa',
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
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '智蜂出行',
    navigationBarTextStyle: 'black'
  }
})

function defineAppConfig(config) {
  return config
}
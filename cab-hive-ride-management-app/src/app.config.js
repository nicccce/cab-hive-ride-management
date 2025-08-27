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
  }
})
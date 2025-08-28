export default defineAppConfig({
  pages: [
    'pages/personal/index',
    'pages/home/index',
    'pages/ride/index',
    'pages/driver/index',
    'pages/login/index',
    'pages/driver-info/index',
    'pages/driver-register/index',
    'pages/driver-audit/index',
    'pages/vehicle-info/index',
    'pages/vehicle-audit/index'
  ],
  tabBar: {
    custom: true,
    color: '#7A7E83',
    selectedColor: '#FF6B35',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/ride/index',
        text: '打车'
      },
      {
        pagePath: 'pages/personal/index',
        text: '我的'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF6B35',
    navigationBarTitleText: '智蜂出行',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F7F8FA'
  },
  lazyCodeLoading: 'requiredComponents',
  usingComponents: {
  }
})
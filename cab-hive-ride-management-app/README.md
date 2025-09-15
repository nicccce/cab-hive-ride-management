# 智蜂出行 - 微信小程序

智蜂出行是一款基于微信小程序平台的智能出行服务应用，为用户提供便捷的打车服务。该应用采用现代化的前端技术栈构建，支持乘客和司机两种角色，提供完整的出行服务体验。

## 项目简介

智蜂出行小程序是智蜂出行平台的移动端入口，基于Taro框架开发，支持多端部署。该应用为用户提供了完整的出行服务流程，包括：

- **乘客功能**：
  - 实时打车服务（立即出发/预约出发）
  - 实时查看司机位置和行程状态
  - 多条路线规划与选择
  - 订单管理与历史记录查看
  - 在线支付与评价反馈

- **司机功能**：
  - 司机注册与资质审核
  - 车辆信息管理与审核
  - 订单接单与行程管理
  - 实时位置上传与同步
  - 收入统计与明细查看

## 核心特性

1. **智能路线规划**：集成腾讯地图API，提供多条路线选择与实时导航
2. **实时位置追踪**：乘客与司机可实时查看对方位置，保障行程安全
3. **双端角色管理**：支持乘客与司机两种用户角色，提供差异化功能体验
4. **订单状态管理**：完整的订单生命周期管理，从创建到完成的全流程跟踪
5. **审核机制**：司机与车辆信息审核流程，确保平台服务质量
6. **AI客服支持**：集成AI客服系统，提供智能客服支持

## 技术栈

智蜂出行小程序采用现代化的前端技术栈构建，确保了应用的高性能和良好的开发体验：

- **核心框架**：[Taro](https://taro.jd.com/) - 开放式跨端跨框架解决方案，支持React语法
- **UI框架**：[Taroify](https://github.com/mallfoundry/taroify) - 高质量的Taro组件库
- **状态管理**：React Hooks - React原生状态管理方案
- **样式处理**：[Tailwind CSS](https://tailwindcss.com/) - 实用优先的CSS框架
- **构建工具**：[Webpack 5](https://webpack.js.org/) - 模块打包工具
- **代码规范**：
  - [ESLint](https://eslint.org/) - JavaScript代码检查工具
  - [Stylelint](https://stylelint.io/) - CSS代码检查工具
  - [Commitlint](https://commitlint.js.org/) - Git提交信息规范工具
- **地图服务**：腾讯地图API - 提供位置服务和路线规划
- **开发语言**：JavaScript (ES6+)

## 项目结构

```
src/
├── assets/                 # 静态资源文件
│   └── icons/             # 图标文件
├── components/            # 公共组件
│   ├── AiChat/           # AI客服组件
│   ├── DriverEnRouteToPickup/  # 司机前往接乘客组件
│   ├── DriverOrderPanel/       # 司机订单面板组件
│   ├── DriverRideInProgress/   # 司机行程进行中组件
│   ├── DriverWaitingForPassenger/  # 司机等待乘客组件
│   ├── EditProfileModal/       # 编辑个人资料模态框
│   ├── Feedback/               # 反馈组件
│   ├── LoginModal/             # 登录模态框
│   ├── MenuItem/               # 菜单项组件
│   ├── MenuSection/            # 菜单区域组件
│   ├── ProfileHeader/          # 个人资料头部组件
│   ├── RideInProgress/         # 行程进行中组件
│   ├── RideOrder/              # 打车订单组件
│   ├── VehicleCard/            # 车辆卡片组件
│   ├── VehicleDetailModal/     # 车辆详情模态框
│   ├── WaitingForDriver/       # 等待司机组件
│   └── WaitingForDriverArrive/ # 等待司机到达组件
├── config/                 # 配置文件
├── hooks/                  # 自定义React Hooks
├── libs/                   # 第三方库
├── pages/                  # 页面文件
│   ├── audit-detail/       # 审核详情页面
│   ├── audit-records/      # 审核记录页面
│   ├── booking/            # 预订页面
│   ├── driver-detail/      # 司机详情页面
│   ├── driver-edit/        # 司机编辑页面
│   ├── driver-income/      # 司机收入页面
│   ├── driver-info/        # 司机信息页面
│   ├── driver-order-detail/     # 司机订单详情页面
│   ├── driver-order-list/       # 司机订单列表页面
│   ├── driver-register/         # 司机注册页面
│   ├── feedback-detail/         # 反馈详情页面
│   ├── feedback-management/     # 反馈管理页面
│   ├── home/                    # 首页
│   ├── order-detail/            # 订单详情页面
│   ├── order-list/              # 订单列表页面
│   ├── payment/                 # 支付页面
│   ├── profile/                 # 个人中心页面
│   ├── vehicle-add/             # 添加车辆页面
│   ├── vehicle-detail/          # 车辆详情页面
│   └── vehicle-info/            # 车辆信息页面
├── services/               # 服务层（API接口封装）
└── utils/                  # 工具函数
```

## 关键技术与架构设计

### 架构模式

智蜂出行小程序采用组件化架构设计，遵循关注点分离原则：

1. **页面与组件分离**：页面负责路由和状态管理，组件负责UI渲染和交互
2. **服务层抽象**：API调用统一通过services层管理，提高代码复用性和可维护性
3. **状态管理**：使用React Hooks进行状态管理，结合Taro的useDidShow等生命周期钩子
4. **配置驱动**：API端点、角色定义等通过配置文件统一管理

### 核心技术实现

#### 1. 地图与位置服务
- 集成腾讯地图插件，实现位置选择、路线规划和实时位置追踪
- 使用微信小程序原生地图组件展示路线和标记点
- 实现司机与乘客位置的实时同步

#### 2. 订单状态管理
- 定义完整的订单状态机（等待接单、等待到达、行程中、等待支付等）
- 通过定时轮询机制实时更新订单状态
- 支持乘客取消订单和司机接单操作

#### 3. 身份认证与权限控制
- 基于JWT Token的身份验证机制
- 支持微信一键登录
- 角色权限控制（乘客/司机/管理员）
- Token自动刷新机制

#### 4. 组件化设计
- 复用组件设计（如MenuItem、MenuSection等）
- 模态框组件（登录、编辑资料等）
- 地图相关组件（行程展示、位置选择等）

#### 5. 样式系统
- 采用Tailwind CSS实现原子化CSS设计
- 结合SCSS实现组件样式隔离
- 响应式设计适配不同屏幕尺寸

## 部署流程

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- 微信开发者工具

### 安装依赖

```bash
npm install
```

### 开发环境运行

```bash
# 启动微信小程序开发模式
npm run dev:weapp
```

### 生产环境构建

```bash
# 构建微信小程序生产版本
npm run build:weapp
```

### 部署步骤

1. **代码构建**：
   - 运行构建命令生成dist目录
   - 检查构建产物是否正确生成

2. **微信开发者工具导入**：
   - 打开微信开发者工具
   - 选择"导入项目"
   - 项目目录选择本项目的dist目录
   - 填写AppID（在.project.config.json中配置）

3. **上传代码**：
   - 在微信开发者工具中点击"上传"
   - 填写版本号和项目备注
   - 点击上传等待上传完成

4. **提交审核**：
   - 登录微信公众平台
   - 进入小程序管理后台
   - 在"开发管理"->"开发版本"中找到刚上传的版本
   - 点击"提交审核"

5. **发布上线**：
   - 审核通过后，在"审核版本"中点击"发布"
   - 确认发布后小程序即可正式上线

### 环境配置

项目支持多环境配置，通过.env文件管理环境变量：
- `.env.development`：开发环境配置
- `.env.production`：生产环境配置

### 注意事项

- 构建前请确保所有依赖已正确安装
- 微信小程序有包大小限制（主包2MB，总包8MB），需注意资源优化
- 地图相关功能需要在微信公众平台配置相应的插件权限

## 许可证

本项目采用Apache License 2.0许可证。详情请见根目录下的[LICENSE](../LICENSE)文件。

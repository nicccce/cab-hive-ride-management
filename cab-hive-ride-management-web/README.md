# 智蜂出行后台管理系统

智蜂出行后台管理系统是专为网约车平台打造的一站式管理解决方案，采用现代化前端技术栈构建，提供直观、高效的管理界面。系统涵盖了用户管理、司机管理、车辆管理、订单管理、反馈管理、收入统计等核心功能模块，为平台运营人员提供全面的数据支持和业务管控能力。

本系统基于微服务架构设计，前端采用React 18 + TypeScript技术栈，结合Vite构建工具实现快速开发和部署。通过Ant Design组件库提供企业级UI体验，集成Redux Toolkit进行全局状态管理，确保复杂业务场景下的数据流清晰可控。

## 核心特性

- **现代化技术架构**：基于React 18 Hooks和函数式组件设计，充分利用TypeScript类型安全特性
- **响应式设计**：适配不同屏幕尺寸，支持PC端管理操作
- **模块化开发**：采用组件化和模块化设计理念，代码结构清晰，易于维护和扩展
- **权限控制**：完善的路由权限验证机制，确保系统安全
- **实时数据展示**：集成数据可视化组件，直观展示平台运营数据
- **高效状态管理**：使用Redux Toolkit管理全局状态，优化复杂业务逻辑处理

## 部署流程

### 环境要求

- Node.js >= 18.x
- npm >= 8.x 或 yarn >= 1.22.x
- 现代化浏览器（Chrome, Firefox, Safari等）

### 快速开始

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd cab-hive-ride-management-web
   ```

2. **安装依赖**
   ```bash
   # 使用 npm
   npm install
   
   # 或使用 yarn
   yarn install
   ```

3. **启动开发服务器**
   ```bash
   # 使用 npm
   npm run dev
   
   # 或使用 yarn
   yarn dev
   ```
   
   开发服务器将在 `http://localhost:5173` 启动，支持热重载功能。

4. **构建生产版本**
   ```bash
   # 使用 npm
   npm run build
   
   # 或使用 yarn
   yarn build
   ```
   
   构建后的文件将输出到 `dist` 目录，可用于生产环境部署。

5. **预览生产构建**
   ```bash
   # 使用 npm
   npm run preview
   
   # 或使用 yarn
   yarn preview
   ```

### 环境变量配置

项目支持通过环境变量进行配置，可在项目根目录创建 `.env` 文件：

```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### 部署到生产环境

1. 构建项目：
   ```bash
   npm run build
   ```

2. 将 `dist` 目录中的文件部署到Web服务器或CDN即可。

## 技术栈与核心技术

### 前端技术栈

本项目采用现代化、高性能的前端技术栈，确保代码质量和开发效率：

- **React 18**：用于构建用户界面的JavaScript库，利用其最新的并发渲染特性提升用户体验
- **TypeScript**：为JavaScript添加静态类型定义，提高代码可维护性和开发效率
- **Vite 5**：下一代前端构建工具，提供极快的冷启动和热更新速度
- **Ant Design 5**：企业级React UI组件库，提供丰富的组件和设计规范
- **Redux Toolkit**：官方推荐的Redux开发工具包，简化状态管理逻辑
- **React Router v7**：声明式路由管理库，支持现代化路由特性
- **Tailwind CSS 3**：实用优先的CSS框架，提供原子化CSS类名
- **Axios**：基于Promise的HTTP客户端，用于处理API请求
- **Lucide React**：简洁美观的React图标库
- **TLBS Map React**：腾讯地图React组件库，用于地图相关功能

### 关键技术实现

#### 1. 状态管理
采用Redux Toolkit作为全局状态管理方案，通过createSlice简化reducer和action的创建，利用RTK Query处理API请求，实现数据缓存和自动重新获取。

#### 2. 路由管理
基于React Router v7实现声明式路由，结合自定义PrivateRoute组件实现权限验证，确保只有认证用户才能访问管理页面。

#### 3. UI组件设计
利用Ant Design组件库构建企业级界面，通过自定义主题配置实现品牌一致性，结合Tailwind CSS实现响应式布局。

#### 4. HTTP请求处理
封装Axios实例，统一处理请求拦截、响应拦截、错误处理和Token管理，确保API调用的一致性和安全性。

#### 5. 表单验证
利用Ant Design Form组件实现表单验证，结合自定义验证规则确保数据输入的准确性。

#### 6. 数据可视化
集成Ant Design Charts实现数据可视化展示，直观呈现平台运营数据。

### 整体架构设计

本项目采用分层架构设计，遵循现代前端开发最佳实践：

```
src/
├── components/        # 公共组件
├── pages/            # 页面组件
├── router/           # 路由配置
├── services/         # API服务层
├── store/            # 状态管理
├── types/            # TypeScript类型定义
└── utils/            # 工具函数
```

通过模块化设计，实现了高内聚、低耦合的代码结构，便于团队协作和后期维护。

## 项目结构

```
cab-hive-ride-management-web/
├── public/                    # 静态资源文件
│   └── favicon.png           # 网站图标
├── src/                      # 源代码目录
│   ├── components/           # 公共组件
│   │   ├── Layout/           # 布局组件
│   │   ├── PrivateRoute/     # 权限路由组件
│   │   └── ...               # 其他公共组件
│   ├── hooks/                # 自定义React Hooks
│   ├── pages/                # 页面组件
│   │   ├── Dashboard/        # 仪表板页面
│   │   ├── Login/            # 登录页面
│   │   ├── UserManagement/   # 用户管理页面
│   │   ├── DriverManagement/ # 司机管理页面
│   │   ├── DriverReview/     # 司机审核页面
│   │   ├── VehicleReview/    # 车辆审核页面
│   │   ├── VehicleManagement/# 车辆管理页面
│   │   ├── OrderManagement/  # 订单管理页面
│   │   ├── FeedbackManagement/# 反馈管理页面
│   │   ├── AlertManagement/  # 警报管理页面
│   │   └── IncomeManagement/ # 收入管理页面
│   ├── router/               # 路由配置
│   ├── services/             # API服务层
│   ├── store/                # Redux状态管理
│   │   └── modules/          # 各模块状态
│   ├── types/                # TypeScript类型定义
│   ├── utils/                # 工具函数
│   ├── App.tsx              # 根组件
│   ├── main.tsx             # 入口文件
│   └── vite-env.d.ts        # Vite类型定义
├── index.html               # HTML模板
├── package.json             # 项目配置文件
├── tsconfig.json            # TypeScript配置
├── vite.config.ts           # Vite配置
├── tailwind.config.js       # Tailwind配置
├── postcss.config.js        # PostCSS配置
└── eslint.config.js         # ESLint配置
```

### 核心目录说明

#### components/
存放可复用的UI组件，包括布局组件、业务组件等。所有组件都采用函数式组件和Hooks编写，确保代码简洁和性能优化。

#### pages/
按照功能模块划分页面组件，每个页面目录包含该功能模块的所有相关组件和逻辑。

#### router/
负责路由配置和管理，使用React Router实现单页面应用的路由跳转和权限控制。

#### services/
封装所有API请求，统一处理HTTP请求和响应，提供类型安全的服务层接口。

#### store/
基于Redux Toolkit实现全局状态管理，按功能模块划分子store，确保状态管理的清晰和可维护性。

#### types/
定义项目中使用的TypeScript类型和接口，确保类型安全和代码提示。

#### utils/
包含各种工具函数，如HTTP请求封装、日期处理、数据格式化等。

## 代码质量保证

本项目采用严格的代码质量控制措施，确保代码的可维护性和稳定性：

- **ESLint**：配置了严格的代码规范检查，确保代码风格一致性
- **TypeScript**：通过静态类型检查减少运行时错误
- **Prettier**：自动格式化代码，保持代码风格统一
- **Git Hooks**：集成husky和lint-staged，确保提交代码前通过检查

## 开发规范

### 代码风格
- 遵循Airbnb JavaScript编码规范
- 使用TypeScript进行类型检查
- 组件采用函数式组件和Hooks编写
- CSS类名遵循BEM命名规范

### 提交规范
- 使用Angular提交规范
- 提交信息需包含类型、作用域和描述
- 类型包括：feat(新功能)、fix(修复)、docs(文档)、style(样式)、refactor(重构)等

## 许可证

本项目采用Apache License 2.0许可证。详情请见根目录下的[LICENSE](../LICENSE)文件。
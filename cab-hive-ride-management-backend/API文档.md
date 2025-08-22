# Cab Hive Ride Management API 文档

## 基础信息

- **Base URL**: `/api/`
- **认证方式**: JWT Token
- **角色权限**:
  - Role ID 1: 普通用户
  - Role ID 2: 司机
  - Role ID 3: 管理员

## 认证模块

### 微信登录
- **URL**: `POST /api/auth/wechat/login`
- **权限**: 无
- **说明**: 用户通过微信登录系统

### 管理员登录
- **URL**: `POST /api/auth/admin/login`
- **权限**: 无
- **说明**: 管理员登录系统

### 刷新令牌
- **URL**: `POST /api/auth/refresh`
- **权限**: 用户/管理员
- **说明**: 刷新JWT令牌

### 司机注册
- **URL**: `POST /api/auth/driver/register`
- **权限**: 用户
- **说明**: 用户注册成为司机

### 司机自我更新信息
- **URL**: `POST /api/auth/driver/self-update`
- **权限**: 司机
- **说明**: 司机更新个人信息

## 管理员模块

### 获取所有用户
- **URL**: `GET /api/admin/users`
- **权限**: 管理员
- **说明**: 获取系统所有用户列表

### 获取所有司机
- **URL**: `GET /api/admin/drivers`
- **权限**: 管理员
- **说明**: 获取系统所有司机列表

### 获取待审核司机
- **URL**: `GET /api/admin/drivers/pending`
- **权限**: 管理员
- **说明**: 获取待审核的司机列表

### 获取待审核车辆
- **URL**: `GET /api/admin/vehicles/pending`
- **权限**: 管理员
- **说明**: 获取待审核的车辆列表

### 审核司机信息
- **URL**: `POST /api/admin/drivers/review/:id`
- **权限**: 管理员
- **说明**: 审核司机注册或更新信息

### 审核车辆信息
- **URL**: `POST /api/admin/vehicles/review/:id`
- **权限**: 管理员
- **说明**: 审核车辆注册或更新信息

## 车辆模块

### 提交车辆信息
- **URL**: `POST /api/vehicles`
- **权限**: 司机
- **说明**: 司机提交车辆信息

### 获取车辆列表
- **URL**: `GET /api/vehicles`
- **权限**: 司机
- **说明**: 获取司机的车辆列表

### 更新车辆信息
- **URL**: `PUT /api/vehicles/:vehicle_id`
- **权限**: 司机
- **说明**: 更新车辆信息

## 图片模块

### 上传图片
- **URL**: `POST /api/image/upload`
- **权限**: 用户/司机/管理员
- **说明**: 上传图片文件

## 健康检查模块

### Ping
- **URL**: `GET /api/ping`
- **权限**: 无
- **说明**: 服务健康检查
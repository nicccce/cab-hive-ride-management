// API 基础配置
export const API_BASE_URL = 'http://10.27.216.86:8080'

// 接口地址
export const API_ENDPOINTS = {
  // 认证相关
  WECHAT_LOGIN: '/api/auth/wechat/login',
  DRIVER_REGISTER: '/api/auth/driver/register',
  DRIVER_UPDATE: '/api/auth/driver/self-update',
  REFRESH_TOKEN: '/api/auth/refresh',
  
  // 用户相关
  USER_PROFILE: '/api/users/profile',
  USER_PROFILE_RESET: '/api/users/profile/reset',
  IMAGE_UPLOAD: '/api/image/upload',
  
  // 司机相关
  DRIVERS: '/api/users/drivers/info',
  DRIVER_PENDING: '/api/users/drivers/pending',
  DRIVER_SELF_PENDING: '/api/users/drivers/self/pending',
  
  // 车辆相关
  VEHICLES: '/api/vehicles',
  VEHICLES_DELETE: '/api/drivers/vehicles',
  VEHICLE_PENDING: '/api/vehicles/pending',
  VEHICLE_SELF_PENDING: '/api/drivers/vehicles/pending',
  VEHICLE_SUBMIT: '/api/drivers/vehicles/register',
  VEHICLE_UPDATE: '/api/drivers/vehicles',
}

// 角色定义
export const USER_ROLES = {
  CUSTOMER: 1,
  DRIVER: 2,
  ADMIN: 3
}

// 审核状态
export const AUDIT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
}

// 响应状态码
export const RESPONSE_CODES = {
  SUCCESS: 200,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
}
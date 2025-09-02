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
  
  // 订单相关
  ORDER_CREATE: '/api/orders/immediate',
  ORDER_RESERVE: '/api/orders/reserve',
  ORDER_DETAIL: '/api/orders',
  ORDER_UNFINISHED: '/api/orders/unfinished',
  ORDER_DRIVER_UNFINISHED: '/api/orders/driver/unfinished',
  ORDER_CANCEL: '/api/orders/{id}',
  // 司机订单相关
  ORDER_REQUEST: '/api/rides/order/request',
  ORDER_TAKE: '/api/rides/order/take',
  ORDER_PHONE_DIGITS: '/api/rides/order/phone-digits',
  ORDER_VERIFY_PHONE_START: '/api/rides/order/verify-phone-start',
  ORDER_FINISH: '/api/rides/order/finish',
   
  // 司机位置相关
  DRIVER_LOCATION: '/api/rides/location',
   
  // 反馈相关
  FEEDBACK_SUBMIT: '/api/feedback',
  FEEDBACK_LIST: '/api/feedback',
  FEEDBACK_DETAIL: '/api/feedback/{id}',
  FEEDBACK_ADMIN_LIST: '/api/feedback/admin',
  FEEDBACK_ADMIN_DETAIL: '/api/feedback/admin/{id}',
  FEEDBACK_ADMIN_REPLY: '/api/feedback/admin/{id}/reply',
  FEEDBACK_ADMIN_STATUS: '/api/feedback/admin/{id}/status',
   
  // AI客服相关
  AI_CHAT: '/api/ai/chat',
  
  // 收入相关
  DRIVER_INCOME_TOTAL: '/api/users/drivers/income/total',
  DRIVER_INCOME_LIST: '/api/users/drivers/income/list',
  DRIVER_INCOME_DETAIL: '/api/users/drivers/income/{id}',
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

export const LBS_CONFIG = {
  key: "CQHBZ-X5HW3-POS3L-OG3O2-KDHJK-KVBMQ",
  referer: "智峰出行"
}
// API 基础配置
export const API_BASE_URL = 'localhost:8080'

// 用户角色常量
export const USER_ROLES = {
  PASSENGER: 1,
  DRIVER: 2,
  ADMIN: 3
} as const

// 审核状态常量
export const AUDIT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved', 
  REJECTED: 'rejected',
  BANNED: 'banned'
} as const

// 审核状态文本映射
export const AUDIT_STATUS_TEXT = {
  [AUDIT_STATUS.PENDING]: '审核中',
  [AUDIT_STATUS.APPROVED]: '已通过',
  [AUDIT_STATUS.REJECTED]: '已拒绝',
  [AUDIT_STATUS.BANNED]: '已封禁'
} as const

// 用户角色文本映射
export const USER_ROLE_TEXT = {
  [USER_ROLES.PASSENGER]: '乘客',
  [USER_ROLES.DRIVER]: '司机',
  [USER_ROLES.ADMIN]: '管理员'
} as const

// 存储键常量
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_INFO: 'userInfo',
  TAB_BAR_CONFIG: 'tabBarConfig'
} as const

// 页面路径常量
export const PAGES = {
  HOME: '/pages/home/index',
  BOOKING: '/pages/booking/index',
  PROFILE: '/pages/profile/index',
  DRIVER_REGISTER: '/pages/driver-register/index',
  DRIVER_INFO: '/pages/driver-info/index',
  VEHICLE_INFO: '/pages/vehicle-info/index',
  AUDIT_RECORDS: '/pages/audit-records/index',
  VEHICLE_AUDIT_RECORDS: '/pages/vehicle-audit-records/index'
} as const
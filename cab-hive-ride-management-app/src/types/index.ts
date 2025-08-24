// 用户相关类型定义
export interface User {
  id: number
  role_id: number
  nick_name: string
  avatar_url: string
  open_id: string
  is_banned?: boolean
}

export interface UserProfile extends User {
  phone?: string
}

// 司机相关类型定义
export interface Driver {
  id: number
  open_id: string
  license_number: string
  name: string
  phone: string
  license_image_url: string
  status: 'pending' | 'approved' | 'rejected' | 'banned'
  comment?: string
  submit_time: string
  review_time?: string
}

// 车辆相关类型定义
export interface Vehicle {
  id: string
  driver_id: string
  plate_number: string
  vehicle_type: string
  brand: string
  model_name?: string
  model?: string
  color?: string
  year?: number
  registration_image?: string
  insurance_expiry?: string
  status: 'pending' | 'approved' | 'rejected'
  comment?: string
  submit_time: string
  review_time?: string
}

// API响应类型定义
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
  timestamp: string
}

export interface PaginatedResponse<T> {
  [key: string]: T[]
  pagination: {
    current_page: number
    page_size: number
    total_count: number
    total_pages: number
  }
}

// 登录相关类型定义
export interface LoginRequest {
  code: string
  encryptedData?: string
  iv?: string
}

export interface LoginResponse {
  token: string
  user_id: string
  role: string
  expires_in: number
  user_info: {
    nickname: string
    avatar: string
    phone?: string
  }
}

// 司机注册类型定义
export interface DriverRegisterRequest {
  license_number: string
  license_image: string
  name: string
  phone: string
}

// 个人信息更新类型定义
export interface UpdateProfileRequest {
  nick_name?: string
  avatar_url?: string
}

// 常量类型定义
export type UserRole = 1 | 2 | 3 // 1: 乘客, 2: 司机, 3: 管理员
export type AuditStatus = 'pending' | 'approved' | 'rejected' | 'banned'
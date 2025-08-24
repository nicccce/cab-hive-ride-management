import { http } from '@/utils/request'
import type {
  ApiResponse,
  PaginatedResponse,
  LoginRequest,
  LoginResponse,
  User,
  UserProfile,
  Driver,
  Vehicle,
  DriverRegisterRequest,
  UpdateProfileRequest
} from '@/types'

// 认证相关API
export const authApi = {
  // 微信用户登录
  wechatLogin: (data: LoginRequest): Promise<ApiResponse<LoginResponse>> =>
    http.post('/api/auth/wechat/login', data),

  // 司机注册
  driverRegister: (data: DriverRegisterRequest): Promise<ApiResponse<{ status: string; driver_id: string; estimated_review_time: string }>> =>
    http.post('/api/auth/driver/register', data),

  // 刷新令牌
  refreshToken: (refreshToken: string): Promise<ApiResponse<{ token: string; expires_in: number }>> =>
    http.post('/api/auth/refresh', { refresh_token: refreshToken })
}

// 用户相关API
export const userApi = {
  // 获取当前用户个人信息
  getProfile: (): Promise<ApiResponse<UserProfile>> =>
    http.get('/api/users/profile'),

  // 更新当前用户个人信息
  updateProfile: (data: UpdateProfileRequest): Promise<ApiResponse<null>> =>
    http.put('/api/users/profile', data),

  // 重置当前用户个人信息
  resetProfile: (): Promise<ApiResponse<null>> =>
    http.put('/api/users/profile/reset'),

  // 获取所有用户列表（管理员）
  getAllUsers: (params?: {
    page?: number
    page_size?: number
    nick_name?: string
    open_id?: string
  }): Promise<ApiResponse<PaginatedResponse<User>>> =>
    http.get('/api/users', params)
}

// 司机相关API  
export const driverApi = {
  // 获取司机信息
  getDriverInfo: (id?: number): Promise<ApiResponse<Driver>> =>
    id ? http.get(`/api/users/drivers/${id}`) : http.get('/api/users/drivers'),

  // 获取所有司机列表（管理员）
  getAllDrivers: (params?: {
    page?: number
    page_size?: number
    name?: string
    phone?: string
    license_number?: string
    status?: string
  }): Promise<ApiResponse<PaginatedResponse<Driver>>> =>
    http.get('/api/users/drivers', params),

  // 获取司机审核详情
  getDriverAuditDetail: (id: number): Promise<ApiResponse<Driver>> =>
    http.get(`/api/users/drivers/pending/${id}`),

  // 获取司机自己的所有司机审核信息列表
  getSelfAuditRecords: (params?: {
    page?: number
    page_size?: number
    name?: string
    license_number?: string
    status?: string
  }): Promise<ApiResponse<PaginatedResponse<Driver>>> =>
    http.get('/api/users/drivers/self/pending', params),

  // 封禁司机（管理员）
  banDriver: (id: number): Promise<ApiResponse<null>> =>
    http.put(`/api/users/drivers/${id}/ban`),

  // 解封司机（管理员）
  unbanDriver: (id: number): Promise<ApiResponse<null>> =>
    http.put(`/api/users/drivers/${id}/unban`)
}

// 车辆相关API
export const vehicleApi = {
  // 获取车辆列表
  getVehicles: (params?: {
    page?: number
    page_size?: number
    plate_number?: string
    brand?: string
    model_name?: string
    status?: string
  }): Promise<ApiResponse<PaginatedResponse<Vehicle>>> =>
    http.get('/api/vehicles', params),

  // 获取车辆详情
  getVehicleDetail: (vehicleId: string): Promise<ApiResponse<Vehicle>> =>
    http.get(`/api/vehicles/${vehicleId}`),

  // 删除车辆
  deleteVehicle: (vehicleId: string): Promise<ApiResponse<null>> =>
    http.delete(`/api/vehicles/${vehicleId}`),

  // 获取车辆审核详情
  getVehicleAuditDetail: (id: number): Promise<ApiResponse<Vehicle>> =>
    http.get(`/api/vehicles/pending/${id}`),

  // 获取司机自己的所有车辆审核信息列表
  getSelfVehicleAuditRecords: (params?: {
    page?: number
    page_size?: number
    plate_number?: string
    brand?: string
    model_name?: string
    status?: string
  }): Promise<ApiResponse<PaginatedResponse<Vehicle>>> =>
    http.get('/api/vehicles/self/pending', params),

  // 获取司机名下车辆列表
  getDriverVehicles: (driverId: number): Promise<ApiResponse<{ vehicles: Vehicle[] }>> =>
    http.get(`/api/users/drivers/${driverId}/vehicles`)
}

// 管理员相关API
export const adminApi = {
  // 司机信息审核列表
  getDriverAuditList: (params?: {
    page?: number
    page_size?: number
    name?: string
    license_number?: string
    status?: string
  }): Promise<ApiResponse<PaginatedResponse<Driver>>> =>
    http.get('/api/admin/drivers/pending', params),

  // 审核司机信息
  reviewDriver: (id: number, data: { action: 'approved' | 'rejected'; comment: string }): Promise<ApiResponse<null>> =>
    http.post(`/api/admin/drivers/review/${id}`, data),

  // 车辆信息审核列表
  getVehicleAuditList: (params?: {
    page?: number
    page_size?: number
    plate_number?: string
    brand?: string
    model_name?: string
    status?: string
  }): Promise<ApiResponse<PaginatedResponse<Vehicle>>> =>
    http.get('/api/admin/vehicles/pending', params),

  // 审核车辆信息
  reviewVehicle: (id: number, data: { action: 'approved' | 'rejected'; comment: string }): Promise<ApiResponse<null>> =>
    http.post(`/api/admin/vehicles/review/${id}`, data)
}
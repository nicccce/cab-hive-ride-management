import { get, post, put } from './request'
import type { LoginResponse, ApiResponse, UserInfo, DriverInfo, VehicleInfo, AuditRecord } from '@/types/user'

// 登录
export const login = (phone: string, code: string): Promise<LoginResponse> => {
  return post('/auth/login', { phone, code }, false)
}

// 获取用户信息
export const getUserInfo = (): Promise<ApiResponse<UserInfo>> => {
  return get('/user/profile')
}

// 更新用户信息
export const updateUserInfo = (data: Partial<UserInfo>): Promise<ApiResponse> => {
  return put('/user/profile', data)
}

// 获取司机信息
export const getDriverInfo = (): Promise<ApiResponse<DriverInfo>> => {
  return get('/driver/info')
}

// 提交司机注册信息
export const submitDriverInfo = (data: Partial<DriverInfo>): Promise<ApiResponse> => {
  return post('/driver/register', data)
}

// 更新司机信息
export const updateDriverInfo = (data: Partial<DriverInfo>): Promise<ApiResponse> => {
  return put('/driver/info', data)
}

// 获取车辆信息
export const getVehicleInfo = (): Promise<ApiResponse<VehicleInfo>> => {
  return get('/vehicle/info')
}

// 提交车辆信息
export const submitVehicleInfo = (data: Partial<VehicleInfo>): Promise<ApiResponse> => {
  return post('/vehicle/info', data)
}

// 更新车辆信息
export const updateVehicleInfo = (data: Partial<VehicleInfo>): Promise<ApiResponse> => {
  return put('/vehicle/info', data)
}

// 获取审核记录
export const getAuditRecords = (type?: string): Promise<ApiResponse<AuditRecord[]>> => {
  return get('/audit/records', type ? { type } : {})
}

// 发送验证码
export const sendSmsCode = (phone: string): Promise<ApiResponse> => {
  return post('/auth/sms-code', { phone }, false)
}

// 上传文件
export const uploadFile = (filePath: string): Promise<ApiResponse<{ url: string }>> => {
  // 这里应该使用Taro.uploadFile，但为了保持API一致性，暂时用这个方式
  return post('/upload', { filePath })
}
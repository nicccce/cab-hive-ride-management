export interface UserInfo {
  id: number
  phone: string
  nickname: string
  avatar: string
  roleId: number // 1: 乘客, 2: 司机
  status: number // 0: 封禁, 1: 正常
  createTime: string
  updateTime: string
}

export interface LoginResponse {
  code: number
  message: string
  data: {
    token: string
    userInfo: UserInfo
  }
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface DriverInfo {
  id: number
  userId: number
  realName: string
  idCard: string
  driverLicense: string
  driverLicenseExpiry: string
  emergencyContact: string
  emergencyPhone: string
  status: number // 0: 待审核, 1: 审核通过, 2: 审核拒绝
  rejectReason?: string
  createTime: string
  updateTime: string
}

export interface VehicleInfo {
  id: number
  userId: number
  licensePlate: string
  vehicleModel: string
  vehicleColor: string
  vehiclePhotos: string[]
  drivingLicense: string
  status: number // 0: 待审核, 1: 审核通过, 2: 审核拒绝
  rejectReason?: string
  createTime: string
  updateTime: string
}

export interface AuditRecord {
  id: number
  userId: number
  type: string // 'driver' | 'vehicle'
  status: number
  rejectReason?: string
  createTime: string
}
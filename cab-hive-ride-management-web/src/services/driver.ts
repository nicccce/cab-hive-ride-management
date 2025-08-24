import request from '../utils/request';
import {
  ApiResponse,
  Driver,
  DriverListResponse,
  DriverListParams,
  DriverReview,
  DriverReviewListResponse,
  DriverReviewListParams,
  ReviewActionRequest,
  Vehicle
} from '../types';

export const driverService = {
  // 获取所有司机列表
  getDriverList: (params: DriverListParams): Promise<ApiResponse<DriverListResponse>> => {
    return request.get('/users/drivers', { params });
  },

  // 获取司机详情
  getDriverDetail: (id: number): Promise<ApiResponse<Driver>> => {
    return request.get(`/users/drivers/${id}`);
  },

  // 获取司机名下车辆列表
  getDriverVehicles: (id: number): Promise<ApiResponse<{ vehicles: Vehicle[] }>> => {
    return request.get(`/users/drivers/${id}/vehicles`);
  },

  // 封禁司机
  banDriver: (id: number): Promise<ApiResponse<null>> => {
    return request.put(`/users/drivers/${id}/ban`);
  },

  // 解封司机
  unbanDriver: (id: number): Promise<ApiResponse<null>> => {
    return request.put(`/users/drivers/${id}/unban`);
  },

  // 获取司机审核列表
  getPendingReviewList: (params: DriverReviewListParams): Promise<ApiResponse<DriverReviewListResponse>> => {
    return request.get('/admin/drivers/pending', { params });
  },

  // 获取司机审核详情
  getReviewDetail: (id: number): Promise<ApiResponse<DriverReview>> => {
    return request.get(`/users/drivers/pending/${id}`);
  },

  // 审核司机（批准或拒绝）
  reviewDriver: (id: number, params: ReviewActionRequest): Promise<ApiResponse<null>> => {
    return request.post(`/admin/drivers/review/${id}`, params);
  },
};
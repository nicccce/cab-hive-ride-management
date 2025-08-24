import request from '../utils/request';
import { ApiResponse, VehicleReview, VehicleReviewListResponse, VehicleReviewListParams, ReviewActionRequest, Vehicle, VehicleListResponse, VehicleListParams } from '../types';

export const vehicleService = {
  // 获取车辆列表
  getVehicleList: (params: VehicleListParams): Promise<ApiResponse<VehicleListResponse>> => {
    return request.get('/vehicles', { params });
  },

  // 获取车辆详情
  getVehicleDetail: (id: string): Promise<ApiResponse<Vehicle>> => {
    return request.get(`/vehicles/${id}`);
  },

  // 获取车辆审核列表
  getPendingReviewList: (params: VehicleReviewListParams): Promise<ApiResponse<VehicleReviewListResponse>> => {
    return request.get('/admin/vehicles/pending', { params });
  },

  // 获取车辆审核详情
  getReviewDetail: (id: number): Promise<ApiResponse<VehicleReview>> => {
    return request.get(`/vehicles/pending/${id}`);
  },

  // 审核车辆（批准或拒绝）
  reviewVehicle: (id: number, params: ReviewActionRequest): Promise<ApiResponse<null>> => {
    return request.post(`/admin/vehicles/review/${id}`, params);
  },
};
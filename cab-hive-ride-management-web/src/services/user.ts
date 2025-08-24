import request from '../utils/request';
import { ApiResponse, User, UserListResponse, UserListParams } from '../types';

export const userService = {
  // 获取所有用户列表
  getUserList: (params: UserListParams): Promise<ApiResponse<UserListResponse>> => {
    return request.get('/users', { params });
  },

  // 获取用户详情
  getUserProfile: (): Promise<ApiResponse<User>> => {
    return request.get('/users/profile');
  },

  // 重置用户信息
  resetUserProfile: (): Promise<ApiResponse<null>> => {
    return request.put('/users/profile/reset');
  },

  // 管理员重置用户信息
  resetUserByAdmin: (userId: number): Promise<ApiResponse<null>> => {
    return request.put(`/users/profile/reset/${userId}`);
  },
};
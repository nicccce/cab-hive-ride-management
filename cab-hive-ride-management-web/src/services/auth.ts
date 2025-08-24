import request from '../utils/request';
import { ApiResponse, AdminUser, LoginRequest } from '../types';

export const authService = {
  // 管理员登录
  login: (params: LoginRequest): Promise<ApiResponse<AdminUser>> => {
    return request.post('/auth/admin/login', params);
  },

  // 刷新token
  refresh: (refreshToken: string): Promise<ApiResponse<{ token: string; expires_in: number }>> => {
    return request.post('/auth/refresh', { refresh_token: refreshToken });
  },
};
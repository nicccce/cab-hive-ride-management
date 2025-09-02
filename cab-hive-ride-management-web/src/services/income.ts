import request from '../utils/request';
import { ApiResponse, Income, IncomeListResponse, IncomeListParams, DriverTotalIncome } from '../types';

export const incomeService = {
  // 查看司机总收入
  getDriverTotalIncome: (): Promise<ApiResponse<DriverTotalIncome>> => {
    return request.get('/users/drivers/income/total');
  },

  // 获取司机收入列表
  getDriverIncomeList: (params: IncomeListParams): Promise<ApiResponse<IncomeListResponse>> => {
    return request.get('/users/drivers/income/list', { params });
  },

  // 查看收入具体信息
  getIncomeDetail: (id: number): Promise<ApiResponse<Income>> => {
    return request.get(`/users/drivers/income/${id}`);
  },

  // 管理员查看所有收入列表
  getAdminIncomeList: (params: IncomeListParams): Promise<ApiResponse<IncomeListResponse>> => {
    return request.get('/admin/income/list', { params });
  }
};
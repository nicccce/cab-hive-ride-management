import request from '../utils/request';
import { ApiResponse } from '../types';
import { Alert, AlertListResponse, ProcessAlertRequest, GetAlertsParams } from '../types/alert';

export const AlertService = {
  // 获取预警列表
  getAlerts: (params: GetAlertsParams): Promise<ApiResponse<AlertListResponse>> => {
    return request.get('/admin/alerts', { params });
  },

  // 处理预警
  processAlert: (id: number, data: ProcessAlertRequest): Promise<ApiResponse<null>> => {
    return request.post(`/admin/alerts/${id}/process`, data);
  },

  // 获取Redis中的预警列表并清空
  getRedisAlerts: (): Promise<ApiResponse<Alert[]>> => {
    return request.get('/admin/alerts/redis');
  },
};
import request from '../utils/request';
import {
  ApiResponse,
  Feedback,
  FeedbackListResponse,
  FeedbackListParams,
  FeedbackReplyRequest,
  FeedbackStatusUpdateRequest
} from '../types';

export const feedbackService = {
  // 获取反馈列表
  getFeedbackList: (params: FeedbackListParams): Promise<ApiResponse<FeedbackListResponse>> => {
    return request.get('/feedback/admin', { params });
  },

  // 获取反馈详情
  getFeedbackDetail: (id: number): Promise<ApiResponse<Feedback>> => {
    return request.get(`/feedback/admin/${id}`);
  },

  // 回复反馈
  replyFeedback: (id: number, params: FeedbackReplyRequest): Promise<ApiResponse<null>> => {
    return request.put(`/feedback/admin/${id}/reply`, params);
  },

  // 更新反馈状态
  updateFeedbackStatus: (id: number, params: FeedbackStatusUpdateRequest): Promise<ApiResponse<null>> => {
    return request.put(`/feedback/admin/${id}/status`, params);
  },
};
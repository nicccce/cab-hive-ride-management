import request from '../utils/request';
import { API_ENDPOINTS } from '../config/api';

/**
 * 提交反馈
 * @param {Object} feedbackData - 反馈数据
 * @returns {Promise}
 */
export const submitFeedback = (feedbackData) => {
  return request({
    url: API_ENDPOINTS.FEEDBACK_SUBMIT,
    method: 'POST',
    data: feedbackData
  });
};

/**
 * 获取用户反馈列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export const getUserFeedbackList = (params = {}) => {
  return request({
    url: API_ENDPOINTS.FEEDBACK_LIST,
    method: 'GET',
    params
  });
};

/**
 * 获取用户反馈详情
 * @param {number} id - 反馈ID
 * @returns {Promise}
 */
export const getUserFeedbackDetail = (id) => {
  return request({
    url: API_ENDPOINTS.FEEDBACK_DETAIL.replace('{id}', id),
    method: 'GET'
  });
};
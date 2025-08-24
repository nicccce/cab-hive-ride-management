import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';
import { ApiResponse } from '../types';

// 创建axios实例
const request = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('admin_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, msg, data } = response.data;
    
    if (code === 200) {
      return { ...response, data };
    } else {
      message.error(msg || '请求失败');
      return Promise.reject(new Error(msg));
    }
  },
  (error) => {
    if (error.response?.status === 401) {
      message.error('登录已过期，请重新登录');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    } else {
      message.error(error.message || '网络错误');
    }
    return Promise.reject(error);
  }
);

export default request;
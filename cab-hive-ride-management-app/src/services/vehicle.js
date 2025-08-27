import request from '../utils/request'
import { API_ENDPOINTS } from '../config/api'

// 获取车辆列表
export const getVehicleList = async (params) => {
  return await request({
    url: API_ENDPOINTS.VEHICLES,
    method: 'GET',
    data: params
  })
}

// 获取车辆详情
export const getVehicleDetail = async (id) => {
  return await request({
    url: `${API_ENDPOINTS.VEHICLES}/${id}`,
    method: 'GET'
  })
}

// 获取车辆审核记录
export const getVehiclePendingRecords = async (params) => {
  return await request({
    url: API_ENDPOINTS.VEHICLE_SELF_PENDING,
    method: 'GET',
    data: params
  })
}

// 获取车辆审核详情
export const getVehiclePendingDetail = async (id) => {
  return await request({
    url: `${API_ENDPOINTS.VEHICLE_PENDING}/${id}`,
    method: 'GET'
  })
}

// 删除车辆
export const deleteVehicle = async (id) => {
  return await request({
    url: `${API_ENDPOINTS.VEHICLES_DELETE}/${id}`,
    method: 'DELETE'
  })
}

// 提交车辆审核
export const submitVehicleForReview = async (vehicleData) => {
  return await request({
    url: API_ENDPOINTS.VEHICLE_SUBMIT,
    method: 'POST',
    data: vehicleData
  })
}

// 提交车辆修改
export const updateVehicleForReview = async (vehicleData,id) => {
  return await request({
    url: `${API_ENDPOINTS.VEHICLE_UPDATE}/${id}`,
    method: 'PUT',
    data: vehicleData
  })
}
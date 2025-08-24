import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { vehicleApi } from '@/services/api'
import type { Vehicle } from '@/types'

interface VehicleState {
  vehicles: Vehicle[]
  currentVehicle: Vehicle | null
  auditRecords: Vehicle[]
  loading: boolean
  error: string | null
}

const initialState: VehicleState = {
  vehicles: [],
  currentVehicle: null,
  auditRecords: [],
  loading: false,
  error: null
}

// 获取车辆列表
export const getVehicles = createAsyncThunk(
  'vehicle/getVehicles',
  async (params?: {
    page?: number
    page_size?: number
    plate_number?: string
    brand?: string
    model_name?: string
    status?: string
  }, { rejectWithValue }) => {
    try {
      const response = await vehicleApi.getVehicles(params)
      return response.data.vehicles
    } catch (error: any) {
      return rejectWithValue(error.message || '获取车辆列表失败')
    }
  }
)

// 获取车辆详情
export const getVehicleDetail = createAsyncThunk(
  'vehicle/getVehicleDetail',
  async (vehicleId: string, { rejectWithValue }) => {
    try {
      const response = await vehicleApi.getVehicleDetail(vehicleId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || '获取车辆详情失败')
    }
  }
)

// 获取车辆审核记录
export const getVehicleAuditRecords = createAsyncThunk(
  'vehicle/getVehicleAuditRecords',
  async (params?: {
    page?: number
    page_size?: number
    plate_number?: string
    brand?: string
    model_name?: string
    status?: string
  }, { rejectWithValue }) => {
    try {
      const response = await vehicleApi.getSelfVehicleAuditRecords(params)
      return response.data.vehicles
    } catch (error: any) {
      return rejectWithValue(error.message || '获取审核记录失败')
    }
  }
)

// 删除车辆
export const deleteVehicle = createAsyncThunk(
  'vehicle/deleteVehicle',
  async (vehicleId: string, { rejectWithValue, dispatch }) => {
    try {
      await vehicleApi.deleteVehicle(vehicleId)
      // 重新获取车辆列表
      dispatch(getVehicles())
      return vehicleId
    } catch (error: any) {
      return rejectWithValue(error.message || '删除车辆失败')
    }
  }
)

const vehicleSlice = createSlice({
  name: 'vehicle',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentVehicle: (state) => {
      state.currentVehicle = null
    }
  },
  extraReducers: (builder) => {
    // 获取车辆列表
    builder
      .addCase(getVehicles.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getVehicles.fulfilled, (state, action) => {
        state.loading = false
        state.vehicles = action.payload
        state.error = null
      })
      .addCase(getVehicles.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 获取车辆详情
    builder
      .addCase(getVehicleDetail.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getVehicleDetail.fulfilled, (state, action) => {
        state.loading = false
        state.currentVehicle = action.payload
        state.error = null
      })
      .addCase(getVehicleDetail.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 获取车辆审核记录
    builder
      .addCase(getVehicleAuditRecords.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getVehicleAuditRecords.fulfilled, (state, action) => {
        state.loading = false
        state.auditRecords = action.payload
        state.error = null
      })
      .addCase(getVehicleAuditRecords.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 删除车辆
    builder
      .addCase(deleteVehicle.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.loading = false
        state.vehicles = state.vehicles.filter(v => v.id !== action.payload)
        state.error = null
      })
      .addCase(deleteVehicle.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  }
})

export const { clearError, clearCurrentVehicle } = vehicleSlice.actions
export default vehicleSlice.reducer
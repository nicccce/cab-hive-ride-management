import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { driverApi, authApi } from '@/services/api'
import type { Driver, DriverRegisterRequest } from '@/types'

interface DriverState {
  driverInfo: Driver | null
  auditRecords: Driver[]
  loading: boolean
  error: string | null
}

const initialState: DriverState = {
  driverInfo: null,
  auditRecords: [],
  loading: false,
  error: null
}

// 司机注册
export const registerDriver = createAsyncThunk(
  'driver/registerDriver',
  async (registerData: DriverRegisterRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.driverRegister(registerData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || '司机注册失败')
    }
  }
)

// 获取司机信息
export const getDriverInfo = createAsyncThunk(
  'driver/getDriverInfo',
  async (id?: number, { rejectWithValue }) => {
    try {
      const response = await driverApi.getDriverInfo(id)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || '获取司机信息失败')
    }
  }
)

// 获取司机审核记录
export const getDriverAuditRecords = createAsyncThunk(
  'driver/getDriverAuditRecords',
  async (params?: {
    page?: number
    page_size?: number
    name?: string
    license_number?: string
    status?: string
  }, { rejectWithValue }) => {
    try {
      const response = await driverApi.getSelfAuditRecords(params)
      return response.data.drivers
    } catch (error: any) {
      return rejectWithValue(error.message || '获取审核记录失败')
    }
  }
)

const driverSlice = createSlice({
  name: 'driver',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearDriverInfo: (state) => {
      state.driverInfo = null
    }
  },
  extraReducers: (builder) => {
    // 司机注册
    builder
      .addCase(registerDriver.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerDriver.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(registerDriver.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 获取司机信息
    builder
      .addCase(getDriverInfo.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getDriverInfo.fulfilled, (state, action) => {
        state.loading = false
        state.driverInfo = action.payload
        state.error = null
      })
      .addCase(getDriverInfo.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })

    // 获取司机审核记录
    builder
      .addCase(getDriverAuditRecords.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getDriverAuditRecords.fulfilled, (state, action) => {
        state.loading = false
        state.auditRecords = action.payload
        state.error = null
      })
      .addCase(getDriverAuditRecords.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  }
})

export const { clearError, clearDriverInfo } = driverSlice.actions
export default driverSlice.reducer
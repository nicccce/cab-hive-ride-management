import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AlertService } from '../../services/alert';
import { Alert, GetAlertsParams } from '../../types/alert';

interface AlertState {
  alertList: Alert[];
  pagination: {
    current_page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: AlertState = {
  alertList: [],
  pagination: {
    current_page: 1,
    page_size: 10,
    total_count: 0,
    total_pages: 0,
  },
  loading: false,
  error: null,
};

// 获取预警列表
export const getAlertListAsync = createAsyncThunk(
  'alert/getAlertList',
  async (params: GetAlertsParams) => {
    const response = await AlertService.getAlerts(params);
    return response.data;
  }
);

// 处理预警
export const processAlertAsync = createAsyncThunk(
  'alert/processAlert',
  async (params: { id: number; process_note: string }) => {
    await AlertService.processAlert(params.id, { process_note: params.process_note });
    return { id: params.id, process_note: params.process_note };
  }
);

// 获取Redis中的预警列表
export const getRedisAlertsAsync = createAsyncThunk(
  'alert/getRedisAlerts',
  async () => {
    const response = await AlertService.getRedisAlerts();
    return response.data;
  }
);

const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    clearAlerts: (state) => {
      state.alertList = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取预警列表
      .addCase(getAlertListAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAlertListAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.alertList = action.payload.alerts;
        state.pagination = action.payload.pagination;
      })
      .addCase(getAlertListAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取预警列表失败';
      })
      // 处理预警
      .addCase(processAlertAsync.fulfilled, (state, action) => {
        // 更新已处理的预警状态
        const alert = state.alertList.find(a => a.id === action.meta.arg.id);
        if (alert) {
          alert.is_processed = true;
          alert.process_note = action.meta.arg.process_note;
        }
      })
      // 获取Redis中的预警列表
      .addCase(getRedisAlertsAsync.fulfilled, () => {
        // 这里我们不直接更新state.alertList，因为这个接口主要用于检查新预警
        // 实际的预警列表更新应该通过getAlertListAsync
      });
  },
});

export const { clearAlerts } = alertSlice.actions;
export default alertSlice.reducer;
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardService, DailyStats } from '../../services/dashboard';

interface DashboardState {
  dailyStats: DailyStats | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  dailyStats: null,
  loading: false,
  error: null,
};

// 获取每日统计数据
export const getDailyStatsAsync = createAsyncThunk(
  'dashboard/getDailyStats',
  async () => {
    const response = await dashboardService.getDailyStats();
    return response.data;
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 获取每日统计数据
      .addCase(getDailyStatsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDailyStatsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.dailyStats = action.payload;
      })
      .addCase(getDailyStatsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取统计数据失败';
      });
  },
});

export default dashboardSlice.reducer;
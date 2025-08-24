import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { driverService } from '../../services/driver';
import {
  Driver,
  DriverListParams,
  DriverReview,
  DriverReviewListParams,
  ReviewActionRequest,
  Vehicle
} from '../../types';

interface DriverState {
  driverList: Driver[];
  currentDriver: Driver | null;
  driverVehicles: Vehicle[];
  reviewList: DriverReview[];
  currentReview: DriverReview | null;
  pagination: {
    current_page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
  reviewPagination: {
    current_page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: DriverState = {
  driverList: [],
  currentDriver: null,
  driverVehicles: [],
  reviewList: [],
  currentReview: null,
  pagination: {
    current_page: 1,
    page_size: 10,
    total_count: 0,
    total_pages: 0,
  },
  reviewPagination: {
    current_page: 1,
    page_size: 10,
    total_count: 0,
    total_pages: 0,
  },
  loading: false,
  error: null,
};

// 获取司机列表
export const getDriverListAsync = createAsyncThunk(
  'driver/getDriverList',
  async (params: DriverListParams) => {
    const response = await driverService.getDriverList(params);
    return response.data;
  }
);

// 获取司机详情
export const getDriverDetailAsync = createAsyncThunk(
  'driver/getDriverDetail',
  async (id: number) => {
    const response = await driverService.getDriverDetail(id);
    return response.data;
  }
);

// 获取司机名下车辆列表
export const getDriverVehiclesAsync = createAsyncThunk(
  'driver/getDriverVehicles',
  async (id: number) => {
    const response = await driverService.getDriverVehicles(id);
    return response.data.vehicles;
  }
);

// 封禁司机
export const banDriverAsync = createAsyncThunk(
  'driver/banDriver',
  async (id: number) => {
    await driverService.banDriver(id);
    return id;
  }
);

// 解封司机
export const unbanDriverAsync = createAsyncThunk(
  'driver/unbanDriver',
  async (id: number) => {
    await driverService.unbanDriver(id);
    return id;
  }
);

// 获取司机审核列表
export const getDriverPendingReviewListAsync = createAsyncThunk(
  'driver/getReviewList',
  async (params: DriverReviewListParams) => {
    const response = await driverService.getPendingReviewList(params);
    return response.data;
  }
);

// 获取司机审核详情
export const getDriverReviewDetailAsync = createAsyncThunk(
  'driver/getReviewDetail',
  async (id: number) => {
    const response = await driverService.getReviewDetail(id);
    return response.data;
  }
);

// 审核司机
export const reviewDriverAsync = createAsyncThunk(
  'driver/reviewDriver',
  async ({ id, params }: { id: number; params: ReviewActionRequest }) => {
    await driverService.reviewDriver(id, params);
    return { id, action: params.action };
  }
);

const driverSlice = createSlice({
  name: 'driver',
  initialState,
  reducers: {
    clearCurrentDriver: (state) => {
      state.currentDriver = null;
    },
    clearCurrentReview: (state) => {
      state.currentReview = null;
    },
    clearDriverVehicles: (state) => {
      state.driverVehicles = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取司机列表
      .addCase(getDriverListAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDriverListAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.driverList = action.payload.drivers;
        state.pagination = action.payload.pagination;
      })
      .addCase(getDriverListAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取司机列表失败';
      })
      // 获取司机详情
      .addCase(getDriverDetailAsync.fulfilled, (state, action) => {
        state.currentDriver = action.payload;
      })
      // 获取司机名下车辆列表
      .addCase(getDriverVehiclesAsync.fulfilled, (state, action) => {
        state.driverVehicles = action.payload;
      })
      // 封禁司机
      .addCase(banDriverAsync.fulfilled, (state, action) => {
        const index = state.driverList.findIndex(item => item.id === action.payload);
        if (index !== -1) {
          state.driverList[index].status = 'banned';
        }
      })
      // 解封司机
      .addCase(unbanDriverAsync.fulfilled, (state, action) => {
        const index = state.driverList.findIndex(item => item.id === action.payload);
        if (index !== -1) {
          state.driverList[index].status = 'approved';
        }
      })
      // 获取列表
      .addCase(getDriverPendingReviewListAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDriverPendingReviewListAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.reviewList = action.payload.drivers;
        state.reviewPagination = action.payload.pagination;
      })
      .addCase(getDriverPendingReviewListAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取列表失败';
      })
      // 获取详情
      .addCase(getDriverReviewDetailAsync.fulfilled, (state, action) => {
        state.currentReview = action.payload;
      })
      // 审核司机
      .addCase(reviewDriverAsync.fulfilled, (state, action) => {
        const index = state.reviewList.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.reviewList[index].status = action.payload.action === 'approved' ? 'approved' : 'rejected';
        }
      });
  },
});

export const { clearCurrentDriver, clearCurrentReview, clearDriverVehicles } = driverSlice.actions;
export default driverSlice.reducer;
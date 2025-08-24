import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { vehicleService } from '../../services/vehicle';
import { VehicleReview, VehicleReviewListParams, ReviewActionRequest, Vehicle, VehicleListParams } from '../../types';

interface VehicleState {
  vehicleList: Vehicle[];
  currentVehicle: Vehicle | null;
  reviewList: VehicleReview[];
  currentReview: VehicleReview | null;
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

const initialState: VehicleState = {
  vehicleList: [],
  currentVehicle: null,
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

// 获取车辆列表
export const getVehicleListAsync = createAsyncThunk(
  'vehicle/getVehicleList',
  async (params: VehicleListParams) => {
    const response = await vehicleService.getVehicleList(params);
    return response.data;
  }
);

// 获取车辆详情
export const getVehicleDetailAsync = createAsyncThunk(
  'vehicle/getVehicleDetail',
  async (id: string) => {
    const response = await vehicleService.getVehicleDetail(id);
    return response.data;
  }
);

// 获取车辆审核列表
export const getVehiclePendingReviewListAsync = createAsyncThunk(
  'vehicle/getReviewList',
  async (params: VehicleReviewListParams) => {
    const response = await vehicleService.getPendingReviewList(params);
    return response.data;
  }
);

// 获取车辆审核详情
export const getVehicleReviewDetailAsync = createAsyncThunk(
  'vehicle/getReviewDetail',
  async (id: number) => {
    const response = await vehicleService.getReviewDetail(id);
    return response.data;
  }
);

// 审核车辆
export const reviewVehicleAsync = createAsyncThunk(
  'vehicle/reviewVehicle',
  async ({ id, params }: { id: number; params: ReviewActionRequest }) => {
    await vehicleService.reviewVehicle(id, params);
    return { id, action: params.action };
  }
);

const vehicleSlice = createSlice({
  name: 'vehicle',
  initialState,
  reducers: {
    clearCurrentVehicle: (state) => {
      state.currentVehicle = null;
    },
    clearCurrentReview: (state) => {
      state.currentReview = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取车辆列表
      .addCase(getVehicleListAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getVehicleListAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicleList = action.payload.vehicles;
        state.pagination = action.payload.pagination;
      })
      .addCase(getVehicleListAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取车辆列表失败';
      })
      // 获取车辆详情
      .addCase(getVehicleDetailAsync.fulfilled, (state, action) => {
        state.currentVehicle = action.payload;
      })
      // 获取审核列表
      .addCase(getVehiclePendingReviewListAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getVehiclePendingReviewListAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.reviewList = action.payload.vehicles;
        state.reviewPagination = action.payload.pagination;
      })
      .addCase(getVehiclePendingReviewListAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取列表失败';
      })
      // 获取审核详情
      .addCase(getVehicleReviewDetailAsync.fulfilled, (state, action) => {
        state.currentReview = action.payload;
      })
      // 审核车辆
      .addCase(reviewVehicleAsync.fulfilled, (state, action) => {
        const index = state.reviewList.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.reviewList[index].status = action.payload.action === 'approved' ? 'approved' : 'rejected';
        }
      });
  },
});

export const { clearCurrentVehicle, clearCurrentReview } = vehicleSlice.actions;
export default vehicleSlice.reducer;
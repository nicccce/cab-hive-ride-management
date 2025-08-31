import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { orderService } from '../../services/order';
import { Order, OrderListParams } from '../../types';

interface OrderState {
  orderList: Order[];
  currentOrder: Order | null;
  pagination: {
    current_page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  orderList: [],
  currentOrder: null,
  pagination: {
    current_page: 1,
    page_size: 10,
    total_count: 0,
    total_pages: 0,
  },
  loading: false,
  error: null,
};

// 获取订单列表
export const getOrderListAsync = createAsyncThunk(
  'order/getOrderList',
  async (params: OrderListParams) => {
    const response = await orderService.getOrderList(params);
    return response.data;
  }
);

// 获取订单详情
export const getOrderDetailAsync = createAsyncThunk(
  'order/getOrderDetail',
  async (orderId: number) => {
    const response = await orderService.getOrderDetail(orderId);
    return response.data;
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取订单列表
      .addCase(getOrderListAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOrderListAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.orderList = action.payload.orders;
        state.pagination = action.payload.pagination;
      })
      .addCase(getOrderListAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取订单列表失败';
      })
      // 获取订单详情
      .addCase(getOrderDetailAsync.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
      });
  },
});

export const { clearCurrentOrder } = orderSlice.actions;
export default orderSlice.reducer;
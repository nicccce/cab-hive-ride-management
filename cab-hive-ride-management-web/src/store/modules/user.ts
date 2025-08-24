import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userService } from '../../services/user';
import { User, UserListParams } from '../../types';

interface UserState {
  userList: User[];
  currentUser: User | null;
  pagination: {
    current_page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  userList: [],
  currentUser: null,
  pagination: {
    current_page: 1,
    page_size: 10,
    total_count: 0,
    total_pages: 0,
  },
  loading: false,
  error: null,
};

// 获取用户列表
export const getUserListAsync = createAsyncThunk(
  'user/getUserList',
  async (params: UserListParams) => {
    const response = await userService.getUserList(params);
    return response.data;
  }
);

// 获取用户详情
export const getUserProfileAsync = createAsyncThunk(
  'user/getUserProfile',
  async () => {
    const response = await userService.getUserProfile();
    return response.data;
  }
);

// 重置用户信息
export const resetUserProfileAsync = createAsyncThunk(
  'user/resetUserProfile',
  async () => {
    const response = await userService.resetUserProfile();
    return response.data;
  }
);

// 管理员重置用户信息
export const resetUserByAdminAsync = createAsyncThunk(
  'user/resetUserByAdmin',
  async (userId: number) => {
    const response = await userService.resetUserByAdmin(userId);
    return response.data;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取用户列表
      .addCase(getUserListAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserListAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.userList = action.payload.users;
        state.pagination = action.payload.pagination;
      })
      .addCase(getUserListAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取用户列表失败';
      })
      // 获取用户详情
      .addCase(getUserProfileAsync.fulfilled, (state, action) => {
        state.currentUser = action.payload;
      });
  },
});

export const { clearCurrentUser } = userSlice.actions;
export default userSlice.reducer;
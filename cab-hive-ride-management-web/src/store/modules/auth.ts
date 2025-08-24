import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../services/auth';
import { AdminUser, LoginRequest } from '../../types';

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// 异步登录action
export const loginAsync = createAsyncThunk(
  'auth/login',
  async (params: LoginRequest) => {
    const response = await authService.login(params);
    return response.data;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    },
    setUser: (state, action: PayloadAction<AdminUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        localStorage.setItem('admin_token', action.payload.token);
        localStorage.setItem('admin_user', JSON.stringify(action.payload));
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '登录失败';
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;
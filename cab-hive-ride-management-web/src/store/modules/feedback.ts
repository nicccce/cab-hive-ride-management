import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { feedbackService } from '../../services/feedback';
import {
  Feedback,
  FeedbackListParams,
  FeedbackReplyRequest,
  FeedbackStatusUpdateRequest
} from '../../types';

interface FeedbackState {
  feedbackList: Feedback[];
  currentFeedback: Feedback | null;
  pagination: {
    current_page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: FeedbackState = {
  feedbackList: [],
  currentFeedback: null,
  pagination: {
    current_page: 1,
    page_size: 10,
    total_count: 0,
    total_pages: 0,
  },
  loading: false,
  error: null,
};

// 获取反馈列表
export const getFeedbackListAsync = createAsyncThunk(
  'feedback/getFeedbackList',
  async (params: FeedbackListParams) => {
    const response = await feedbackService.getFeedbackList(params);
    return response.data;
  }
);

// 获取反馈详情
export const getFeedbackDetailAsync = createAsyncThunk(
  'feedback/getFeedbackDetail',
  async (id: number) => {
    const response = await feedbackService.getFeedbackDetail(id);
    return response.data;
  }
);

// 回复反馈
export const replyFeedbackAsync = createAsyncThunk(
  'feedback/replyFeedback',
  async ({ id, params }: { id: number; params: FeedbackReplyRequest }) => {
    await feedbackService.replyFeedback(id, params);
    return { id, reply: params.reply };
  }
);

// 更新反馈状态
export const updateFeedbackStatusAsync = createAsyncThunk(
  'feedback/updateFeedbackStatus',
  async ({ id, params }: { id: number; params: FeedbackStatusUpdateRequest }) => {
    await feedbackService.updateFeedbackStatus(id, params);
    return { id, status: params.status };
  }
);

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    clearCurrentFeedback: (state) => {
      state.currentFeedback = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取反馈列表
      .addCase(getFeedbackListAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getFeedbackListAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.feedbackList = action.payload.feedbacks;
        state.pagination = action.payload.pagination;
      })
      .addCase(getFeedbackListAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取反馈列表失败';
      })
      // 获取反馈详情
      .addCase(getFeedbackDetailAsync.fulfilled, (state, action) => {
        state.currentFeedback = action.payload;
      })
      // 回复反馈
      .addCase(replyFeedbackAsync.fulfilled, (state, action) => {
        const index = state.feedbackList.findIndex(item => item.id === action.payload.id);
        if (index !== -1 && state.currentFeedback) {
          state.feedbackList[index].reply = action.payload.reply;
          state.feedbackList[index].status = 'processing';
          state.currentFeedback.reply = action.payload.reply;
          state.currentFeedback.status = 'processing';
        }
      })
      // 更新反馈状态
      .addCase(updateFeedbackStatusAsync.fulfilled, (state, action) => {
        const index = state.feedbackList.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.feedbackList[index].status = action.payload.status;
        }
        if (state.currentFeedback && state.currentFeedback.id === action.payload.id) {
          state.currentFeedback.status = action.payload.status;
        }
      });
  },
});

export const { clearCurrentFeedback } = feedbackSlice.actions;
export default feedbackSlice.reducer;
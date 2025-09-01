// 反馈相关类型
export interface Feedback {
  id: number;
  user_open_id: string;
  order_id: number;
  type: 'complaint' | 'suggestion' | 'consult' | 'praise' | 'other';
  level: number; // 1-5级，5级最高
  title: string;
  content: string;
  status: 'open' | 'processing' | 'closed';
  reply: string;
  reply_user_id: number | null;
  create_time: number; // 时间戳
  update_time: number; // 时间戳
}

export interface FeedbackListResponse {
  feedbacks: Feedback[];
  pagination: {
    current_page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}

export interface FeedbackListParams {
  page?: number;
  page_size?: number;
  status?: string;
  type?: string;
  user_open_id?: string;
  order_id?: number;
}

export interface FeedbackReplyRequest {
  reply: string;
}

export interface FeedbackStatusUpdateRequest {
  status: 'open' | 'processing' | 'closed';
}
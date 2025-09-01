// 通用类型定义
export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
  timestamp: string;
}

// 分页类型
export interface Pagination {
  current_page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
}

// 管理员相关类型
export interface AdminUser {
  user_id: string;
  role: string;
  permissions: string[];
  token: string;
  expires_in: number;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

// 用户相关类型
export interface User {
  id: number;
  role_id: number;
  nick_name: string;
  avatar_url?: string;
  open_id: string;
}

export interface UserListResponse {
  users: User[];
  pagination: Pagination;
}

export interface UserListParams {
  page?: number;
  page_size?: number;
  nick_name?: string;
  open_id?: string;
}

// 司机相关类型
export interface Driver {
  id: number;
  open_id: string;
  license_number: string;
  name: string;
  phone: string;
  license_image_url: string;
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  comment?: string;
  submit_time?: string;
  review_time?: string;
}

export interface DriverListResponse {
  drivers: Driver[];
  pagination: Pagination;
}

export interface DriverListParams {
  page?: number;
  page_size?: number;
  name?: string;
  phone?: string;
  license_number?: string;
  status?: string;
}

// 司机审核相关类型
export interface DriverReview {
  id: number;
  created_at: string;
  updated_at: string;
  open_id: string;
  license_number: string;
  name: string;
  phone: string;
  license_image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  comment: string;
  action_type: 'register' | 'update';
  driver_id: number;
}

export interface DriverReviewListResponse {
  drivers: DriverReview[];
  pagination: Pagination;
}

export interface DriverReviewListParams {
  page?: number;
  page_size?: number;
  name?: string;
  license_number?: string;
  status?: string;
}

export interface ReviewActionRequest {
  action: 'approved' | 'rejected';
  comment: string;
}

// 车辆审核相关类型
export interface VehicleReview {
  id: number;
  driver_id: string;
  plate_number: string;
  vehicle_type: string;
  brand: string;
  model_name: string;
  color: string;
  year: number;
  registration_image: string;
  insurance_expiry: string;
  status: 'pending' | 'approved' | 'rejected';
  comment: string;
  submit_time: string;
}

export interface VehicleReviewListResponse {
  vehicles: VehicleReview[];
  pagination: Pagination;
}

export interface VehicleReviewListParams {
  page?: number;
  page_size?: number;
  plate_number?: string;
  brand?: string;
  model_name?: string;
  status?: string;
  }
  
  // 订单相关类型
  export interface OrderLocation {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
    province?: string;
    city?: string;
    district?: string;
  }
  
  export interface OrderRoutePoint {
    latitude: number;
    longitude: number;
  }
  
  export interface OrderStep {
    instruction: string;
    polyline_idx: number[];
    road_name: string;
    dir_desc: string;
    distance: number;
    act_desc: string;
    accessorial_desc: string;
  }
  
  export interface Order {
    id: number;
    user_open_id: string;
    driver_open_id: string;
    vehicle_id: number;
    start_location: OrderLocation;
    end_location: OrderLocation;
    route_points: OrderRoutePoint[];
    start_time: string;
    end_time: string | null;
    distance: number;
    duration: number;
    fare: number;
    tolls: number;
    status: 'waiting_for_driver' | 'driver_arriving' | 'in_progress' | 'waiting_for_payment' | 'completed' | 'cancelled' | 'reserved';
    payment_time: string | null;
    comment: string;
    cancel_reason: string;
    rating: number;
    reserve_time: string;
  }
  
  export interface OrderListResponse {
    orders: Order[];
    pagination: Pagination;
  }
  
  export interface OrderListParams {
    page?: number;
    page_size?: number;
    status?: string;
    user_open_id?: string;
    driver_open_id?: string;
    start_time?: string;
    end_time?: string;
  }
// 车辆相关类型
export interface Vehicle {
  id: string;
  driver_id: string;
  plate_number: string;
  vehicle_type: string;
  brand: string;
  model: string;
  status: 'pending' | 'approved' | 'rejected';
  submit_time: string;
  review_time: string;
  registration_image?: string;
}

export interface VehicleListResponse {
  vehicles: Vehicle[];
  pagination: Pagination;
}

export interface VehicleListParams {
  page?: number;
  page_size?: number;
  plate_number?: string;
  brand?: string;
  model_name?: string;
  status?: string;
}
export * from './feedback';
export * from './alert';
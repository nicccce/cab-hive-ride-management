export interface Alert {
  id: number;
  order_id: number;
  content: string;
  alert_time: string;
  is_processed: boolean;
  process_note: string;
  alert_type: string;
}

export interface AlertListResponse {
  alerts: Alert[];
  pagination: {
    current_page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}

export interface ProcessAlertRequest {
  process_note: string;
}

export interface GetAlertsParams {
  page?: number;
  page_size?: number;
  is_processed?: string;
  alert_type?: string;
}
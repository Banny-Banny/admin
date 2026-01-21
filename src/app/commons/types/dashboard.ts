// ============================================================================
// 대시보드 관련 타입 정의
// ============================================================================

// 공통 API 응답 wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// 요청 파라미터 타입
export interface DashboardChartsParams {
  period?: 'day' | 'week' | 'month';
  startDate?: string;
  endDate?: string;
}

export interface UserTrendsParams {
  period?: '90d';
}

// 응답 타입 (백엔드 실제 응답에 맞춤)
export interface DashboardSummaryData {
  signups: number;
  newInquiries: number;
  dau: number;
}

export interface DashboardChartsItem {
  period: string;
  signups: number;
  revenue: number;
}

export interface DashboardChartsData {
  period: 'day' | 'week' | 'month';
  startDate: string;
  endDate: string;
  items: DashboardChartsItem[];
}

export interface UserTrendsItem {
  date: string;
  joined: number;
  withdrawn: number;
}

export type UserTrendsData = UserTrendsItem[];

// API 응답 타입 (wrapper 포함)
export type DashboardSummaryResponse = ApiResponse<DashboardSummaryData>;
export type DashboardChartsResponse = ApiResponse<DashboardChartsData>;
export type UserTrendsResponse = ApiResponse<UserTrendsData>;

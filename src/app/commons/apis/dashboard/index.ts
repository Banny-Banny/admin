import { apiClient } from '../../provider/api-provider/api-client';
import type {
  DashboardSummaryResponse,
  DashboardSummaryData,
  DashboardChartsResponse,
  DashboardChartsData,
  DashboardChartsParams,
  UserTrendsResponse,
  UserTrendsData,
  UserTrendsParams,
} from '../../types/dashboard';

// ============================================================================
// 대시보드 API 함수
// ============================================================================

/**
 * 대시보드 요약 지표 조회
 * @returns 대시보드 요약 지표 (signups, newInquiries, dau)
 */
export async function getDashboardSummary(): Promise<DashboardSummaryData> {
  const response = await apiClient.get<DashboardSummaryResponse>('/api/admin/dashboard/summary');
  // apiClient.get()이 이미 response.data를 반환하므로, response는 DashboardSummaryResponse 타입
  return response.data;
}

/**
 * 기간별 차트 데이터 조회
 * @param params 조회 파라미터 (period, startDate, endDate)
 * @returns 차트 데이터 (labels, data)
 */
export async function getDashboardCharts(
  params?: DashboardChartsParams
): Promise<DashboardChartsData> {
  const queryParams = new URLSearchParams();

  if (params?.period) {
    queryParams.append('period', params.period);
  }
  if (params?.startDate) {
    queryParams.append('startDate', params.startDate);
  }
  if (params?.endDate) {
    queryParams.append('endDate', params.endDate);
  }

  const queryString = queryParams.toString();
  const url = `/api/admin/dashboard/charts${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<DashboardChartsResponse>(url);
  return response.data;
}

/**
 * 사용자 가입/탈퇴 추이 조회
 * @param params 조회 파라미터 (period)
 * @returns 사용자 추이 데이터 (dates, signups, withdrawals)
 */
export async function getUserTrends(
  params?: UserTrendsParams
): Promise<UserTrendsData> {
  const queryParams = new URLSearchParams();

  if (params?.period) {
    queryParams.append('period', params.period);
  }

  const queryString = queryParams.toString();
  const url = `/api/admin/dashboard/user-trends${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<UserTrendsResponse>(url);
  return response.data;
}

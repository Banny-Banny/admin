import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  getDashboardSummary,
  getDashboardCharts,
  getUserTrends,
} from '../apis/dashboard';
import type {
  DashboardSummaryData,
  DashboardChartsData,
  DashboardChartsParams,
  UserTrendsData,
  UserTrendsParams,
} from '../types/dashboard';

/**
 * 대시보드 요약 지표 조회 훅
 * @returns React Query 결과 (data, isLoading, error 등)
 */
export function useDashboardSummary(): UseQueryResult<DashboardSummaryData> {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => getDashboardSummary(),
  });
}

/**
 * 기간별 차트 데이터 조회 훅
 * @param params 조회 파라미터 (period, startDate, endDate)
 * @returns React Query 결과 (data, isLoading, error 등)
 */
export function useDashboardCharts(
  params?: DashboardChartsParams
): UseQueryResult<DashboardChartsData> {
  return useQuery({
    queryKey: ['dashboard', 'charts', params],
    queryFn: () => getDashboardCharts(params),
    enabled: true, // 항상 활성화
  });
}

/**
 * 사용자 가입/탈퇴 추이 조회 훅
 * @param params 조회 파라미터 (period)
 * @returns React Query 결과 (data, isLoading, error 등)
 */
export function useUserTrends(
  params?: UserTrendsParams
): UseQueryResult<UserTrendsData> {
  return useQuery({
    queryKey: ['dashboard', 'user-trends', params],
    queryFn: () => getUserTrends(params),
  });
}

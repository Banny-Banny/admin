import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelPayment,
  getPaymentLogs,
  reissueReceipt,
} from '../apis/admin/payments';
import type {
  CancelPaymentRequest,
  PaymentLogsFilters,
  PaymentLogsData,
  ReissueReceiptRequest,
} from '../types/payments';

/**
 * 결제 로그 조회 훅
 * @param filters 필터 파라미터
 * @returns React Query 결과 (data: PaymentLogsData, isLoading, error 등)
 */
export function usePaymentLogs(filters: PaymentLogsFilters = {}) {
  return useQuery<PaymentLogsData>({
    queryKey: ['payments', 'logs', filters],
    queryFn: () => getPaymentLogs(filters),
  });
}

/**
 * 결제 취소 훅
 * @returns React Query mutation (mutate, mutateAsync, isLoading 등)
 */
export function useCancelPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CancelPaymentRequest }) =>
      cancelPayment(id, data),
    onSuccess: () => {
      // 결제 취소 성공 시 결제 관련 쿼리 무효화하여 자동 새로고침
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] }); // 주문 목록도 새로고침
    },
  });
}

/**
 * 영수증 재발급 훅
 * @returns React Query mutation (mutate, mutateAsync, isLoading 등)
 */
export function useReissueReceipt() {
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: ReissueReceiptRequest }) =>
      reissueReceipt(orderId, data),
  });
}

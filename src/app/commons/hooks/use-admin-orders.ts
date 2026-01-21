import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchOrderDetail,
  fetchOrders,
  updateOrderStatus,
} from '../apis/admin/orders';
import type {
  OrderDetailData,
  OrderFilters,
  OrderListData,
  OrderStatusUpdateData,
  OrderStatusUpdateRequest,
} from '../types/orders';

/**
 * 주문 목록 조회 훅
 * @param filters 필터 파라미터
 * @returns React Query 결과 (data, isLoading, error 등)
 */
export function useOrders(filters: OrderFilters = {}) {
  return useQuery<OrderListData>({
    queryKey: ['orders', filters],
    queryFn: () => fetchOrders(filters),
  });
}

/**
 * 주문 상세 조회 훅
 * @param id 주문 ID
 * @returns React Query 결과 (data: OrderDetailData - nested 구조)
 */
export function useOrderDetail(id?: string) {
  return useQuery<OrderDetailData>({
    queryKey: ['orders', 'detail', id],
    queryFn: () => fetchOrderDetail(id ?? ''),
    enabled: Boolean(id),
  });
}

/**
 * 주문 상태 변경 훅
 * @param id 주문 ID
 * @returns React Query mutation (mutate, mutateAsync, isLoading 등)
 */
export function useUpdateOrderStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation<OrderStatusUpdateData, Error, OrderStatusUpdateRequest>({
    mutationKey: ['orders', 'status', id],
    mutationFn: (body: OrderStatusUpdateRequest) => updateOrderStatus(id, body),
    onSuccess: () => {
      // 상태 변경 성공 시 목록 및 상세 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', id] });
    },
  });
}

import { apiClient } from '../../provider/api-provider/api-client';
import type {
  OrderDetailData,
  OrderDetailResponse,
  OrderFilters,
  OrderListData,
  OrderListResponse,
  OrderStatusUpdateData,
  OrderStatusUpdateRequest,
} from '../../types/orders';

/**
 * 주문 목록 조회
 * @param filters 필터 파라미터 (status, paymentStatus, userId(UUID), userSearch(닉네임/이메일), startDate, endDate, limit, offset)
 * @returns 주문 목록 데이터
 */
export async function fetchOrders(
  filters: OrderFilters = {}
): Promise<OrderListData> {
  const queryParams = new URLSearchParams();

  // 기본값 설정: status/paymentStatus=ALL, limit=20, offset=0
  const status = filters.status || 'ALL';
  const paymentStatus = filters.paymentStatus || 'ALL';
  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;

  if (status !== 'ALL') {
    queryParams.append('status', status);
  }
  if (paymentStatus !== 'ALL') {
    queryParams.append('paymentStatus', paymentStatus);
  }
  // userId는 UUID 형식만 허용
  if (filters.userId && filters.userId.trim() !== '') {
    queryParams.append('userId', filters.userId.trim());
  }
  // userSearch는 닉네임/이메일 검색용
  if (filters.userSearch && filters.userSearch.trim() !== '') {
    queryParams.append('userSearch', filters.userSearch.trim());
  }
  if (filters.startDate && filters.startDate.trim() !== '') {
    queryParams.append('startDate', filters.startDate.trim());
  }
  if (filters.endDate && filters.endDate.trim() !== '') {
    queryParams.append('endDate', filters.endDate.trim());
  }
  queryParams.append('limit', limit.toString());
  queryParams.append('offset', offset.toString());

  const queryString = queryParams.toString();
  const url = `/api/admin/dashboard/orders${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<OrderListResponse>(url);
  return response.data;
}

/**
 * 주문 상세 조회
 * @param id 주문 ID
 * @returns 주문 상세 데이터 (order, product, user, payment nested 구조)
 */
export async function fetchOrderDetail(id: string): Promise<OrderDetailData> {
  const response = await apiClient.get<OrderDetailResponse>(
    `/api/admin/dashboard/orders/${id}`
  );
  return response.data;
}

/**
 * 주문 상태 변경
 * @param id 주문 ID
 * @param body 상태 변경 요청 (status: OrderStatus)
 * @returns 업데이트된 주문 데이터 (order_id, order_status)
 */
export async function updateOrderStatus(
  id: string,
  body: OrderStatusUpdateRequest
): Promise<OrderStatusUpdateData> {
  const response = await apiClient.patch<{ success: boolean; data: OrderStatusUpdateData }>(
    `/api/admin/dashboard/orders/${id}/status`,
    body
  );
  return response.data;
}

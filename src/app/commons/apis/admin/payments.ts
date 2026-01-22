import { apiClient } from '../../provider/api-provider/api-client';
import type {
  CancelPaymentRequest,
  CancelPaymentResponse,
  CancelPaymentData,
  PaymentLogsFilters,
  PaymentLogsResponse,
  PaymentLogsData,
  ReissueReceiptRequest,
  ReissueReceiptResponse,
  ReissueReceiptData,
} from '../../types/payments';

/**
 * 결제 취소
 * @param id 결제 ID
 * @param data 취소 요청 데이터 (취소 사유, 취소 금액, 환불 계좌 정보)
 * @returns 결제 취소 결과 데이터
 */
export async function cancelPayment(
  id: string,
  data: CancelPaymentRequest
): Promise<CancelPaymentData> {
  const response = await apiClient.post<CancelPaymentResponse>(
    `/api/admin/dashboard/payments/${id}/cancel`,
    data
  );
  return response.data;
}

/**
 * 결제 로그 조회
 * @param filters 필터 파라미터 (status, userId, startDate, endDate, limit, offset)
 * @returns 결제 로그 목록 데이터
 */
export async function getPaymentLogs(
  filters: PaymentLogsFilters = {}
): Promise<PaymentLogsData> {
  const queryParams = new URLSearchParams();

  // 기본값 설정
  const status = filters.status || 'ALL';
  const limit = filters.limit ?? 20;
  const offset = filters.offset ?? 0;

  if (status !== 'ALL') {
    queryParams.append('status', status);
  }
  if (filters.userId && filters.userId.trim() !== '') {
    queryParams.append('userId', filters.userId.trim());
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
  const url = `/api/admin/dashboard/payments/logs${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<PaymentLogsResponse>(url);
  return response.data;
}

/**
 * 영수증 재발급
 * @param orderId 주문 ID
 * @param data 재발급 요청 데이터 (이메일 주소)
 * @returns 영수증 재발급 결과 데이터
 */
export async function reissueReceipt(
  orderId: string,
  data: ReissueReceiptRequest
): Promise<ReissueReceiptData> {
  const response = await apiClient.post<ReissueReceiptResponse>(
    `/api/admin/dashboard/receipts/${orderId}/issue`,
    data
  );
  return response.data;
}

// ============================================================================
// 결제 및 영수증 관리 타입 정의
// ============================================================================

// 공통 API 응답 wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 결제 상태 enum
export type PaymentStatus = 'READY' | 'PAID' | 'CANCELED' | 'FAILED';

// ============================================================================
// 결제 취소 관련 타입
// ============================================================================

/**
 * 환불 계좌 정보 (선택사항)
 */
export interface RefundReceiveAccount {
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
}

/**
 * 결제 취소 요청
 */
export interface CancelPaymentRequest {
  cancelReason: string;
  cancelAmount: number;
  refundReceiveAccount?: RefundReceiveAccount;
}

/**
 * 결제 취소 응답 데이터
 * 백엔드 API 응답은 snake_case를 사용
 */
export interface CancelPaymentData {
  payment_id: string;
  cancel_id?: string;
  cancel_amount: number;
  status: 'CANCELED';
  canceled_at: string;
}

/**
 * 결제 취소 응답
 */
export type CancelPaymentResponse = ApiResponse<CancelPaymentData>;

// ============================================================================
// 결제 로그 관련 타입
// ============================================================================

/**
 * 결제 로그
 * 백엔드 API 응답은 snake_case를 사용
 */
export interface PaymentLog {
  payment_id: string;
  order_id: string;
  payment_key?: string;
  status: PaymentStatus;
  toss_status?: string;
  method?: string;
  fail_code?: string | null;
  fail_message?: string | null;
  amount: number;
  requested_at: string;
  approved_at?: string;
  created_at?: string;
  user?: {
    id: string;
    nickname?: string;
    email?: string;
    phone_number?: string;
  };
}

/**
 * 결제 로그 필터
 */
export interface PaymentLogsFilters {
  status?: 'READY' | 'PAID' | 'CANCELED' | 'FAILED' | 'ALL';
  userId?: string;
  userSearch?: string; // 닉네임 또는 이메일 통합 검색
  startDate?: string; // ISO 8601
  endDate?: string; // ISO 8601
  limit?: number; // 기본값: 20
  offset?: number; // 기본값: 0
}

/**
 * 결제 로그 목록 응답 데이터
 */
export interface PaymentLogsData {
  items: PaymentLog[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * 결제 로그 목록 응답
 */
export type PaymentLogsResponse = ApiResponse<PaymentLogsData>;

// ============================================================================
// 영수증 재발급 관련 타입
// ============================================================================

/**
 * 영수증 발급 상태
 */
export type ReceiptStatus = 'PENDING' | 'SENT' | 'FAILED';

/**
 * 영수증 재발급 요청
 */
export interface ReissueReceiptRequest {
  email: string;
}

/**
 * 영수증 재발급 응답 데이터
 * 백엔드 API 응답은 snake_case를 사용
 */
export interface ReissueReceiptData {
  order_id: string;
  payment_id?: string;
  receipt_url?: string;
  email?: string;
  issued_at?: string;
  status?: ReceiptStatus;
}

/**
 * 영수증 재발급 응답
 */
export type ReissueReceiptResponse = ApiResponse<ReissueReceiptData>;

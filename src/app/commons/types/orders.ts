// ============================================================================
// 주문 관리 타입 정의
// ============================================================================

// 공통 API 응답 wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// 주문 상태 enum
export type OrderStatus = 'PENDING' | 'PENDING_PAYMENT' | 'PAID' | 'CANCELED' | 'FAILED';

// 결제 상태 enum
export type PaymentStatus = 'READY' | 'PAID' | 'CANCELED' | 'FAILED' | 'PENDING_PAYMENT';

// UI용 상태 옵션
export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'PENDING',
  'PENDING_PAYMENT',
  'PAID',
  'CANCELED',
  'FAILED',
];
export const PAYMENT_STATUS_OPTIONS: PaymentStatus[] = [
  'READY',
  'PAID',
  'CANCELED',
  'FAILED',
  'PENDING_PAYMENT',
];

// 상품 정보 (목록용)
export interface Product {
  id: string;
  name: string;
  product_type: string;
}

// 상품 정보 (상세용 - 추가 필드 포함)
export interface ProductDetail extends Product {
  price: number;
  description: string | null;
}

// 결제 정보 (목록용 - nullable)
export interface Payment {
  id: string;
  status: PaymentStatus;
  amount: number;
  approved_at: string | null;
  method: string;
}

// 결제 취소 정보
export interface PaymentCancel {
  cancelAmount: number;
  canceledAt: string;
  cancelReason: string;
}

// 결제 정보 (상세용 - 추가 필드 포함)
export interface PaymentDetail extends Payment {
  payment_key: string;
  receipt_url: string | null;
  cancels: PaymentCancel[];
}

// 유저 정보
export interface User {
  id: string;
  nickname: string;
  email: string;
  phone_number: string;
}

// 주문 항목
export interface OrderItem {
  order_id: string;
  order_status: OrderStatus;
  total_amount: number;
  created_at: string;
  product: Product;
  payment: Payment | null;
  user: User;
}

// 페이지네이션 메타데이터
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
}

// 주문 목록 데이터
export interface OrderListData {
  items: OrderItem[];
  total: number;
  limit: number;
  offset: number;
}

// 필터 파라미터
export interface OrderFilters {
  status?: OrderStatus | 'ALL';
  paymentStatus?: PaymentStatus | 'ALL';
  userId?: string; // UUID 형식만 허용
  userSearch?: string; // 닉네임/이메일 검색용
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// 주문 목록 응답
export type OrderListResponse = ApiResponse<OrderListData>;

// 주문 상세 데이터 (nested 구조)
export interface OrderDetailOrder {
  id: string;
  status: OrderStatus;
  total_amount: number;
  time_option: string;
  custom_open_at: string | null;
  headcount: number;
  photo_count: number;
  add_music: boolean;
  add_video: boolean;
  capsule_title: string;
  created_at: string;
  updated_at: string;
}

export interface OrderDetailData {
  order: OrderDetailOrder;
  product: ProductDetail;
  user: User;
  payment: PaymentDetail | null;
}

// 주문 상세 응답
export type OrderDetailResponse = ApiResponse<OrderDetailData>;

// 주문 상태 변경 요청
export interface OrderStatusUpdateRequest {
  status: OrderStatus;
}

// 주문 상태 변경 응답 데이터
export interface OrderStatusUpdateData {
  order_id: string;
  order_status: OrderStatus;
}

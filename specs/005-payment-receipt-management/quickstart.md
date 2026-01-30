# Quick Start: 관리자 대시보드 - 결제 및 영수증 관리 기능

**Feature**: 005-payment-receipt-management  
**Date**: 2026-01-18

이 문서는 개발자가 결제 취소, 결제 로그 조회, 영수증 재발급 기능을 빠르게 이해하고 구현을 시작할 수 있도록 도와줍니다.

## 개요

관리자가 결제를 취소하고, 결제 로그를 조회하며, 영수증을 재발급할 수 있는 기능입니다.

### 주요 기능

1. **결제 취소**: 완료된 결제를 취소하고 환불 처리
2. **결제 로그 조회**: 결제 시도, 성공, 실패 로그를 필터링하여 조회
3. **영수증 재발급**: 주문에 대한 영수증을 재발급

## 아키텍처 개요

### 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **HTTP Client**: Axios
- **Data Fetching**: React Query (@tanstack/react-query)
- **Testing**: Playwright (E2E)

### 파일 구조

```
src/app/
├── commons/
│   ├── apis/admin/payments.ts      # API 함수
│   ├── hooks/use-payments.ts        # React Query 훅
│   └── types/payments.ts            # TypeScript 타입
├── components/
│   └── PaymentsPage/                # 페이지 컴포넌트
└── tests/api-tests/payments/        # E2E 테스트
```

## API 엔드포인트

### 1. 결제 취소

```typescript
POST /api/admin/dashboard/payments/{id}/cancel
```

**Request Body**:
```typescript
{
  cancelReason: string;      // 취소 사유
  cancelAmount: number;      // 취소 금액
  refundReceiveAccount?: {   // 환불 계좌 정보 (선택사항)
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
  }
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    paymentId: string;
    cancelId: string;
    cancelAmount: number;
    status: 'CANCELED';
    canceledAt: string;
  };
  message?: string;
}
```

### 2. 결제 로그 조회

```typescript
GET /api/admin/dashboard/payments/logs
```

**Query Parameters**:
- `status`: 'READY' | 'PAID' | 'CANCELED' | 'FAILED' | 'ALL' (기본값: 'ALL')
- `userId`: string (선택)
- `startDate`: string (ISO 8601, 선택)
- `endDate`: string (ISO 8601, 선택)
- `limit`: number (기본값: 20)
- `offset`: number (기본값: 0)

**Response**:
```typescript
{
  success: boolean;
  data: {
    items: PaymentLog[];
    total: number;
    limit: number;
    offset: number;
  };
}
```

### 3. 영수증 재발급

```typescript
POST /api/admin/dashboard/receipts/{orderId}/issue
```

**Request Body**:
```typescript
{
  email: string;  // 발급할 이메일 주소
}
```

**Response**:
```typescript
{
  success: boolean;
  data: {
    orderId: string;
    email: string;
    issuedAt: string;
    status: 'PENDING' | 'SENT' | 'FAILED';
  };
  message?: string;
}
```

## 구현 가이드

### 1. 타입 정의

`src/app/commons/types/payments.ts`:

```typescript
// 결제 취소 요청
export interface CancelPaymentRequest {
  cancelReason: string;
  cancelAmount: number;
  refundReceiveAccount?: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
  };
}

// 결제 취소 응답
export interface CancelPaymentResponse {
  success: boolean;
  data: {
    paymentId: string;
    cancelId: string;
    cancelAmount: number;
    status: 'CANCELED';
    canceledAt: string;
  };
  message?: string;
}

// 결제 로그 필터
export interface PaymentLogsFilters {
  status?: 'READY' | 'PAID' | 'CANCELED' | 'FAILED' | 'ALL';
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// 결제 로그
export interface PaymentLog {
  id: string;
  paymentId: string;
  userId: string;
  status: 'READY' | 'PAID' | 'CANCELED' | 'FAILED';
  amount: number;
  attemptedAt: string;
  failureReason?: string | null;
}

// 결제 로그 응답
export interface PaymentLogsResponse {
  success: boolean;
  data: {
    items: PaymentLog[];
    total: number;
    limit: number;
    offset: number;
  };
}

// 영수증 재발급 요청
export interface ReissueReceiptRequest {
  email: string;
}

// 영수증 재발급 응답
export interface ReissueReceiptResponse {
  success: boolean;
  data: {
    orderId: string;
    email: string;
    issuedAt: string;
    status: 'PENDING' | 'SENT' | 'FAILED';
  };
  message?: string;
}
```

### 2. API 함수 작성

`src/app/commons/apis/admin/payments.ts`:

```typescript
import { apiClient } from '../../provider/api-provider/api-client';
import type {
  CancelPaymentRequest,
  CancelPaymentResponse,
  PaymentLogsFilters,
  PaymentLogsResponse,
  ReissueReceiptRequest,
  ReissueReceiptResponse,
} from '../../types/payments';

/**
 * 결제 취소
 */
export async function cancelPayment(
  id: string,
  data: CancelPaymentRequest
): Promise<CancelPaymentResponse> {
  return apiClient.post<CancelPaymentResponse>(
    `/api/admin/dashboard/payments/${id}/cancel`,
    data
  );
}

/**
 * 결제 로그 조회
 */
export async function getPaymentLogs(
  filters: PaymentLogsFilters = {}
): Promise<PaymentLogsResponse> {
  const params = new URLSearchParams();
  
  if (filters.status) params.append('status', filters.status);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  const queryString = params.toString();
  const url = `/api/admin/dashboard/payments/logs${queryString ? `?${queryString}` : ''}`;
  
  return apiClient.get<PaymentLogsResponse>(url);
}

/**
 * 영수증 재발급
 */
export async function reissueReceipt(
  orderId: string,
  data: ReissueReceiptRequest
): Promise<ReissueReceiptResponse> {
  return apiClient.post<ReissueReceiptResponse>(
    `/api/admin/dashboard/receipts/${orderId}/issue`,
    data
  );
}
```

### 3. React Query 훅 작성

`src/app/commons/hooks/use-payments.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelPayment,
  getPaymentLogs,
  reissueReceipt,
} from '../apis/admin/payments';
import type {
  CancelPaymentRequest,
  PaymentLogsFilters,
  ReissueReceiptRequest,
} from '../types/payments';

/**
 * 결제 로그 조회 훅
 */
export function usePaymentLogs(filters: PaymentLogsFilters = {}) {
  return useQuery({
    queryKey: ['payments', 'logs', filters],
    queryFn: () => getPaymentLogs(filters),
  });
}

/**
 * 결제 취소 훅
 */
export function useCancelPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CancelPaymentRequest }) =>
      cancelPayment(id, data),
    onSuccess: () => {
      // 결제 로그 쿼리 무효화하여 자동 새로고침
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

/**
 * 영수증 재발급 훅
 */
export function useReissueReceipt() {
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: ReissueReceiptRequest }) =>
      reissueReceipt(orderId, data),
  });
}
```

### 4. 컴포넌트 사용 예시

```typescript
import { usePaymentLogs, useCancelPayment, useReissueReceipt } from '@/app/commons/hooks/use-payments';

function PaymentsPage() {
  const [filters, setFilters] = useState<PaymentLogsFilters>({});
  const { data, isLoading, error } = usePaymentLogs(filters);
  const cancelPayment = useCancelPayment();
  const reissueReceipt = useReissueReceipt();

  const handleCancel = async (paymentId: string) => {
    try {
      await cancelPayment.mutateAsync({
        id: paymentId,
        data: {
          cancelReason: '고객 요청',
          cancelAmount: 50000,
        },
      });
      // 성공 메시지 표시
    } catch (error) {
      // 에러 메시지 표시
    }
  };

  const handleReissue = async (orderId: string, email: string) => {
    try {
      await reissueReceipt.mutateAsync({
        orderId,
        data: { email },
      });
      // 성공 메시지 표시
    } catch (error) {
      // 에러 메시지 표시
    }
  };

  // ... UI 렌더링
}
```

## E2E 테스트 작성

`src/app/tests/api-tests/payments/payments-api.spec.ts`:

```typescript
import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://be-production-8aa2.up.railway.app';

async function getAdminToken(request: APIRequestContext): Promise<string | null> {
  // ... 토큰 획득 로직
}

test.describe('결제 관리 API 테스트', () => {
  let authToken: string | null = null;

  test.beforeAll(async ({ request }) => {
    authToken = await getAdminToken(request);
  });

  test.describe('1. POST /api/admin/dashboard/payments/{id}/cancel', () => {
    test('결제 취소 - 성공', async ({ request }) => {
      test.skip(!authToken, '인증 토큰 없음');

      const response = await request.post(
        `${API_BASE_URL}/api/admin/dashboard/payments/payment-123/cancel`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            cancelReason: '고객 요청',
            cancelAmount: 50000,
          },
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('success', true);
      expect(body.data).toHaveProperty('status', 'CANCELED');
    });
  });

  test.describe('2. GET /api/admin/dashboard/payments/logs', () => {
    test('결제 로그 조회 - 기본값', async ({ request }) => {
      test.skip(!authToken, '인증 토큰 없음');

      const response = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/payments/logs`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('success', true);
      expect(body.data).toHaveProperty('items');
      expect(Array.isArray(body.data.items)).toBe(true);
    });

    test('결제 로그 조회 - 필터 조합', async ({ request }) => {
      test.skip(!authToken, '인증 토큰 없음');

      const response = await request.get(
        `${API_BASE_URL}/api/admin/dashboard/payments/logs?status=PAID&limit=10&offset=0`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.data.items.every((log: any) => log.status === 'PAID')).toBe(true);
    });
  });

  test.describe('3. POST /api/admin/dashboard/receipts/{orderId}/issue', () => {
    test('영수증 재발급 - 성공', async ({ request }) => {
      test.skip(!authToken, '인증 토큰 없음');

      const response = await request.post(
        `${API_BASE_URL}/api/admin/dashboard/receipts/order-123/issue`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
          data: {
            email: 'customer@example.com',
          },
        }
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('success', true);
      expect(body.data).toHaveProperty('orderId', 'order-123');
      expect(body.data).toHaveProperty('email', 'customer@example.com');
    });
  });
});
```

## 다음 단계

1. **타입 정의 작성**: `src/app/commons/types/payments.ts`
2. **API 함수 작성**: `src/app/commons/apis/admin/payments.ts`
3. **React Query 훅 작성**: `src/app/commons/hooks/use-payments.ts`
4. **E2E 테스트 작성**: `src/app/tests/api-tests/payments/payments-api.spec.ts`
5. **E2E 테스트 통과 확인**
6. **UI 컴포넌트 작성**: `src/app/components/PaymentsPage/`
7. **UI에 API 데이터 바인딩**

## 참고 자료

- [스펙 문서](./spec.md)
- [데이터 모델](./data-model.md)
- [API 스펙](./contracts/admin-payments-api.yaml)
- [기존 API 패턴](../001-admin-auth/quickstart.md)

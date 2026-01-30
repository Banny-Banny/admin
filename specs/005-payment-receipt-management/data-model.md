# Data Model: 관리자 대시보드 - 결제 및 영수증 관리 기능

**Feature**: 005-payment-receipt-management  
**Date**: 2026-01-18

## Entities

### Payment (결제)

결제 시도 및 완료 정보를 나타냅니다.

**Attributes**:
- `id` (string, required): 결제 고유 ID
- `userId` (string, required): 사용자 ID
- `orderId` (string, required): 주문 ID
- `amount` (number, required): 결제 금액
- `status` (enum, required): 결제 상태
  - `READY`: 결제 준비
  - `PAID`: 결제 완료
  - `CANCELED`: 결제 취소
  - `FAILED`: 결제 실패
- `method` (string, optional): 결제 수단 (카드, 계좌이체, 가상계좌 등)
- `attemptedAt` (string, required): 결제 시도 시간 (ISO 8601)
- `completedAt` (string, optional): 결제 완료 시간 (ISO 8601)
- `failureReason` (string, optional): 실패 사유 (status가 FAILED인 경우)

**Relationships**:
- Belongs to: User (userId)
- Belongs to: Order (orderId)
- Has many: PaymentLog (결제 시도 로그)

**Validation Rules**:
- `amount`는 0보다 커야 함
- `status`가 `FAILED`인 경우 `failureReason`이 필수
- `status`가 `PAID`인 경우 `completedAt`이 필수

**State Transitions**:
```
READY → PAID (결제 성공)
READY → FAILED (결제 실패)
PAID → CANCELED (결제 취소)
```

---

### PaymentCancel (결제 취소)

결제 취소 요청 정보를 나타냅니다.

**Attributes**:
- `paymentId` (string, required): 취소할 결제 ID
- `cancelReason` (string, required): 취소 사유
- `cancelAmount` (number, required): 취소 금액 (부분 환불 가능)
- `refundReceiveAccount` (object, optional): 환불 계좌 정보
  - `bankName` (string, optional): 은행명
  - `accountNumber` (string, optional): 계좌번호
  - `accountHolder` (string, optional): 예금주명

**Relationships**:
- Belongs to: Payment (paymentId)

**Validation Rules**:
- `cancelAmount`는 0보다 크고 원래 결제 금액 이하여야 함
- `cancelReason`은 최소 1자 이상이어야 함
- `refundReceiveAccount`는 선택사항이지만, 제공되는 경우 모든 필드가 채워져야 함

---

### PaymentLog (결제 로그)

결제 시도, 성공, 실패에 대한 로그 정보를 나타냅니다.

**Attributes**:
- `id` (string, required): 로그 고유 ID
- `paymentId` (string, required): 결제 ID
- `userId` (string, required): 사용자 ID
- `status` (enum, required): 결제 상태 (Payment와 동일)
- `amount` (number, required): 결제 금액
- `attemptedAt` (string, required): 시도 시간 (ISO 8601)
- `failureReason` (string, optional): 실패 사유

**Relationships**:
- Belongs to: Payment (paymentId)
- Belongs to: User (userId)

**Query Filters**:
- `status`: 결제 상태로 필터링 (READY, PAID, CANCELED, FAILED, ALL)
- `userId`: 사용자 ID로 필터링
- `startDate`: 시작 날짜 (ISO 8601)
- `endDate`: 종료 날짜 (ISO 8601)
- `limit`: 페이지 크기 (기본값: 20)
- `offset`: 페이지 오프셋 (기본값: 0)

**Pagination**:
- 기본 페이지 크기: 20건
- 정렬: `attemptedAt` 기준 내림차순 (최신순)

---

### Receipt (영수증)

발급된 영수증 정보를 나타냅니다.

**Attributes**:
- `orderId` (string, required): 주문 ID
- `email` (string, required): 발급 이메일 주소
- `issuedAt` (string, required): 발급 시간 (ISO 8601)
- `status` (enum, required): 발급 상태
  - `PENDING`: 발급 대기
  - `SENT`: 발송 완료
  - `FAILED`: 발송 실패

**Relationships**:
- Belongs to: Order (orderId)

**Validation Rules**:
- `email`은 유효한 이메일 형식이어야 함
- `orderId`는 존재하는 주문이어야 함

---

## API Request/Response Types

### CancelPaymentRequest

```typescript
interface CancelPaymentRequest {
  cancelReason: string;
  cancelAmount: number;
  refundReceiveAccount?: {
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
  };
}
```

### CancelPaymentResponse

```typescript
interface CancelPaymentResponse {
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

### PaymentLogsQueryParams

```typescript
interface PaymentLogsQueryParams {
  status?: 'READY' | 'PAID' | 'CANCELED' | 'FAILED' | 'ALL';
  userId?: string;
  startDate?: string; // ISO 8601
  endDate?: string; // ISO 8601
  limit?: number; // 기본값: 20
  offset?: number; // 기본값: 0
}
```

### PaymentLogsResponse

```typescript
interface PaymentLogsResponse {
  success: boolean;
  data: {
    items: PaymentLog[];
    total: number;
    limit: number;
    offset: number;
  };
}
```

### ReissueReceiptRequest

```typescript
interface ReissueReceiptRequest {
  email: string;
}
```

### ReissueReceiptResponse

```typescript
interface ReissueReceiptResponse {
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

## Data Flow

### 결제 취소 흐름

1. 관리자가 결제 ID를 선택
2. 취소 사유, 취소 금액, 환불 계좌 정보(선택) 입력
3. `POST /api/admin/dashboard/payments/{id}/cancel` 호출
4. 백엔드에서 취소 처리 및 환불 진행
5. 응답으로 취소 결과 반환
6. 프론트엔드에서 결제 목록 자동 새로고침

### 결제 로그 조회 흐름

1. 관리자가 필터 조건 설정 (상태, 사용자, 날짜 범위)
2. `GET /api/admin/dashboard/payments/logs` 호출
3. 백엔드에서 필터링 및 페이지네이션 처리
4. 응답으로 결제 로그 목록 반환
5. 프론트엔드에서 테이블에 표시

### 영수증 재발급 흐름

1. 관리자가 주문 ID를 선택
2. 이메일 주소 입력
3. `POST /api/admin/dashboard/receipts/{orderId}/issue` 호출
4. 백엔드에서 영수증 생성 및 이메일 발송 (비동기)
5. 응답으로 발급 요청 결과 반환
6. 프론트엔드에서 성공 메시지 표시

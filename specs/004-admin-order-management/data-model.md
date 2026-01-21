# Data Model: 관리자 대시보드 주문 관리 (2차)

## Entities

### Order
- Fields: `order_id`(string), `order_status`(enum: PENDING | PENDING_PAYMENT | PAID | CANCELED | FAILED), `total_amount`(number, ≥0), `created_at`(ISO string)
- Relations: belongs to `Product`, belongs to `User`, optionally has `Payment`
- Validation: `order_status`는 허용 enum만, `total_amount`는 음수 불가, `created_at` ISO8601

### Product
- Fields: `id`(string), `name`(string), `product_type`(string)
- Relations: referenced by `Order`
- Validation: `name` 비어있지 않음

### Payment (optional)
- Fields: `id`(string), `status`(string), `amount`(number, ≥0), `approved_at`(ISO string | null), `method`(string)
- Relations: linked to `Order`
- Validation: `amount` 음수 불가; `approved_at`는 결제 완료 시 필수, 결제 대기 시 null 허용
- Notes: payment 전체가 null일 수 있음 → UI에서 “결제 대기 중” 명시

### User
- Fields: `id`(string), `nickname`(string), `email`(string), `phone_number`(string)
- Relations: referenced by `Order`
- Validation: 이메일 형식 검증, 전화번호 형식 검증(숫자/하이픈 조합 허용)

### Filters / Pagination
- Fields: `status`(enum + ALL), `paymentStatus`(enum + ALL), `userId`(string, optional), `startDate`/`endDate`(ISO string, optional), `limit`(number, default 20, 1–100), `offset`(number, default 0, ≥0)
- Validation: `startDate` ≤ `endDate` (필요 시 프론트에서 안내), `limit` 상한 100 가정, `offset` 음수 불가

## State Notes
- Status 변경 요청은 명시 enum 5종만 허용. 백엔드가 전이 불가 상태일 경우 에러를 반환한다고 전제.
- 결제 상태는 응답 내 `payment.status`로 제공되며, payment가 null이면 상태 텍스트를 “결제 대기 중”으로 표현.

# Research: 관리자 대시보드 - 결제 및 영수증 관리 기능

**Feature**: 005-payment-receipt-management  
**Date**: 2026-01-18  
**Purpose**: 기술 결정 및 불명확한 요구사항 해결

## Research Tasks

### 1. 환불 계좌 정보 처리 방식 결정

**Context**: FR-004에서 환불 계좌 정보가 필수인지 선택사항인지, 어떤 정보가 필요한지 확인이 필요합니다.

**Findings**:
- 사용자 입력에서 API 스펙이 제공됨: `refundReceiveAccount: {}` (객체 타입)
- 일반적인 결제 취소 시나리오:
  - 카드 결제: 원래 결제 카드로 자동 환불 (계좌 정보 불필요)
  - 계좌이체/가상계좌: 환불 계좌 정보 필요 (은행명, 계좌번호, 예금주명)
  - 간편결제: 각 PG사 정책에 따라 다름

**Decision**: 환불 계좌 정보는 선택사항(optional)으로 처리합니다.

**Rationale**:
1. 사용자 입력의 API 스펙에서 `refundReceiveAccount`가 빈 객체 `{}`로 표시되어 있어 선택사항으로 해석 가능
2. 대부분의 결제 수단(카드, 간편결제)은 원래 결제 수단으로 자동 환불되므로 계좌 정보가 불필요
3. 특수한 경우(계좌이체 취소, 가상계좌 환불 등)에만 계좌 정보가 필요
4. 관리자 UX 관점에서 선택사항으로 두면 대부분의 경우 작업이 간소화됨

**Alternatives considered**:
- **Option A**: 항상 필수로 요구
  - 거부 이유: 대부분의 결제 수단에서 불필요한 정보를 요구하게 되어 관리자 작업이 복잡해짐
- **Option B**: 결제 수단별로 다르게 처리
  - 거부 이유: 프론트엔드에서 결제 수단을 판단하는 로직이 복잡해지고, 백엔드 API가 이미 이를 처리할 것으로 예상됨

**Implementation Notes**:
- `refundReceiveAccount`는 선택적 필드로 타입 정의
- UI에서는 결제 수단에 따라 계좌 정보 입력 필드를 조건부로 표시 (백엔드 API 응답 또는 결제 정보에 따라)
- 빈 객체 `{}` 또는 `null` 전송 시 백엔드가 기본 환불 정책 적용

---

### 2. API 엔드포인트 구조 및 응답 형식

**Context**: 사용자 입력에서 3개의 API 엔드포인트가 제공되었습니다.

**Findings**:
- 기존 프로젝트의 API 패턴 확인:
  - `src/app/commons/apis/admin/index.ts`에서 API 함수들이 모듈화되어 있음
  - `apiClient.post<T>()`, `apiClient.get<T>()` 메서드 사용
  - 응답 타입은 TypeScript 인터페이스로 정의
  - 인증 토큰은 `ApiClient` 인터셉터에서 자동 처리

**Decision**: 기존 API 패턴을 따릅니다.

**Rationale**:
- 프로젝트 일관성 유지
- 기존 인증 메커니즘 재사용
- 타입 안전성 보장

**API 엔드포인트**:
1. `POST /api/admin/dashboard/payments/{id}/cancel` - 결제 취소
2. `GET /api/admin/dashboard/payments/logs` - 결제 로그 조회
3. `POST /api/admin/dashboard/receipts/{orderId}/issue` - 영수증 재발급

**Implementation Notes**:
- API 함수는 `src/app/commons/apis/admin/payments.ts`에 작성
- 요청/응답 타입은 `src/app/commons/types/payments.ts`에 정의
- 기존 `apiClient` 인스턴스 사용

---

### 3. React Query 훅 구조

**Context**: React Query를 사용한 데이터 페칭 및 뮤테이션 관리가 필요합니다.

**Findings**:
- 기존 프로젝트에서 `use-admin-orders.ts` 패턴 확인:
  - `useQuery`로 데이터 조회 (queryKey, queryFn 사용)
  - `useMutation`으로 데이터 변경 (mutationKey, mutationFn, onSuccess에서 invalidateQueries)
  - 타입 안전성을 위한 제네릭 사용

**Decision**: 기존 React Query 패턴을 따릅니다.

**Rationale**:
- 프로젝트 일관성 유지
- 검증된 패턴 재사용
- 타입 안전성 보장

**Implementation Notes**:
- `useQuery`로 결제 로그 조회: `usePaymentLogs(filters)`
- `useMutation`으로 결제 취소: `useCancelPayment()`
- `useMutation`으로 영수증 재발급: `useReissueReceipt()`
- 성공 시 관련 쿼리 무효화로 자동 리프레시

---

### 4. E2E 테스트 구조

**Context**: Playwright를 사용한 API 통신 테스트만 작성 (UI 테스트 제외).

**Findings**:
- 기존 E2E 테스트 패턴 확인 (`orders-api.spec.ts`):
  - `test.describe`로 그룹화
  - `beforeAll`에서 관리자 토큰 획득
  - `request` API를 사용한 HTTP 요청
  - 응답 상태 코드 및 데이터 구조 검증

**Decision**: 기존 E2E 테스트 패턴을 따릅니다.

**Rationale**:
- 프로젝트 일관성 유지
- 검증된 테스트 구조 재사용
- API 통신만 테스트하여 빠른 피드백

**Implementation Notes**:
- `src/app/tests/api-tests/payments/payments-api.spec.ts`에 작성
- 각 API 엔드포인트별 테스트 그룹 생성
- 다양한 필터 조합 테스트 (결제 로그 조회)
- 요청 body 데이터 검증 (결제 취소, 영수증 재발급)

---

### 5. UI 컴포넌트 구조

**Context**: 프로젝트 톤앤매너에 맞는 UI 컴포넌트 개발이 필요합니다.

**Findings**:
- 기존 컴포넌트 구조 확인:
  - `src/app/components/[PageName]/index.tsx` + `styles.module.css`
  - Radix UI primitives 사용
  - CSS Modules로 스타일링

**Decision**: 기존 UI 컴포넌트 구조를 따릅니다.

**Rationale**:
- 프로젝트 일관성 유지
- 기존 디자인 시스템 활용
- 유지보수성 보장

**Implementation Notes**:
- `src/app/components/PaymentsPage/` 디렉토리 생성
- 결제 로그 테이블, 결제 취소 모달, 영수증 재발급 모달 컴포넌트 분리
- 기존 프로젝트의 모달, 테이블, 폼 컴포넌트 패턴 참고

---

## Resolved Clarifications

### FR-004: 환불 계좌 정보
- **Status**: ✅ RESOLVED
- **Decision**: 환불 계좌 정보는 선택사항(optional)입니다
- **Implementation**: `refundReceiveAccount` 필드를 선택적 타입으로 정의하고, UI에서 조건부로 표시

## Open Questions

없음 (모든 NEEDS CLARIFICATION 해결 완료)

## References

- 기존 API 패턴: `src/app/commons/apis/admin/index.ts`
- 기존 React Query 패턴: `src/app/commons/hooks/use-admin-orders.ts`
- 기존 E2E 테스트 패턴: `src/app/tests/api-tests/orders/orders-api.spec.ts`
- 기존 컴포넌트 구조: `src/app/components/`

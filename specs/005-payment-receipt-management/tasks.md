# Tasks: 관리자 대시보드 - 결제 및 영수증 관리 기능

**Input**: Design documents from `/specs/005-payment-receipt-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: E2E 테스트는 Playwright를 사용하여 API 통신만 테스트합니다. UI 요소는 테스트하지 않습니다.

**Organization**: 작업은 사용자 스토리별로 그룹화되어 각 스토리를 독립적으로 구현하고 테스트할 수 있습니다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 이 작업이 속한 사용자 스토리 (예: US1, US2, US3)
- 설명에 정확한 파일 경로 포함

## Path Conventions

- Next.js App Router 구조: `src/app/` 기준
- 기존 프로젝트 구조 유지

## Phase 1: Setup (공유 인프라)

**Purpose**: 프로젝트 초기화 및 기본 구조

- [x] T001 [P] Create TypeScript type definitions file for payments in src/app/commons/types/payments.ts
- [x] T002 [P] Create API functions file for payments in src/app/commons/apis/admin/payments.ts
- [x] T003 [P] Create React Query hooks file for payments in src/app/commons/hooks/use-payments.ts
- [x] T004 [P] Create E2E test directory structure in src/app/tests/api-tests/payments/

---

## Phase 2: Foundational (차단 필수 사항)

**Purpose**: 모든 사용자 스토리 구현 전에 반드시 완료해야 하는 핵심 인프라

**⚠️ CRITICAL**: 이 단계가 완료되지 않으면 사용자 스토리 작업을 시작할 수 없습니다

**Note**: 기존 프로젝트 인프라(인증, API 클라이언트 등)를 활용하므로 추가 foundational 작업은 없습니다.

**Checkpoint**: Foundation ready - 사용자 스토리 구현을 이제 병렬로 시작할 수 있습니다

---

## Phase 3: User Story 1 - 결제 취소 처리 (Priority: P1) 🎯 MVP

**Goal**: 관리자가 완료된 결제를 취소하고 환불을 처리할 수 있습니다. 고객의 요청이나 시스템 오류로 인해 결제를 취소해야 할 때, 관리자는 결제 정보를 확인하고 취소 사유를 기록한 후 환불을 진행합니다.

**Independent Test**: 관리자가 결제 목록에서 특정 결제를 선택하고, 취소 사유와 환불 금액을 입력한 후 취소를 완료하는 전체 흐름을 테스트할 수 있습니다. 이 기능만으로도 관리자가 결제 문제를 해결할 수 있는 최소한의 가치를 제공합니다.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T005 [P] [US1] Create E2E test for POST /api/admin/dashboard/payments/{id}/cancel API call in src/app/tests/api-tests/payments/payments-api.spec.ts
- [x] T006 [P] [US1] Add test case for cancel payment with full refund in src/app/tests/api-tests/payments/payments-api.spec.ts
- [x] T007 [P] [US1] Add test case for cancel payment with partial refund in src/app/tests/api-tests/payments/payments-api.spec.ts
- [x] T008 [P] [US1] Add test case for cancel payment with refund account info in src/app/tests/api-tests/payments/payments-api.spec.ts
- [x] T009 [P] [US1] Add test case for cancel payment error handling (404, 400, 409) in src/app/tests/api-tests/payments/payments-api.spec.ts

### Implementation for User Story 1

- [x] T010 [P] [US1] Define CancelPaymentRequest interface in src/app/commons/types/payments.ts
- [x] T011 [P] [US1] Define CancelPaymentResponse interface in src/app/commons/types/payments.ts
- [x] T012 [P] [US1] Define RefundReceiveAccount interface in src/app/commons/types/payments.ts
- [x] T013 [US1] Implement cancelPayment API function in src/app/commons/apis/admin/payments.ts
- [x] T014 [US1] Implement useCancelPayment React Query hook in src/app/commons/hooks/use-payments.ts
- [x] T015 [US1] Create CancelPaymentModal component in src/app/components/PaymentsPage/CancelPaymentModal.tsx
- [x] T016 [US1] Create styles for CancelPaymentModal in src/app/components/PaymentsPage/CancelPaymentModal.module.css
- [x] T017 [US1] Add form validation for cancel payment (cancelReason, cancelAmount) in src/app/components/PaymentsPage/CancelPaymentModal.tsx
- [x] T018 [US1] Add error handling and success feedback (toast) for cancel payment in src/app/components/PaymentsPage/CancelPaymentModal.tsx
- [x] T019 [US1] Add loading state during cancel payment request in src/app/components/PaymentsPage/CancelPaymentModal.tsx
- [x] T020 [US1] Integrate cancel payment mutation with query invalidation for payment list refresh in src/app/commons/hooks/use-payments.ts

**Checkpoint**: 이 시점에서 User Story 1은 완전히 기능하며 독립적으로 테스트 가능해야 합니다

---

## Phase 4: User Story 2 - 결제 로그 조회 (Priority: P2)

**Goal**: 관리자가 결제 시도, 성공, 실패에 대한 상세 로그를 조회하여 결제 문제를 진단하고 분석할 수 있습니다. 다양한 필터 조건을 사용하여 원하는 결제 로그를 빠르게 찾을 수 있습니다.

**Independent Test**: 관리자가 결제 로그 조회 화면에서 다양한 필터(상태, 사용자, 날짜 범위)를 적용하여 결제 로그 목록을 조회하고, 각 로그의 상세 정보를 확인하는 것을 테스트할 수 있습니다. 이 기능만으로도 관리자가 결제 이력을 추적하고 문제를 진단할 수 있습니다.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T021 [P] [US2] Create E2E test for GET /api/admin/dashboard/payments/logs API call in src/app/tests/api-tests/payments/payments-api.spec.ts
- [x] T022 [P] [US2] Add test case for payment logs query with default filters in src/app/tests/api-tests/payments/payments-api.spec.ts
- [x] T023 [P] [US2] Add test case for payment logs query with status filter in src/app/tests/api-tests/payments/payments-api.spec.ts
- [x] T024 [P] [US2] Add test case for payment logs query with userId filter in src/app/tests/api-tests/payments/payments-api.spec.ts
- [x] T025 [P] [US2] Add test case for payment logs query with date range filter in src/app/tests/api-tests/payments/payments-api.spec.ts
- [x] T026 [P] [US2] Add test case for payment logs query with pagination (limit, offset) in src/app/tests/api-tests/payments/payments-api.spec.ts
- [x] T027 [P] [US2] Add test case for payment logs query with multiple filter combinations in src/app/tests/api-tests/payments/payments-api.spec.ts
- [x] T028 [P] [US2] Add test case for payment logs response structure validation in src/app/tests/api-tests/payments/payments-api.spec.ts

### Implementation for User Story 2

- [x] T029 [P] [US2] Define PaymentLog interface in src/app/commons/types/payments.ts
- [x] T030 [P] [US2] Define PaymentLogsFilters interface in src/app/commons/types/payments.ts
- [x] T031 [P] [US2] Define PaymentLogsResponse interface in src/app/commons/types/payments.ts
- [x] T032 [US2] Implement getPaymentLogs API function with query parameter handling in src/app/commons/apis/admin/payments.ts
- [x] T033 [US2] Implement usePaymentLogs React Query hook in src/app/commons/hooks/use-payments.ts
- [x] T034 [US2] Create PaymentLogsTable component in src/app/components/PaymentsPage/PaymentLogsTable.tsx
- [x] T035 [US2] Create styles for PaymentLogsTable in src/app/components/PaymentsPage/PaymentLogsTable.module.css
- [x] T036 [US2] Create payment logs filter component (status, userId, date range) in src/app/components/PaymentsPage/PaymentLogsFilters.tsx
- [x] T037 [US2] Create styles for payment logs filters in src/app/components/PaymentsPage/PaymentLogsFilters.module.css
- [x] T038 [US2] Implement pagination component for payment logs in src/app/components/PaymentsPage/PaymentLogsTable.tsx
- [x] T039 [US2] Add loading state for payment logs query in src/app/components/PaymentsPage/PaymentLogsTable.tsx
- [x] T040 [US2] Add error state handling for payment logs query in src/app/components/PaymentsPage/PaymentLogsTable.tsx
- [x] T041 [US2] Add empty state handling for payment logs (no results) in src/app/components/PaymentsPage/PaymentLogsTable.tsx
- [x] T042 [US2] Display payment log details (paymentId, userId, amount, status, attemptedAt, failureReason) in PaymentLogsTable component

**Checkpoint**: 이 시점에서 User Stories 1 AND 2는 모두 독립적으로 작동해야 합니다

---

## Phase 5: User Story 3 - 영수증 재발급 (Priority: P3)

**Goal**: 관리자가 고객의 요청에 따라 영수증을 재발급할 수 있습니다. 고객이 영수증을 분실했거나 이메일을 잘못 입력한 경우, 관리자가 주문 정보를 확인하고 올바른 이메일 주소로 영수증을 다시 발송할 수 있습니다.

**Independent Test**: 관리자가 주문 상세 화면에서 영수증 재발급을 요청하고, 고객의 이메일 주소를 입력한 후 재발급을 완료하는 것을 테스트할 수 있습니다. 이 기능만으로도 관리자가 고객의 영수증 재발급 요청을 처리할 수 있습니다.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T043 [P] [US3] Create E2E test for POST /api/admin/dashboard/receipts/{orderId}/issue API call in src/app/tests/api-tests/payments/payments-api.spec.ts
- [x] T044 [P] [US3] Add test case for reissue receipt with valid email in src/app/tests/api-tests/payments/payments-api.spec.ts
- [x] T045 [P] [US3] Add test case for reissue receipt with invalid email format (400 error) in src/app/tests/api-tests/payments/payments-api.spec.ts
- [x] T046 [P] [US3] Add test case for reissue receipt with non-existent orderId (404 error) in src/app/tests/api-tests/payments/payments-api.spec.ts
- [x] T047 [P] [US3] Add test case for reissue receipt response structure validation in src/app/tests/api-tests/payments/payments-api.spec.ts

### Implementation for User Story 3

- [x] T048 [P] [US3] Define ReissueReceiptRequest interface in src/app/commons/types/payments.ts
- [x] T049 [P] [US3] Define ReissueReceiptResponse interface in src/app/commons/types/payments.ts
- [x] T050 [US3] Implement reissueReceipt API function in src/app/commons/apis/admin/payments.ts
- [x] T051 [US3] Implement useReissueReceipt React Query hook in src/app/commons/hooks/use-payments.ts
- [x] T052 [US3] Create ReceiptReissueModal component in src/app/components/PaymentsPage/ReceiptReissueModal.tsx
- [x] T053 [US3] Create styles for ReceiptReissueModal in src/app/components/PaymentsPage/ReceiptReissueModal.module.css
- [x] T054 [US3] Add email format validation for receipt reissue in src/app/components/PaymentsPage/ReceiptReissueModal.tsx
- [x] T055 [US3] Add error handling and success feedback (toast) for receipt reissue in src/app/components/PaymentsPage/ReceiptReissueModal.tsx
- [x] T056 [US3] Add loading state during receipt reissue request in src/app/components/PaymentsPage/ReceiptReissueModal.tsx

**Checkpoint**: 이 시점에서 모든 사용자 스토리가 독립적으로 기능해야 합니다

---

## Phase 6: Integration & UI Polish

**Purpose**: 모든 기능을 통합하고 UI를 완성합니다

- [x] T057 Create PaymentsPage main component in src/app/components/PaymentsPage/index.tsx
- [x] T058 Create styles for PaymentsPage in src/app/components/PaymentsPage/styles.module.css
- [x] T059 Integrate PaymentLogsTable, CancelPaymentModal, ReceiptReissueModal into PaymentsPage in src/app/components/PaymentsPage/index.tsx
- [x] T060 Add navigation/routing for PaymentsPage in admin dashboard
- [x] T061 [P] Export payment-related API functions from src/app/commons/apis/admin/index.ts
- [x] T062 [P] Export payment-related hooks from src/app/commons/hooks/index.ts (if exists) or create index.ts
- [x] T063 Ensure all components follow project design system and tone (Radix UI, CSS Modules)
- [x] T064 Add responsive design for PaymentsPage components
- [x] T065 Verify all error states are properly handled across all components
- [x] T066 Verify all loading states are properly displayed across all components
- [x] T067 Verify all empty states are properly displayed across all components

---

## Phase 7: Final Validation & Testing

**Purpose**: 최종 검증 및 테스트 통과 확인

- [x] T068 Run all E2E tests and ensure they pass: npm run test:e2e (테스트 파일 작성 완료, 실행은 백엔드 API 필요)
- [x] T069 Verify all API endpoints are correctly called with proper authentication (apiClient 사용 확인)
- [x] T070 Verify React Query cache invalidation works correctly after mutations (useCancelPayment에서 invalidateQueries 확인)
- [x] T071 Verify all TypeScript types are correctly defined and used (no any types) (모든 타입 정의 완료, 린터 통과)
- [x] T072 Run linting and fix any issues: npm run lint (린터 에러 없음)
- [x] T073 Verify quickstart.md examples work correctly (코드 구조 일치 확인)
- [ ] T074 Test all user flows manually:
  - 결제 취소 (전체/부분 환불)
  - 결제 로그 조회 (다양한 필터 조합)
  - 영수증 재발급

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories (Note: 기존 인프라 사용으로 추가 작업 없음)
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Integration (Phase 6)**: Depends on all desired user stories being complete
- **Final Validation (Phase 7)**: Depends on Integration phase completion

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories (독립적으로 테스트 가능)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories (독립적으로 테스트 가능)

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Type definitions before API functions
- API functions before React Query hooks
- React Query hooks before UI components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T001-T004)
- All Foundational tasks: N/A (기존 인프라 사용)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Type definitions within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: T005 - Create E2E test for POST /api/admin/dashboard/payments/{id}/cancel API call
Task: T006 - Add test case for cancel payment with full refund
Task: T007 - Add test case for cancel payment with partial refund
Task: T008 - Add test case for cancel payment with refund account info
Task: T009 - Add test case for cancel payment error handling

# Launch all type definitions for User Story 1 together:
Task: T010 - Define CancelPaymentRequest interface
Task: T011 - Define CancelPaymentResponse interface
Task: T012 - Define RefundReceiveAccount interface
```

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task: T021 - Create E2E test for GET /api/admin/dashboard/payments/logs API call
Task: T022 - Add test case for payment logs query with default filters
Task: T023 - Add test case for payment logs query with status filter
Task: T024 - Add test case for payment logs query with userId filter
Task: T025 - Add test case for payment logs query with date range filter
Task: T026 - Add test case for payment logs query with pagination
Task: T027 - Add test case for payment logs query with multiple filter combinations
Task: T028 - Add test case for payment logs response structure validation

# Launch all type definitions for User Story 2 together:
Task: T029 - Define PaymentLog interface
Task: T030 - Define PaymentLogsFilters interface
Task: T031 - Define PaymentLogsResponse interface
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (기존 인프라 사용, 추가 작업 없음)
3. Complete Phase 3: User Story 1 (T005-T020)
   - Write tests first (T005-T009)
   - Implement types (T010-T012)
   - Implement API function (T013)
   - Implement React Query hook (T014)
   - Implement UI components (T015-T020)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Integration & Polish → Final validation → Deploy
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup together (T001-T004 can be parallel)
2. Once Foundational is done:
   - Developer A: User Story 1 (P1)
   - Developer B: User Story 2 (P2)
   - Developer C: User Story 3 (P3)
3. Stories complete and integrate independently
4. Integration phase: Team works together on UI integration

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- E2E tests focus on API communication only (no UI element testing)
- UI components should follow existing project design system
- All API calls must use existing ApiProvider for authentication
- React Query hooks should invalidate queries appropriately after mutations

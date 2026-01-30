# Tasks: 관리자 대시보드 주문 관리 (2차)

**Input**: Design documents from `/specs/004-admin-order-management/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: E2E(Playwright)로 API 통신만 검증. UI 요소 검증은 제외.

**Organization**: User Story별로 독립 구현/검증 가능하도록 구성.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 공통 자원/디렉터리 준비

- [x] T001 `src/app/tests/api-tests/orders/` 디렉터리 생성 및 기본 Playwright 설정 확인
- [x] T002 `src/app/commons/types/orders.ts` 파일 생성 (주문/상품/결제/유저/필터/응답 타입 스켈레톤)
- [x] T003 `src/app/commons/apis/admin/orders.ts` 파일 생성(모듈 스켈레톤, ApiProvider 기반 import 준비)
- [x] T004 `src/app/commons/hooks/use-admin-orders.ts` 파일 생성(훅 스켈레톤)
- [x] T005 `src/app/components/Orders/` 디렉터리 및 기본 `index.tsx` 스켈레톤 생성

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 스토리가 공유하는 기본 구현

- [x] T006 `src/app/commons/types/orders.ts`에 Order/Product/Payment/User/Filters/Pagination/Response 타입 정의 반영 (contracts + data-model)
- [x] T007 `src/app/commons/apis/admin/orders.ts`에 GET 목록/GET 상세/PATCH 상태 변경 함수 시그니처 및 기본 파라미터(default: status/paymentStatus=ALL, limit=20, offset=0, created_at desc) 구현
- [x] T008 `src/app/commons/hooks/use-admin-orders.ts`에 React Query 기본 클라이언트 연동용 키/옵션 유틸 정의 (쿼리 키: orders, orders-detail, mutation 키)
- [x] T009 `src/app/commons/apis/admin/index.ts`에서 orders API 모듈 export 연결

**Checkpoint**: 공통 타입/클라이언트/훅 뼈대 준비 → 각 스토리 구현 가능

---

## Phase 3: User Story 1 - 주문 목록 조회 및 필터링 (Priority: P1) 🎯 MVP

**Goal**: 필터(상태/결제상태/기간/유저 ID)와 페이지네이션 기반 주문 목록 조회 및 표시

**Independent Test**: 필터 조합/기본값으로 목록을 조회하면 총건수/limit/offset과 함께 결과가 반환되고, 로딩/빈/오류 상태가 안내된다.

### Tests (API only)

- [x] T010 [P] [US1] Playwright: GET `/api/admin/dashboard/orders` 기본/필터 조합 응답 코드·success·items/total/limit/offset 스키마 검증 (`src/app/tests/api-tests/orders/orders-api.spec.ts`)

### Implementation

- [x] T011 [P] [US1] orders 목록 API 함수 구현 완료 (filters → query 변환, ApiProvider 기반 호출) `src/app/commons/apis/admin/orders.ts`
- [x] T012 [P] [US1] 목록 useQuery 구현 (쿼리 키/옵션 적용, 기본값 ALL/20/0, created_at desc) `src/app/commons/hooks/use-admin-orders.ts`
- [x] T013 [P] [US1] Orders 필터 영역 컴포넌트(드롭다운 2, 날짜범위, 유저 ID 입력) `src/app/components/Orders/Filters.tsx`
- [x] T014 [P] [US1] Orders 테이블 컴포넌트(주문 ID, 유저, 상품명, 주문상태, 결제상태, 금액, 결제방법, 주문일시; 결제 null → “결제 대기 중”) `src/app/components/Orders/OrdersTable.tsx`
- [x] T015 [P] [US1] Orders 페이지네이션 컴포넌트(total/limit/offset 기반) `src/app/components/Orders/Pagination.tsx`
- [x] T016 [US1] Orders 페이지 컨테이너에서 필터 → 쿼리 → 목록 렌더/페이지네이션/로딩·빈·오류 상태 처리 `src/app/components/Orders/index.tsx`

**Checkpoint**: 필터 가능한 목록 + 페이지네이션 + 상태 피드백이 동작하고 API 테스트 통과

---

## Phase 4: User Story 2 - 주문 상세 확인 (Priority: P2)

**Goal**: 목록에서 선택한 주문의 상세(주문/상품/유저/결제) 확인, 결제 null은 “결제 대기 중” 표시

**Independent Test**: 특정 주문 선택 시 상세를 받아 주문/상품/유저/결제 정보를 확인할 수 있고, 결제 null 시 대기 안내가 보인다.

### Tests (API only)

- [x] T017 [P] [US2] Playwright: GET `/api/admin/dashboard/orders/{id}` 상태 코드·success·단일 주문 스키마 및 payment null 케이스 검증 (`src/app/tests/api-tests/orders/orders-api.spec.ts`)

### Implementation

- [x] T018 [P] [US2] 주문 상세 useQuery 구현 (쿼리 키 분리, 에러/로딩 핸들) `src/app/commons/hooks/use-admin-orders.ts`
- [x] T019 [P] [US2] 상세 모달 컴포넌트(주문/상품/유저/결제; payment null → “결제 대기 중”) `src/app/components/Orders/OrderDetailModal.tsx`
- [x] T020 [US2] 테이블 행 클릭 → 상세 모달 오픈/닫기 상태 관리 및 쿼리 연동 `src/app/components/Orders/index.tsx`

**Checkpoint**: 목록에서 상세 모달까지 정보 확인 가능, payment null 표현 일관

---

## Phase 5: User Story 3 - 주문 상태 변경 및 결과 확인 (Priority: P3)

**Goal**: 주문 상태 변경(명시 enum 5종) 후 결과 안내 및 목록 최신화

**Independent Test**: 상태 변경 요청 시 확인 모달 → 성공/실패 메시지, 성공 시 목록/상세가 최신 상태로 갱신된다.

### Tests (API only)

- [x] T021 [P] [US3] Playwright: PATCH `/api/admin/dashboard/orders/{id}/status` 상태 코드·success·응답 스키마 검증 (`src/app/tests/api-tests/orders/orders-api.spec.ts`)

### Implementation

- [x] T022 [P] [US3] 상태 변경 useMutation 구현(허용 enum 5종 전송, 실패/성공 메시지 분기, invalidate 목록/상세) `src/app/commons/hooks/use-admin-orders.ts`
- [x] T023 [P] [US3] 상태 변경 확인 모달 컴포넌트(확인/취소, 현재 상태 표시) `src/app/components/Orders/StatusConfirmModal.tsx`
- [x] T024 [US3] 상세/테이블에서 상태 변경 액션 연결(모달 호출, mutation 연동, 토스트 표시) `src/app/components/Orders/index.tsx`

**Checkpoint**: 상태 변경 흐름 완료, 성공 시 데이터 갱신·피드백 확인

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: 마무리 및 공통 개선

- [ ] T025 [P] quickstart.md 실행 검증(명시된 스텝 따라 lint/e2e) `specs/004-admin-order-management/quickstart.md`
- [ ] T026 문서 업데이트(필요 시 README/팀 위키에 경로·사용법 추가)
- [ ] T027 코드 정리/접근성 점검(키보드 포커스, 로딩/빈/오류 메시지 가독성) `src/app/components/Orders/`
- [ ] T028 [P] 종단 점검: `npm run test:e2e`로 신규 Playwright 스위트 포함 확인

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → 각 User Story(3,4,5 단계) → Polish 순서
- User Story 간 우선순위: P1(US1) → P2(US2) → P3(US3), 단 Foundational 완료 후 병렬 가능
- Within 각 Story: Tests(작성) → Hooks/API/Components 구현 → 통합 확인

## Parallel Opportunities

- [P] 표시된 타입/훅/컴포넌트/테스트 작업은 서로 다른 파일에서 병렬 가능
- US2, US3는 Foundational+US1 의존 요소 반영 후 병렬 진행 가능(팀원 분담)

## Implementation Strategy

- **MVP**: US1 완료(목록/필터/페이지네이션 + API 테스트 통과) 후 검증/데모
- **Incremental**: US2(상세) 추가 → 검증 → US3(상태 변경) 추가 → 검증
- 각 단계 후 `npm run test:e2e`로 API 스펙 검증, UI는 수동 확인

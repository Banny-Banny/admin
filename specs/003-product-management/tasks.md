# Tasks: 상품 관리 페이지

**Input**: Design documents from `/specs/003-product-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: E2E 테스트는 기존 Playwright 구조를 활용하여 작성합니다. 진행 순서는 **API 연결 → E2E 테스트(API 통신 확인) → UI 데이터 바인딩**입니다.

**Organization**: 작업은 사용자 스토리별로 그룹화되어 각 스토리를 독립적으로 구현하고 테스트할 수 있습니다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 이 작업이 속한 사용자 스토리 (예: US1, US2, US3)
- 설명에 정확한 파일 경로 포함

## Path Conventions

- Next.js App Router 구조: `src/app/` 기준
- 기존 프로젝트 구조 유지
- API 파일: `src/app/commons/apis/product/`
- 타입 파일: `src/app/commons/types/product.ts`
- 컴포넌트: `src/app/components/ProductsPage/`, `src/app/components/ProductList/`
- 테스트: `src/app/tests/api-tests/product-test/`

## Phase 1: Setup (공유 인프라)

**Purpose**: 프로젝트 초기화 및 기본 구조 확인

- [X] T001 [P] Create directory structure for product API in src/app/commons/apis/product/
- [X] T002 [P] Create directory structure for product tests in src/app/tests/api-tests/product-test/
- [X] T003 [P] Verify existing ProductsPage component exists in src/app/components/ProductsPage/index.tsx
- [X] T004 [P] Verify existing ProductList component exists in src/app/components/ProductList/index.tsx

---

## Phase 2: Foundational (차단 필수 사항)

**Purpose**: 모든 사용자 스토리 구현 전에 반드시 완료해야 하는 핵심 인프라

**⚠️ CRITICAL**: 이 단계가 완료되지 않으면 사용자 스토리 작업을 시작할 수 없습니다

### 타입 정의

- [X] T005 [P] Create Product type definitions in src/app/commons/types/product.ts (Product, ProductListResponse, ProductDetailResponse, CreateProductRequest, UpdateProductRequest, GetProductsParams, ProductType enum, ProductStatus enum)

### API 클라이언트 구현

- [X] T006 [P] Create HTTP API client file in src/app/commons/apis/product/http.ts with getProducts function (GET /api/admin/products with query params: search, categoryId, status, limit, offset)
- [X] T007 [P] Implement getProductById function in src/app/commons/apis/product/http.ts (GET /api/admin/products/{id})
- [X] T008 [P] Implement createProduct function in src/app/commons/apis/product/http.ts (POST /api/admin/products)
- [X] T009 [P] Implement updateProduct function in src/app/commons/apis/product/http.ts (PATCH /api/admin/products/{id})
- [X] T010 [P] Implement deleteProduct function in src/app/commons/apis/product/http.ts (DELETE /api/admin/products/{id})
- [X] T011 [P] Create index.ts export file in src/app/commons/apis/product/index.ts to export all API functions and types
- [X] T012 [P] Verify API client uses existing apiClient with token interceptor in src/app/commons/apis/product/http.ts

**Checkpoint**: Foundation ready - E2E 테스트를 먼저 실행합니다

---

## Phase 3: E2E 테스트 실행 및 검증

**Purpose**: API 클라이언트가 올바르게 구현되었는지 E2E 테스트로 검증합니다.

**⚠️ CRITICAL**: 이 단계의 모든 테스트가 통과해야만 데이터 바인딩 작업을 시작할 수 있습니다.

### E2E 테스트 작성 및 실행

- [X] T013 [P] Create E2E test file for product API in src/app/tests/api-tests/product-test/product-api.spec.ts
- [X] T014 [P] Write E2E test for GET /api/admin/products (list products with filters) in src/app/tests/api-tests/product-test/product-api.spec.ts
- [X] T015 [P] Write E2E test for POST /api/admin/products (create product) in src/app/tests/api-tests/product-test/product-api.spec.ts
- [X] T016 [P] Write E2E test for GET /api/admin/products/{id} (get product detail) in src/app/tests/api-tests/product-test/product-api.spec.ts
- [X] T017 [P] Write E2E test for PATCH /api/admin/products/{id} (update product) in src/app/tests/api-tests/product-test/product-api.spec.ts
- [X] T018 [P] Write E2E test for DELETE /api/admin/products/{id} (soft delete product) in src/app/tests/api-tests/product-test/product-api.spec.ts
- [X] T019 Run all E2E tests using `npm run test:e2e` and verify all product API tests pass

**Checkpoint**: 모든 E2E 테스트 통과 확인 - 이제 데이터 바인딩 작업을 시작할 수 있습니다

---

## Phase 4: User Story 1 - 상품 목록 조회 (Priority: P1) 🎯 MVP

**Goal**: 관리자가 등록된 상품 목록을 조회하고 검색 및 필터링을 통해 원하는 상품을 찾을 수 있습니다.

**Independent Test**: 관리자가 로그인한 상태에서 상품 관리 페이지에 접근하여 상품 목록을 조회할 수 있고, 검색 및 필터링 기능을 통해 원하는 상품을 찾을 수 있습니다.

### Implementation for User Story 1

> **NOTE: E2E 테스트가 모두 통과한 후에만 이 작업들을 시작합니다.**

### API 데이터 바인딩

- [X] T020 [US1] Update ProductList component to fetch products from API on mount in src/app/components/ProductList/index.tsx
- [X] T021 [US1] Replace hardcoded products array with API call using getProducts function in src/app/components/ProductList/index.tsx
- [X] T022 [US1] Map API Product type to existing ProductList Product interface (id: string → number, categoryId → category, isActive → status, etc.) in src/app/components/ProductList/index.tsx
- [X] T023 [US1] Update ProductList component props to remove products prop and fetch internally in src/app/components/ProductList/index.tsx

### 검색 및 필터링 (API 연동)

- [X] T024 [US1] Replace client-side search filter with API search parameter in src/app/components/ProductList/index.tsx
- [X] T025 [US1] Replace client-side category filter with API categoryId parameter in src/app/components/ProductList/index.tsx
- [X] T026 [US1] Replace client-side status filter with API status parameter (map '판매중' → 'ACTIVE', '판매중지' → 'INACTIVE', '품절' → 'INACTIVE') in src/app/components/ProductList/index.tsx
- [X] T027 [US1] Implement debounced search input to reduce API calls in src/app/components/ProductList/index.tsx
- [X] T028 [US1] Update filter handlers to call getProducts API with new parameters in src/app/components/ProductList/index.tsx

### UI 수정 (API 응답 형식에 맞게)

- [X] T029 [P] [US1] Update ProductList to display API Product fields (id as string, categoryId instead of category, isActive instead of status, etc.) in src/app/components/ProductList/index.tsx
- [X] T030 [P] [US1] Map API status (isActive: true/false) to UI status display ('판매중'/'판매중지') in src/app/components/ProductList/index.tsx
- [X] T031 [P] [US1] Remove discountPrice field display (not in API response) or handle null case in src/app/components/ProductList/index.tsx
- [X] T032 [P] [US1] Remove stock field display (not in API response) or handle null case in src/app/components/ProductList/index.tsx
- [X] T033 [P] [US1] Update tags display to handle mediaTypes array from API in src/app/components/ProductList/index.tsx
- [X] T034 [P] [US1] Update createdAt display format to handle ISO 8601 date string from API in src/app/components/ProductList/index.tsx

### 로딩 및 에러 처리

- [X] T035 [US1] Add loading state while fetching products in ProductList component in src/app/components/ProductList/index.tsx
- [X] T036 [US1] Add error handling for API failures with toast notification in ProductList component in src/app/components/ProductList/index.tsx
- [X] T037 [US1] Add empty state message ("등록된 상품이 없습니다") when products array is empty in ProductList component in src/app/components/ProductList/index.tsx
- [X] T038 [US1] Add "검색 결과가 없습니다" message when search/filter returns no results in ProductList component in src/app/components/ProductList/index.tsx

### ProductsPage 컴포넌트 업데이트

- [X] T039 [US1] Update ProductsPage component to remove products state and pass to ProductList in src/app/components/ProductsPage/index.tsx
- [X] T040 [US1] Update ProductsPage to display total product count from API response in src/app/components/ProductsPage/index.tsx

### UI 테스트

- [X] T041 [US1] Run UI tests for product list display and verify all products are rendered correctly
- [X] T042 [US1] Run UI tests for search functionality and verify filtered results
- [X] T043 [US1] Run UI tests for category filter and verify filtered results
- [X] T044 [US1] Run UI tests for status filter and verify filtered results
- [X] T045 [US1] Run UI tests for empty state display when no products found
- [X] T046 [US1] Run UI tests for loading state display during API calls
- [X] T047 [US1] Run UI tests for error handling display on API failures

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. UI tests must pass before proceeding.

---

## Phase 5: User Story 2 - 상품 등록 (Priority: P2)

**Goal**: 관리자가 새로운 상품을 등록할 수 있습니다.

**Independent Test**: 관리자가 상품 등록 폼을 작성하고 제출하여 새 상품을 등록할 수 있고, 등록 후 목록에 새 상품이 표시됩니다.

### Implementation for User Story 2

> **NOTE: E2E 테스트가 모두 통과한 후에만 이 작업들을 시작합니다.**

### 폼 데이터 매핑 및 API 연동

- [X] T048 [US2] Update ProductsPage formData state to match CreateProductRequest interface (name, price, description, thumbnailUrl, categoryId, isActive, productType, mediaTypes, maxMediaCount) in src/app/components/ProductsPage/index.tsx
- [X] T049 [US2] Remove discountPrice and stock fields from form (not in API) or map appropriately in src/app/components/ProductsPage/index.tsx
- [X] T050 [US2] Add productType field to form (TIME_CAPSULE, EASTER_EGG) in src/app/components/ProductsPage/index.tsx
- [X] T051 [US2] Add mediaTypes field to form (array of strings) in src/app/components/ProductsPage/index.tsx
- [X] T052 [US2] Add maxMediaCount field to form (number) in src/app/components/ProductsPage/index.tsx
- [X] T053 [US2] Map form status ('판매중'/'판매중지') to isActive boolean for API in src/app/components/ProductsPage/index.tsx
- [X] T054 [US2] Map form category string to categoryId UUID for API (if needed) in src/app/components/ProductsPage/index.tsx
- [X] T055 [US2] Replace handleSubmit to call createProduct API instead of local state update in src/app/components/ProductsPage/index.tsx
- [X] T056 [US2] Handle API response and add new product to list or refresh list in src/app/components/ProductsPage/index.tsx
- [X] T057 [US2] Show success toast notification after successful product creation in src/app/components/ProductsPage/index.tsx
- [X] T058 [US2] Show error toast notification on API failure in src/app/components/ProductsPage/index.tsx

### 폼 검증

- [X] T059 [US2] Add client-side validation for required fields (name, price, productType, mediaTypes, maxMediaCount, isActive) in src/app/components/ProductsPage/index.tsx
- [X] T060 [US2] Display validation error messages for missing required fields in src/app/components/ProductsPage/index.tsx
- [X] T061 [US2] Validate price is a positive number in src/app/components/ProductsPage/index.tsx

### 폼 리셋 및 UI 업데이트

- [X] T062 [US2] Reset form data after successful submission in src/app/components/ProductsPage/index.tsx
- [X] T063 [US2] Close form after successful submission in src/app/components/ProductsPage/index.tsx
- [X] T064 [US2] Add loading state during product creation API call in src/app/components/ProductsPage/index.tsx
- [X] T065 [US2] Disable submit button during API call to prevent duplicate submissions in src/app/components/ProductsPage/index.tsx

### UI 테스트

- [X] T066 [US2] Run UI tests for product creation form display
- [X] T067 [US2] Run UI tests for form validation (required fields)
- [X] T068 [US2] Run UI tests for successful product creation flow
- [X] T069 [US2] Run UI tests for new product appearing in list after creation
- [X] T070 [US2] Run UI tests for form reset after successful submission
- [X] T071 [US2] Run UI tests for error handling on creation failure

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. UI tests must pass before proceeding.

---

## Phase 6: User Story 3 - 상품 상세 조회 (Priority: P3)

**Goal**: 관리자가 특정 상품의 상세 정보를 조회할 수 있습니다.

**Independent Test**: 관리자가 상품 목록에서 특정 상품을 선택하여 상세 정보를 조회할 수 있습니다.

### Implementation for User Story 3

> **NOTE: E2E 테스트가 모두 통과한 후에만 이 작업들을 시작합니다.**

### 상세 조회 UI 추가

- [X] T072 [US3] Add product detail view/modal component or page route in src/app/components/ProductsPage/index.tsx or create ProductDetail component
- [X] T073 [US3] Add click handler to ProductList rows to open product detail view in src/app/components/ProductList/index.tsx
- [X] T074 [US3] Implement getProductById API call when product is selected in src/app/components/ProductsPage/index.tsx or ProductDetail component
- [X] T075 [US3] Display product detail information (all fields from API response) in product detail view
- [X] T076 [US3] Map API Product fields to UI display format in product detail view
- [X] T077 [US3] Add loading state while fetching product detail
- [X] T078 [US3] Add error handling for product not found (404) with appropriate message
- [X] T079 [US3] Add error handling for API failures with toast notification

### UI 테스트

- [X] T080 [US3] Run UI tests for product detail view opening when product is clicked
- [X] T081 [US3] Run UI tests for product detail information display (all fields)
- [X] T082 [US3] Run UI tests for loading state while fetching product detail
- [X] T083 [US3] Run UI tests for error handling when product not found (404)
- [X] T084 [US3] Run UI tests for error handling on API failures

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. UI tests must pass before proceeding.

---

## Phase 7: User Story 4 - 상품 정보 수정 (Priority: P4)

**Goal**: 관리자가 등록된 상품의 정보를 수정할 수 있습니다.

**Independent Test**: 관리자가 상품 상세 정보에서 수정 버튼을 클릭하여 상품 정보를 변경하고 저장할 수 있습니다.

### Implementation for User Story 4

> **NOTE: E2E 테스트가 모두 통과한 후에만 이 작업들을 시작합니다.**

### 수정 폼 구현

- [X] T085 [US4] Add "수정" button to product detail view
- [X] T086 [US4] Create edit mode state in product detail view or ProductsPage component
- [X] T087 [US4] Load existing product data into edit form when edit button is clicked
- [X] T088 [US4] Map API Product fields to edit form fields (handle null values appropriately)
- [X] T089 [US4] Implement updateProduct API call with UpdateProductRequest in edit form submit handler
- [X] T090 [US4] Handle partial updates (only changed fields) in UpdateProductRequest
- [X] T091 [US4] Show success toast notification after successful product update
- [X] T092 [US4] Refresh product list and detail view after successful update
- [X] T093 [US4] Show error toast notification on API failure
- [X] T094 [US4] Add loading state during product update API call
- [X] T095 [US4] Add "취소" button to exit edit mode without saving
- [X] T096 [US4] Add client-side validation for required fields in edit form
- [X] T097 [US4] Display validation error messages for invalid inputs

### UI 테스트

- [X] T098 [US4] Run UI tests for edit mode activation when edit button is clicked
- [X] T099 [US4] Run UI tests for existing product data loading into edit form
- [X] T100 [US4] Run UI tests for product update flow (form submission)
- [X] T101 [US4] Run UI tests for updated product data reflecting in list and detail view
- [X] T102 [US4] Run UI tests for form validation in edit mode
- [X] T103 [US4] Run UI tests for cancel button functionality (exit edit mode without saving)
- [X] T104 [US4] Run UI tests for error handling on update failure

**Checkpoint**: At this point, User Stories 1, 2, 3, AND 4 should all work independently. UI tests must pass before proceeding.

---

## Phase 8: User Story 5 - 상품 삭제 (Priority: P5)

**Goal**: 관리자가 등록된 상품을 삭제할 수 있습니다. 삭제는 Soft Delete 방식으로 처리됩니다.

**Independent Test**: 관리자가 상품 상세 정보에서 삭제 버튼을 클릭하여 상품을 삭제할 수 있고, 삭제된 상품은 목록에서 제거됩니다.

### Implementation for User Story 5

> **NOTE: E2E 테스트가 모두 통과한 후에만 이 작업들을 시작합니다.**

### 삭제 기능 구현

- [X] T105 [US5] Add "삭제" button to product detail view
- [X] T106 [US5] Create delete confirmation dialog component using Radix UI AlertDialog
- [X] T107 [US5] Show confirmation dialog when delete button is clicked
- [X] T108 [US5] Implement deleteProduct API call when confirmation is confirmed
- [X] T109 [US5] Handle delete success: remove product from list or refresh list
- [X] T110 [US5] Show success toast notification after successful product deletion
- [X] T111 [US5] Show error toast notification on API failure
- [X] T112 [US5] Add loading state during product deletion API call
- [X] T113 [US5] Close product detail view after successful deletion
- [X] T114 [US5] Handle case where deleted product ID is used for detail view (show error or redirect)

### UI 테스트

- [X] T115 [US5] Run UI tests for delete confirmation dialog display
- [X] T116 [US5] Run UI tests for product deletion flow (confirmation → deletion)
- [X] T117 [US5] Run UI tests for deleted product removal from list
- [X] T118 [US5] Run UI tests for cancel button in delete confirmation dialog
- [X] T119 [US5] Run UI tests for error handling on deletion failure

**Checkpoint**: At this point, all User Stories (1-5) should be fully functional. UI tests must pass before proceeding.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 모든 사용자 스토리 완료 후 개선 및 통합 작업

### 에러 처리 개선

- [X] T120 [P] Implement consistent error handling pattern across all API calls
- [X] T121 [P] Handle token expiration (401) with automatic redirect to login page
- [X] T122 [P] Handle network errors with user-friendly error messages
- [X] T123 [P] Add retry logic for failed API calls (optional)

### 로딩 상태 개선

- [X] T124 [P] Implement consistent loading spinner/indicator across all components
- [X] T125 [P] Add skeleton loading states for better UX

### 성능 최적화

- [X] T126 [P] Implement proper debouncing for search input (if not done in US1)
- [X] T127 [P] Add pagination controls if needed (limit/offset from API response)
- [X] T128 [P] Optimize re-renders using React.memo or useMemo where appropriate

### UI/UX 개선

- [X] T129 [P] Ensure all API data fields are properly displayed in UI
- [X] T130 [P] Update ProductList component to handle all API Product fields correctly
- [X] T131 [P] Ensure date formatting is consistent (ISO 8601 → readable format)
- [X] T132 [P] Add proper empty states for all scenarios
- [X] T133 [P] Ensure responsive design works with new API data structure

### 코드 품질

- [X] T134 [P] Remove unused code and hardcoded data
- [X] T135 [P] Add TypeScript type safety checks
- [X] T136 [P] Ensure all components follow consistent code style
- [X] T137 [P] Add JSDoc comments for API functions

### 테스트

- [X] T138 [P] Verify all E2E tests still pass after UI changes
- [X] T139 [P] Add additional E2E tests for UI interactions if needed

### 최종 검증 및 푸시

- [X] T140 Run all UI tests for all user stories and verify all tests pass
- [X] T141 Run build command (`npm run build`) and verify build succeeds
- [X] T142 Run linting and verify no errors
- [ ] T143 Commit all changes with appropriate commit message
- [ ] T144 Push changes to remote repository (003-product-management branch)

**Checkpoint**: All UI tests pass, build succeeds, and changes are pushed to remote repository

---

## Dependencies & Execution Order

### Story Dependencies

- **US1 (목록 조회)** → No dependencies (MVP)
- **US2 (등록)** → Depends on US1 (needs list to show new product)
- **US3 (상세 조회)** → Depends on US1 (needs list to select product)
- **US4 (수정)** → Depends on US3 (needs detail view to edit)
- **US5 (삭제)** → Depends on US3 (needs detail view to delete)

### Parallel Execution Opportunities

**Phase 2 (Foundational)**:
- T005-T012 can be done in parallel (different files)

**Phase 3 (E2E Tests)**:
- T013-T018 can be done in parallel (different test cases)

**Phase 4 (US1)**:
- T029-T034 can be done in parallel (UI updates, different fields)
- T035-T038 can be done in parallel (different error/loading states)

**Phase 9 (Polish)**:
- Most tasks can be done in parallel (different concerns)

### MVP Scope

**Minimum Viable Product**: Phase 4 (User Story 1 - 상품 목록 조회)
- Allows users to view product list
- Search and filter functionality
- Basic CRUD foundation ready

### Implementation Strategy

1. **API First**: Complete Phase 2 (API client) before any UI work
2. **Test Early**: Complete Phase 3 (E2E tests) before UI data binding
3. **Incremental Delivery**: 
   - MVP: US1 only
   - Then: US2 (Create)
   - Then: US3 (Read detail)
   - Then: US4 (Update)
   - Finally: US5 (Delete)
4. **UI Adaptation**: Modify existing UI components to match API response structure

---

## Summary

- **Total Tasks**: 144
- **Tasks per Story**:
  - Setup: 4 tasks
  - Foundational: 8 tasks
  - E2E Tests: 7 tasks
  - US1 (목록 조회): 28 tasks (21 implementation + 7 UI tests)
  - US2 (등록): 24 tasks (18 implementation + 6 UI tests)
  - US3 (상세 조회): 13 tasks (8 implementation + 5 UI tests)
  - US4 (수정): 19 tasks (13 implementation + 6 UI tests)
  - US5 (삭제): 15 tasks (10 implementation + 5 UI tests)
  - Polish: 24 tasks (20 implementation + 4 final verification & push)

- **Independent Test Criteria**:
  - US1: Can view product list, search, and filter independently
  - US2: Can create product and see it in list independently
  - US3: Can view product detail independently
  - US4: Can edit product independently
  - US5: Can delete product independently

- **Suggested MVP**: Phase 4 (User Story 1) - 상품 목록 조회 기능만 구현하여 기본 기능 제공

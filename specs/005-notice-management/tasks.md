# Tasks: 공지사항 관리 페이지

**Input**: Design documents from `/specs/005-notice-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: E2E 테스트는 기존 Playwright 구조를 활용하여 작성합니다. 진행 순서는 **API 연결 → E2E 테스트(API 연동 위주) → 데이터 바인딩 → UI 테스트**입니다.

**Organization**: 작업은 사용자 스토리별로 그룹화되어 각 스토리를 독립적으로 구현하고 테스트할 수 있습니다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 이 작업이 속한 사용자 스토리 (예: US1, US2, US3)
- 설명에 정확한 파일 경로 포함

## Path Conventions

- Next.js App Router 구조: `src/app/` 기준
- 기존 프로젝트 구조 유지
- API 파일: `src/app/commons/apis/notice/`
- 타입 파일: `src/app/commons/apis/notice/` 내부
- 컴포넌트: `src/app/components/ReportsPage/`
- 테스트: `src/app/tests/api-tests/notice-test/`

## Phase 1: Setup (공유 인프라)

**Purpose**: 프로젝트 초기화 및 기본 구조 확인

- [X] T001 [P] Create directory structure for notice API in src/app/commons/apis/notice/
- [X] T002 [P] Create directory structure for notice tests in src/app/tests/api-tests/notice-test/
- [X] T003 [P] Verify existing ReportsPage component exists in src/app/components/ReportsPage/index.tsx

---

## Phase 2: Foundational (차단 필수 사항)

**Purpose**: 모든 사용자 스토리 구현 전에 반드시 완료해야 하는 핵심 인프라

**⚠️ CRITICAL**: 이 단계가 완료되지 않으면 사용자 스토리 작업을 시작할 수 없습니다

### 타입 정의

- [X] T004 [P] Create Notice type definitions in src/app/commons/apis/notice/types.ts (Notice, NoticeListItem, NoticeListResponse, NoticeDetailResponse, CreateNoticeRequest, CreateNoticeResponse, UpdateNoticeRequest, GetNoticesParams)

### API 클라이언트 구현

- [X] T005 [P] Create HTTP API client file in src/app/commons/apis/notice/http.ts with getNotices function (GET /api/notices with query params: search, limit, offset) - 공개 API
- [X] T006 [P] Implement getNoticeById function in src/app/commons/apis/notice/http.ts (GET /api/notices/{id}) - 공개 API
- [X] T007 [P] Implement createNotice function in src/app/commons/apis/notice/http.ts (POST /api/admin/notices) - 관리자 API
- [X] T008 [P] Implement updateNotice function in src/app/commons/apis/notice/http.ts (PATCH /api/admin/notices/{id}) - 관리자 API
- [X] T009 [P] Implement deleteNotice function in src/app/commons/apis/notice/http.ts (DELETE /api/admin/notices/{id}) - 관리자 API
- [X] T010 [P] Create index.ts export file in src/app/commons/apis/notice/index.ts to export all API functions and types
- [X] T011 [P] Verify API client uses existing apiClient with token interceptor for admin APIs in src/app/commons/apis/notice/http.ts

**Checkpoint**: Foundation ready - E2E 테스트를 먼저 실행합니다

---

## Phase 3: E2E 테스트 실행 및 검증

**Purpose**: API 클라이언트가 올바르게 구현되었는지 E2E 테스트로 검증합니다.

**⚠️ CRITICAL**: 이 단계의 모든 테스트가 통과해야만 데이터 바인딩 작업을 시작할 수 있습니다.

### E2E 테스트 작성 및 실행

- [X] T012 [P] Create E2E test file for notice API in src/app/tests/api-tests/notice-test/notice-api.spec.ts
- [X] T013 [P] Write E2E test for GET /api/notices (list notices with search, pagination) in src/app/tests/api-tests/notice-test/notice-api.spec.ts
- [X] T014 [P] Write E2E test for GET /api/notices/{id} (get notice detail) in src/app/tests/api-tests/notice-test/notice-api.spec.ts
- [X] T015 [P] Write E2E test for POST /api/admin/notices (create notice) in src/app/tests/api-tests/notice-test/notice-api.spec.ts
- [X] T016 [P] Write E2E test for PATCH /api/admin/notices/{id} (update notice) - only if POST test created data in src/app/tests/api-tests/notice-test/notice-api.spec.ts
- [X] T017 [P] Write E2E test for DELETE /api/admin/notices/{id} (delete notice) - only if POST test created data in src/app/tests/api-tests/notice-test/notice-api.spec.ts
- [X] T018 Run all E2E tests using `npm run test:e2e` and verify all notice API tests pass

**Checkpoint**: 모든 E2E 테스트 통과 확인 - 이제 데이터 바인딩 작업을 시작할 수 있습니다

---

## Phase 4: User Story 1 - 공지사항 목록 조회 (Priority: P1) 🎯 MVP

**Goal**: 관리자가 등록된 공지사항 목록을 조회하고 검색을 통해 원하는 공지사항을 찾을 수 있습니다.

**Independent Test**: 관리자가 로그인한 상태에서 공지사항 관리 페이지에 접근하여 공지사항 목록을 조회할 수 있고, 검색 기능을 통해 원하는 공지사항을 찾을 수 있습니다.

### Implementation for User Story 1

> **NOTE: E2E 테스트가 모두 통과한 후에만 이 작업들을 시작합니다.**

### API 데이터 바인딩

- [X] T019 [US1] Update ReportsPage component to fetch notices from API on mount in src/app/components/ReportsPage/index.tsx
- [X] T020 [US1] Replace hardcoded notices array with API call using getNotices function in src/app/components/ReportsPage/index.tsx
- [X] T021 [US1] Map API NoticeListItem type to existing Notice interface (id: string → number, add author/views fields for UI) in src/app/components/ReportsPage/index.tsx
- [X] T022 [US1] Update ReportsPage component to handle loading state during API call in src/app/components/ReportsPage/index.tsx
- [X] T023 [US1] Update ReportsPage component to handle error state when API call fails in src/app/components/ReportsPage/index.tsx
- [X] T024 [US1] Display empty state message when no notices are found in src/app/components/ReportsPage/index.tsx

### 검색 기능 (API 연동)

- [X] T025 [US1] Replace client-side search filter with API search parameter in src/app/components/ReportsPage/index.tsx
- [X] T026 [US1] Implement debounced search to reduce API calls in src/app/components/ReportsPage/index.tsx
- [X] T027 [US1] Update search input to trigger API call with search parameter in src/app/components/ReportsPage/index.tsx

### 고정 공지사항 정렬

- [X] T028 [US1] Sort notices to display pinned notices at the top in src/app/components/ReportsPage/index.tsx
- [X] T029 [US1] Display pinned indicator (badge or icon) for pinned notices in src/app/components/ReportsPage/index.tsx

### UI 테스트

- [X] T030 [US1] Verify notice list displays correctly with API data in src/app/components/ReportsPage/index.tsx
- [X] T031 [US1] Verify search functionality works with API integration in src/app/components/ReportsPage/index.tsx
- [X] T032 [US1] Verify empty state displays when no notices found in src/app/components/ReportsPage/index.tsx
- [X] T033 [US1] Verify loading state displays during API call in src/app/components/ReportsPage/index.tsx
- [X] T034 [US1] Verify error state displays when API call fails in src/app/components/ReportsPage/index.tsx

**Checkpoint**: User Story 1 완료 - 공지사항 목록 조회 및 검색 기능이 독립적으로 작동합니다

---

## Phase 5: User Story 2 - 공지사항 상세 조회 (Priority: P2)

**Goal**: 관리자가 특정 공지사항의 상세 내용을 조회할 수 있습니다.

**Independent Test**: 관리자가 공지사항 목록에서 특정 공지사항을 선택하여 상세 내용을 조회할 수 있습니다.

### Implementation for User Story 2

### API 데이터 바인딩

- [X] T035 [US2] Update ReportsPage component to fetch notice detail when notice is clicked in src/app/components/ReportsPage/index.tsx
- [X] T036 [US2] Replace hardcoded notice detail with API call using getNoticeById function in src/app/components/ReportsPage/index.tsx
- [X] T037 [US2] Map API Notice type to existing Notice interface for detail view in src/app/components/ReportsPage/index.tsx
- [X] T038 [US2] Update detail view to handle loading state during API call in src/app/components/ReportsPage/index.tsx
- [X] T039 [US2] Update detail view to handle error state when API call fails in src/app/components/ReportsPage/index.tsx
- [X] T040 [US2] Display error message when notice not found (404) in src/app/components/ReportsPage/index.tsx

### 네비게이션

- [X] T041 [US2] Implement "목록으로" button to return to list view in src/app/components/ReportsPage/index.tsx
- [X] T042 [US2] Update view state management to handle list/detail transitions in src/app/components/ReportsPage/index.tsx

### UI 테스트

- [X] T043 [US2] Verify notice detail displays correctly with API data in src/app/components/ReportsPage/index.tsx
- [X] T044 [US2] Verify "목록으로" button navigates back to list view in src/app/components/ReportsPage/index.tsx
- [X] T045 [US2] Verify error handling when notice not found in src/app/components/ReportsPage/index.tsx
- [X] T046 [US2] Verify loading state displays during detail API call in src/app/components/ReportsPage/index.tsx

**Checkpoint**: User Story 2 완료 - 공지사항 상세 조회 기능이 독립적으로 작동합니다

---

## Phase 6: User Story 3 - 공지사항 작성 (Priority: P3)

**Goal**: 관리자가 새로운 공지사항을 작성할 수 있습니다.

**Independent Test**: 관리자가 공지사항 작성 폼을 작성하고 제출하여 새 공지사항을 등록할 수 있고, 등록 후 목록에 새 공지사항이 표시됩니다.

### Implementation for User Story 3

### API 데이터 바인딩

- [X] T047 [US3] Update ReportsPage component to call createNotice API when form is submitted in src/app/components/ReportsPage/index.tsx
- [X] T048 [US3] Map form data to CreateNoticeRequest type (title, content, imageUrl, isPinned, isVisible) in src/app/components/ReportsPage/index.tsx
- [X] T049 [US3] Handle API response and update notice list after successful creation in src/app/components/ReportsPage/index.tsx
- [X] T050 [US3] Handle API error response and display error message in src/app/components/ReportsPage/index.tsx
- [X] T051 [US3] Reset form data after successful notice creation in src/app/components/ReportsPage/index.tsx

### 폼 검증

- [X] T052 [US3] Add client-side validation for required fields (title, content) in src/app/components/ReportsPage/index.tsx
- [X] T053 [US3] Display validation error messages when required fields are empty in src/app/components/ReportsPage/index.tsx
- [X] T054 [US3] Prevent form submission when validation fails in src/app/components/ReportsPage/index.tsx

### 폼 UI

- [X] T055 [US3] Update write form to include all fields (title, content, imageUrl, isPinned, isVisible) in src/app/components/ReportsPage/index.tsx
- [X] T056 [US3] Implement "취소" button to close form and reset data in src/app/components/ReportsPage/index.tsx
- [X] T057 [US3] Update form to show loading state during API call in src/app/components/ReportsPage/index.tsx

### UI 테스트

- [X] T058 [US3] Verify notice creation form displays correctly in src/app/components/ReportsPage/index.tsx
- [X] T059 [US3] Verify form validation works for required fields in src/app/components/ReportsPage/index.tsx
- [X] T060 [US3] Verify notice is created and appears in list after submission in src/app/components/ReportsPage/index.tsx
- [X] T061 [US3] Verify "취소" button closes form and resets data in src/app/components/ReportsPage/index.tsx
- [X] T062 [US3] Verify error handling when notice creation fails in src/app/components/ReportsPage/index.tsx
- [X] T063 [US3] Verify pinned notice appears at top of list after creation in src/app/components/ReportsPage/index.tsx

**Checkpoint**: User Story 3 완료 - 공지사항 작성 기능이 독립적으로 작동합니다

---

## Phase 7: User Story 4 - 공지사항 수정 (Priority: P4)

**Goal**: 관리자가 등록된 공지사항의 내용을 수정할 수 있습니다.

**Independent Test**: 관리자가 공지사항 상세 정보에서 수정 버튼을 클릭하여 공지사항 내용을 변경하고 저장할 수 있습니다.

### Implementation for User Story 4

> **NOTE: PATCH 테스트는 POST로 생성한 데이터가 있을 경우에만 진행합니다.**

### API 데이터 바인딩

- [X] T064 [US4] Update ReportsPage component to call updateNotice API when edit form is submitted in src/app/components/ReportsPage/index.tsx
- [X] T065 [US4] Map form data to UpdateNoticeRequest type (partial update support) in src/app/components/ReportsPage/index.tsx
- [X] T066 [US4] Handle API response and update notice detail view after successful update in src/app/components/ReportsPage/index.tsx
- [X] T067 [US4] Handle API error response and display error message in src/app/components/ReportsPage/index.tsx
- [X] T068 [US4] Refresh notice list after successful update to reflect changes in src/app/components/ReportsPage/index.tsx

### 수정 폼 UI

- [X] T069 [US4] Add "수정" button to notice detail view in src/app/components/ReportsPage/index.tsx
- [X] T070 [US4] Implement edit mode that populates form with existing notice data in src/app/components/ReportsPage/index.tsx
- [X] T071 [US4] Update form to support edit mode (pre-fill with existing data) in src/app/components/ReportsPage/index.tsx
- [X] T072 [US4] Implement "취소" button to exit edit mode and discard changes in src/app/components/ReportsPage/index.tsx
- [X] T073 [US4] Update form to show loading state during API call in src/app/components/ReportsPage/index.tsx

### 폼 검증

- [X] T074 [US4] Add client-side validation for required fields in edit mode in src/app/components/ReportsPage/index.tsx
- [X] T075 [US4] Display validation error messages when required fields are empty in src/app/components/ReportsPage/index.tsx

### UI 테스트

- [X] T076 [US4] Verify edit button opens form with existing data in src/app/components/ReportsPage/index.tsx
- [X] T077 [US4] Verify notice is updated and changes reflect in detail view after submission in src/app/components/ReportsPage/index.tsx
- [X] T078 [US4] Verify notice list is updated after successful edit in src/app/components/ReportsPage/index.tsx
- [X] T079 [US4] Verify "취소" button exits edit mode without saving in src/app/components/ReportsPage/index.tsx
- [X] T080 [US4] Verify error handling when notice update fails in src/app/components/ReportsPage/index.tsx

**Checkpoint**: User Story 4 완료 - 공지사항 수정 기능이 독립적으로 작동합니다

---

## Phase 8: User Story 5 - 공지사항 삭제 (Priority: P5)

**Goal**: 관리자가 등록된 공지사항을 삭제할 수 있습니다.

**Independent Test**: 관리자가 공지사항 상세 정보에서 삭제 버튼을 클릭하여 공지사항을 삭제할 수 있고, 삭제된 공지사항은 목록에서 제거됩니다.

> **NOTE: DELETE 테스트는 POST로 생성한 데이터가 있을 경우에만 진행합니다.**

### Implementation for User Story 5

### API 데이터 바인딩

- [ ] T081 [US5] Update ReportsPage component to call deleteNotice API when delete is confirmed in src/app/components/ReportsPage/index.tsx
- [ ] T082 [US5] Handle API response and remove notice from list after successful deletion in src/app/components/ReportsPage/index.tsx
- [ ] T083 [US5] Handle API error response and display error message in src/app/components/ReportsPage/index.tsx
- [ ] T084 [US5] Navigate to list view after successful deletion in src/app/components/ReportsPage/index.tsx

### 삭제 확인 다이얼로그

- [ ] T085 [US5] Add "삭제" button to notice detail view in src/app/components/ReportsPage/index.tsx
- [ ] T086 [US5] Implement delete confirmation dialog using AlertDialog component in src/app/components/ReportsPage/index.tsx
- [ ] T087 [US5] Handle "확인" button click to proceed with deletion in src/app/components/ReportsPage/index.tsx
- [ ] T088 [US5] Handle "취소" button click to close dialog without deletion in src/app/components/ReportsPage/index.tsx

### UI 테스트

- [ ] T089 [US5] Verify delete button opens confirmation dialog in src/app/components/ReportsPage/index.tsx
- [ ] T090 [US5] Verify notice is deleted and removed from list after confirmation in src/app/components/ReportsPage/index.tsx
- [ ] T091 [US5] Verify "취소" button closes dialog without deletion in src/app/components/ReportsPage/index.tsx
- [ ] T092 [US5] Verify navigation to list view after successful deletion in src/app/components/ReportsPage/index.tsx
- [ ] T093 [US5] Verify error handling when notice deletion fails in src/app/components/ReportsPage/index.tsx
- [ ] T094 [US5] Verify deleted notice cannot be accessed via detail view (404 error) in src/app/components/ReportsPage/index.tsx

**Checkpoint**: User Story 5 완료 - 공지사항 삭제 기능이 독립적으로 작동합니다

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: 여러 사용자 스토리에 영향을 미치는 개선 사항

### 에러 처리 개선

- [ ] T095 [P] Improve error handling for network errors across all API calls in src/app/components/ReportsPage/index.tsx
- [ ] T096 [P] Improve error handling for token expiration (401) across all admin API calls in src/app/components/ReportsPage/index.tsx
- [ ] T097 [P] Add consistent error message display using Toast notifications in src/app/components/ReportsPage/index.tsx

### 로딩 상태 개선

- [ ] T098 [P] Improve loading state UI consistency across all views in src/app/components/ReportsPage/index.tsx
- [ ] T099 [P] Add loading spinner component for better UX in src/app/components/ReportsPage/index.tsx

### 성능 최적화

- [ ] T100 [P] Implement proper debouncing for search input to reduce API calls in src/app/components/ReportsPage/index.tsx
- [ ] T101 [P] Add pagination support if needed for large notice lists in src/app/components/ReportsPage/index.tsx

### 코드 정리

- [ ] T102 [P] Refactor ReportsPage component to improve code organization in src/app/components/ReportsPage/index.tsx
- [ ] T103 [P] Remove unused code and comments in src/app/components/ReportsPage/index.tsx
- [ ] T104 [P] Add JSDoc comments for API functions in src/app/commons/apis/notice/http.ts

### 문서화

- [ ] T105 [P] Update component documentation in src/app/components/ReportsPage/index.tsx
- [ ] T106 [P] Verify quickstart.md examples work correctly

### 최종 검증

- [ ] T107 Run all E2E tests using `npm run test:e2e` and verify all tests pass
- [ ] T108 Run build command and verify no build errors
- [ ] T109 Verify all user stories work independently and together

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **E2E Tests (Phase 3)**: Depends on Foundational completion - BLOCKS data binding
- **User Stories (Phase 4-8)**: All depend on E2E Tests completion
  - User stories can then proceed sequentially in priority order (P1 → P2 → P3 → P4 → P5)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after E2E Tests (Phase 3) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after E2E Tests (Phase 3) - Uses US1 list view but independently testable
- **User Story 3 (P3)**: Can start after E2E Tests (Phase 3) - Creates data for US4/US5 tests
- **User Story 4 (P4)**: Can start after E2E Tests (Phase 3) - Requires POST data from US3 for tests
- **User Story 5 (P5)**: Can start after E2E Tests (Phase 3) - Requires POST data from US3 for tests

### Within Each User Story

- API connection before data binding
- Data binding before UI tests
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- All E2E test tasks marked [P] can run in parallel (within Phase 3)
- Once E2E Tests phase completes, user stories proceed sequentially
- Polish phase tasks marked [P] can run in parallel

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch all type and API client tasks together:
Task: "Create Notice type definitions in src/app/commons/types/notice.ts"
Task: "Create HTTP API client file in src/app/commons/apis/notice/http.ts"
Task: "Implement getNotices function..."
Task: "Implement getNoticeById function..."
Task: "Implement createNotice function..."
Task: "Implement updateNotice function..."
Task: "Implement deleteNotice function..."
Task: "Create index.ts export file..."
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: E2E Tests (CRITICAL - blocks data binding)
4. Complete Phase 4: User Story 1 (목록 조회)
5. **STOP and VALIDATE**: Test User Story 1 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Complete E2E Tests → API verified
3. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
4. Add User Story 2 → Test independently → Deploy/Demo
5. Add User Story 3 → Test independently → Deploy/Demo
6. Add User Story 4 → Test independently → Deploy/Demo (requires US3 data)
7. Add User Story 5 → Test independently → Deploy/Demo (requires US3 data)
8. Each story adds value without breaking previous stories

### Sequential Team Strategy

With single developer or sequential workflow:

1. Complete Setup + Foundational together
2. Complete E2E Tests
3. Once E2E Tests are done:
   - User Story 1 (목록 조회) → Test → Deploy
   - User Story 2 (상세 조회) → Test → Deploy
   - User Story 3 (작성) → Test → Deploy
   - User Story 4 (수정) → Test → Deploy (uses US3 data)
   - User Story 5 (삭제) → Test → Deploy (uses US3 data)
4. Stories complete and integrate sequentially

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- E2E tests must pass before data binding work begins
- PATCH/DELETE tests require POST data to exist
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- API 응답에 없는 필드(author, views)는 UI에서 처리합니다
- 공개 API(GET)는 인증 토큰이 필요하지 않습니다
- 관리자 API(POST, PATCH, DELETE)는 인증 토큰이 필요합니다

### 테스트 계정 사용 규칙

- **E2E 테스트 및 UI 테스트**: 모두 테스트 계정 사용 (환경 변수: `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`)
- **실제 구현**: 테스트 이메일/비밀번호 사용 금지 - 실제 사용자 인증 시스템 사용
- 테스트 파일에서만 환경 변수로부터 테스트 계정 정보를 읽어 사용
- 실제 컴포넌트 코드에는 테스트 계정 정보를 하드코딩하지 않음

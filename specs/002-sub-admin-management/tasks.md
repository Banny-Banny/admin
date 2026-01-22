# Tasks: 하위 관리자 계정 생성 및 관리

**Input**: Design documents from `/specs/002-sub-admin-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: E2E 테스트는 기존 Playwright 구조를 활용하여 작성합니다.

**Organization**: 작업은 사용자 스토리별로 그룹화되어 각 스토리를 독립적으로 구현하고 테스트할 수 있습니다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 이 작업이 속한 사용자 스토리 (예: US1)
- 설명에 정확한 파일 경로 포함

## Path Conventions

- Next.js App Router 구조: `src/app/` 기준
- 기존 프로젝트 구조 유지

## Phase 1: Setup (공유 인프라)

**Purpose**: 프로젝트 초기화 및 기본 구조

- [x] T001 [P] Add AdminListItem and AdminListResponse types to src/app/commons/apis/admin/index.ts
- [x] T002 [P] Add getAdminList API function to src/app/commons/apis/admin/index.ts
- [x] T003 [P] Update CreateAdminRequest interface to match API spec (email, name, password only - role optional or default) in src/app/commons/apis/admin/index.ts
- [x] T004 [P] Update CreateAdminResponse interface to include id, createdAt fields in src/app/commons/apis/admin/index.ts

---

## Phase 2: Foundational (차단 필수 사항)

**Purpose**: 모든 사용자 스토리 구현 전에 반드시 완료해야 하는 핵심 인프라

**⚠️ CRITICAL**: 이 단계가 완료되지 않으면 사용자 스토리 작업을 시작할 수 없습니다

- [x] T005 [P] Add isSuperAdmin helper function to src/app/commons/context/auth-context.tsx or create utility in src/app/commons/utils/admin-utils.ts
- [x] T006 [P] Verify useAuth hook exports admin information in src/app/commons/hooks/use-auth.ts

**Checkpoint**: Foundation ready - 사용자 스토리 구현을 이제 병렬로 시작할 수 있습니다

---

## Phase 3: User Story 1 - 슈퍼 어드민이 하위 관리자 계정 생성 (Priority: P1) 🎯 MVP

**Goal**: 슈퍼 어드민이 관리자 추가 버튼을 클릭하여 하위 관리자 계정을 생성할 수 있도록 합니다. 계정 생성 시 이름, 이메일, 임시 비밀번호를 입력하고, 생성된 계정은 즉시 관리자 목록에 표시됩니다.

**Independent Test**: 슈퍼 어드민이 관리자 추가 버튼을 클릭하고 필수 정보를 입력하여 하위 관리자 계정을 생성하고, 생성된 계정이 관리자 목록에 표시되는 것을 테스트할 수 있습니다.

### Implementation for User Story 1

- [x] T007 [US1] Update UsersPage component to check super admin permission before showing admin add button in src/app/components/UsersPage/index.tsx
- [x] T008 [US1] Replace local state management with API call for createAdmin in handleAdminSubmit function in src/app/components/UsersPage/index.tsx
- [x] T009 [US1] Add form validation using React Hook Form for admin creation form in src/app/components/UsersPage/index.tsx
- [x] T010 [US1] Add email format validation and duplicate email error handling in src/app/components/UsersPage/index.tsx
- [x] T011 [US1] Add password minimum length validation (8 characters) in src/app/components/UsersPage/index.tsx
- [x] T012 [US1] Implement error handling for API errors (400, 401, 403, 409, 500) with user-friendly messages in src/app/components/UsersPage/index.tsx
- [x] T013 [US1] Add loading state during admin creation API call in src/app/components/UsersPage/index.tsx
- [x] T014 [US1] Implement success message display after admin creation in src/app/components/UsersPage/index.tsx
- [x] T015 [US1] Update admin form to remove role field if API doesn't support it (based on actual API spec) in src/app/components/UsersPage/index.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. 슈퍼 어드민이 하위 관리자 계정을 생성할 수 있어야 합니다.

---

## Phase 4: User Story 2 - 생성된 관리자가 로그인하여 관리자 권한 획득 (Priority: P1)

**Goal**: 생성된 하위 관리자가 이메일과 임시 비밀번호로 로그인하여 관리자 권한을 획득하고 관리자 페이지에 접근할 수 있도록 합니다.

**Independent Test**: 생성된 하위 관리자 계정의 이메일과 비밀번호로 로그인 페이지에서 로그인을 시도하고, 로그인 성공 후 관리자 대시보드에 접근할 수 있는 것을 테스트할 수 있습니다.

**Note**: 이 기능은 이미 001-admin-auth에서 구현되어 있습니다. 생성된 관리자 계정이 동일한 로그인 API를 사용하는지 확인만 하면 됩니다.

### Implementation for User Story 2

- [x] T016 [US2] Verify that created admin accounts can use existing login API in src/app/commons/apis/admin/index.ts (no changes needed if login API works for all admins)
- [x] T017 [US2] Test login flow with newly created admin account to ensure it works correctly

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. 생성된 관리자가 로그인할 수 있어야 합니다.

---

## Phase 5: User Story 3 - 관리자 목록에 자동 추가 및 표시 (Priority: P2)

**Goal**: 하위 관리자 계정이 생성되면 즉시 관리자 목록에 추가되어 표시되도록 합니다. 관리자 목록에는 이름, 이메일, 권한, 가입일, 마지막 접속 정보가 표시되어야 합니다.

**Independent Test**: 하위 관리자 계정을 생성한 후 관리자 목록 섹션에서 새로 생성된 관리자가 표시되는 것을 테스트할 수 있습니다.

### Implementation for User Story 3

- [x] T018 [US3] Replace local admins state with API call to getAdminList in src/app/components/UsersPage/index.tsx
- [x] T019 [US3] Add useEffect to load admin list on component mount in src/app/components/UsersPage/index.tsx
- [x] T020 [US3] Update admin list display to show data from API response (id, email, name, role, createdAt, lastLoginAt) in src/app/components/UsersPage/index.tsx
- [x] T021 [US3] Implement admin list refresh after successful admin creation in src/app/components/UsersPage/index.tsx
- [x] T022 [US3] Add loading state for admin list in src/app/components/UsersPage/index.tsx
- [x] T023 [US3] Add error handling for admin list API call in src/app/components/UsersPage/index.tsx
- [x] T024 [US3] Format createdAt and lastLoginAt dates for display in src/app/components/UsersPage/index.tsx
- [x] T025 [US3] Sort admin list by createdAt DESC (newest first) in src/app/components/UsersPage/index.tsx

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. 관리자 목록이 실시간으로 업데이트되어야 합니다.

---

## Phase 6: User Story 4 - 각 관리자가 알림/마케팅 글 작성 및 관리 (Priority: P2)

**Goal**: 각 관리자는 자신의 계정으로 알림/마케팅 글을 작성하고 관리할 수 있도록 합니다. 작성된 글에는 작성자 정보(관리자 이름 또는 이메일)가 표시되어야 하며, 각 관리자는 자신이 작성한 글만 수정하거나 삭제할 수 있어야 합니다.

**Independent Test**: 하위 관리자로 로그인한 후 알림/마케팅 페이지에서 글을 작성하고, 작성된 글에 작성자 정보가 표시되는 것을 테스트할 수 있습니다.

### Implementation for User Story 4

- [x] T026 [US4] Add createdBy, createdByName, createdAt fields to Message interface in src/app/components/MarketingPage/index.tsx
- [x] T027 [US4] Update handleSubmit to include current admin info (admin.id, admin.name) when creating message in src/app/components/MarketingPage/index.tsx
- [x] T028 [US4] Add createdByName column to message history table in src/app/components/MarketingPage/index.tsx
- [x] T029 [US4] Display createdByName in message history table rows in src/app/components/MarketingPage/index.tsx
- [x] T030 [US4] Create canEditMessage helper function to check if current admin can edit/delete message in src/app/components/MarketingPage/index.tsx
- [x] T031 [US4] Add conditional rendering for edit/delete buttons based on canEditMessage in src/app/components/MarketingPage/index.tsx
- [x] T032 [US4] Update localStorage message storage to include createdBy, createdByName, createdAt fields in src/app/components/MarketingPage/index.tsx
- [x] T033 [US4] Update loadMessagesFromStorage to handle new fields (backward compatibility) in src/app/components/MarketingPage/index.tsx
- [x] T034 [US4] Add permission check for message edit/delete operations (frontend validation) in src/app/components/MarketingPage/index.tsx

**Checkpoint**: At this point, all user stories should now be independently functional. 각 관리자가 자신의 메시지를 작성하고 관리할 수 있어야 합니다.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 여러 사용자 스토리에 영향을 미치는 개선 사항

- [ ] T035 [P] Add E2E test for admin creation flow in src/app/tests/api-tests/admin-test/admin-management.spec.ts
- [ ] T036 [P] Add E2E test for admin list display in src/app/tests/api-tests/admin-test/admin-management.spec.ts
- [ ] T037 [P] Add E2E test for marketing message author display in src/app/tests/api-tests/admin-test/admin-management.spec.ts
- [x] T038 Code cleanup and refactoring for consistency
- [ ] T039 [P] Add error boundary handling for admin management features
- [ ] T040 [P] Add loading skeletons for better UX during API calls
- [x] T041 Run quickstart.md validation
- [x] T042 Update documentation if needed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 (admin must be created first to test login)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 (admin list needs created admins)
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Can be independent but benefits from US1/US2 (need admins to test)

### Within Each User Story

- API types/interfaces before API functions
- API functions before component integration
- Form validation before submission logic
- Error handling throughout
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes:
  - US1 and US3 can start in parallel (US3 needs US1's API but can prepare UI)
  - US2 depends on US1 completion
  - US4 can start independently but benefits from US1/US2
- Polish phase tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all type definitions together:
Task: "Add AdminListItem and AdminListResponse types to src/app/commons/apis/admin/index.ts"
Task: "Update CreateAdminRequest interface to match API spec in src/app/commons/apis/admin/index.ts"
Task: "Update CreateAdminResponse interface to include id, createdAt fields in src/app/commons/apis/admin/index.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (admin creation)
   - Developer B: User Story 3 (admin list) - can prepare UI while waiting for US1
3. After US1 completes:
   - Developer A: User Story 2 (login verification)
   - Developer B: User Story 4 (marketing author info)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- API spec shows email, name, password only (no role) - adjust implementation accordingly
- Verify API responses match expected structure
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

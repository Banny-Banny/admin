# Tasks: 일반 사용자 관리

**Input**: Design documents from `/specs/003-user-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - not explicitly requested in the feature specification, so test tasks are not included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `src/app/` at repository root
- Paths shown below follow Next.js App Router structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project structure verification and preparation

- [x] T001 Verify existing project structure matches implementation plan in `src/app/`
- [x] T002 [P] Verify existing API client setup in `src/app/commons/provider/api-provider/api-client.ts`
- [x] T003 [P] Verify existing authentication hook in `src/app/commons/hooks/use-auth.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core API functions and types that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] [US1] Extend UserStatus type to include 'BLOCKED' in `src/app/commons/apis/user/index.ts`
- [x] T005 [P] [US1] Extend User interface with missing fields (phoneNumber, profileImg, isMarketingAgreed, isPushAgreed) in `src/app/commons/apis/user/index.ts`
- [x] T006 [P] [US2] Add getUserById function in `src/app/commons/apis/user/index.ts`
- [x] T007 [P] [US4] Add blockUser function in `src/app/commons/apis/user/index.ts`
- [x] T008 [P] [US4] Add unblockUser function in `src/app/commons/apis/user/index.ts`
- [x] T009 [P] [US5] Add deactivateUser function in `src/app/commons/apis/user/index.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 일반 사용자 목록 조회 및 필터링 (Priority: P1) 🎯 MVP

**Goal**: 관리자가 앱을 사용하는 일반 사용자들의 목록을 조회하고, 검색어, 상태, 가입 기간 등의 조건으로 필터링하여 원하는 사용자를 찾을 수 있습니다.

**Independent Test**: 관리자 계정으로 로그인한 후 사용자 목록 페이지에 접근하여 목록이 표시되는지, 검색 및 필터 기능이 정상 작동하는지 확인할 수 있습니다.

### Implementation for User Story 1

- [x] T010 [US1] Add state management for user list (users, totalUsers, currentPage, pageSize, isLoadingUsers) in `src/app/components/UsersPage/index.tsx`
- [x] T011 [US1] Add state management for filters (searchTerm, statusFilter, startDate, endDate) in `src/app/components/UsersPage/index.tsx`
- [x] T012 [US1] Implement loadUsers function with API call to getUsers in `src/app/components/UsersPage/index.tsx`
- [x] T013 [US1] Implement debounced search effect (500ms delay) for searchTerm in `src/app/components/UsersPage/index.tsx`
- [x] T014 [US1] Implement useEffect hooks for filter changes (statusFilter, startDate, endDate, currentPage) in `src/app/components/UsersPage/index.tsx`
- [x] T015 [US1] Implement user list table UI with columns (닉네임, 이메일, 전화번호, 상태, 가입일, 액션) in `src/app/components/UsersPage/index.tsx`
- [x] T016 [US1] Implement status badge component with color coding (ACTIVE: 초록, INACTIVE: 회색, BLOCKED: 빨강) in `src/app/components/UsersPage/index.tsx`
- [x] T017 [US1] Implement loading state UI in user list table in `src/app/components/UsersPage/index.tsx`
- [x] T018 [US1] Implement empty state UI ("검색 결과가 없습니다") in `src/app/components/UsersPage/index.tsx`
- [x] T019 [US1] Implement pagination controls (이전/다음 버튼, 페이지 정보) in `src/app/components/UsersPage/index.tsx`
- [x] T020 [US1] Implement date range filter UI (startDate, endDate inputs) in `src/app/components/UsersPage/index.tsx`
- [x] T021 [US1] Add error handling for API failures with toast notifications in `src/app/components/UsersPage/index.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can search, filter, and paginate through the user list.

---

## Phase 4: User Story 2 - 사용자 상세 정보 조회 (Priority: P1)

**Goal**: 관리자가 목록에서 특정 사용자를 선택하여 해당 사용자의 상세 정보를 조회할 수 있습니다.

**Independent Test**: 사용자 목록에서 특정 사용자를 클릭하거나 상세 보기 버튼을 통해 해당 사용자의 상세 정보가 모달 또는 별도 화면에 표시되는지 확인할 수 있습니다.

### Implementation for User Story 2

- [x] T022 [US2] Add state management for user detail modal (selectedUser, showUserDetail) in `src/app/components/UsersPage/index.tsx`
- [x] T023 [US2] Implement handleViewUserDetail function to fetch and display user details in `src/app/components/UsersPage/index.tsx`
- [x] T024 [US2] Create user detail modal/dialog component with user information display in `src/app/components/UsersPage/index.tsx`
- [x] T025 [US2] Display user detail fields (닉네임, 이메일, 전화번호, 프로필 이미지, 마케팅 동의, 푸시 알림 동의, 가입일, 상태) in `src/app/components/UsersPage/index.tsx`
- [x] T026 [US2] Implement close button functionality for user detail modal in `src/app/components/UsersPage/index.tsx`
- [x] T027 [US2] Add "상세 보기" action menu item in user list table dropdown in `src/app/components/UsersPage/index.tsx`
- [x] T028 [US2] Add error handling for getUserById API failures in `src/app/components/UsersPage/index.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can view the list and see detailed information for any user.

---

## Phase 5: User Story 3 - 사용자 정보 수정 (Priority: P2)

**Goal**: 관리자가 일반 사용자의 정보(닉네임, 이메일, 전화번호, 프로필 이미지, 마케팅 동의 여부, 푸시 알림 동의 여부)를 수정할 수 있습니다.

**Independent Test**: 사용자 상세 정보 화면에서 정보를 수정하고 저장 버튼을 클릭하여 변경사항이 반영되는지 확인할 수 있습니다.

### Implementation for User Story 3

- [x] T029 [US3] Add state management for edit mode (isEditingUser) in `src/app/components/UsersPage/index.tsx`
- [x] T030 [US3] Implement React Hook Form setup for user edit form in `src/app/components/UsersPage/index.tsx`
- [x] T031 [US3] Create edit form fields (nickname, email, phoneNumber, profileImg, isMarketingAgreed, isPushAgreed) in `src/app/components/UsersPage/index.tsx`
- [x] T032 [US3] Add form validation rules (email format, phoneNumber format, maxLength) using React Hook Form in `src/app/components/UsersPage/index.tsx`
- [x] T033 [US3] Implement handleUpdateUser function to call updateUser API in `src/app/components/UsersPage/index.tsx`
- [x] T034 [US3] Add "편집" button in user detail modal to switch to edit mode in `src/app/components/UsersPage/index.tsx`
- [x] T035 [US3] Add "저장" and "취소" buttons in edit mode in `src/app/components/UsersPage/index.tsx`
- [x] T036 [US3] Implement form submission with validation error display in `src/app/components/UsersPage/index.tsx`
- [x] T037 [US3] Refresh user list after successful update in `src/app/components/UsersPage/index.tsx`
- [x] T038 [US3] Show success toast notification after update in `src/app/components/UsersPage/index.tsx`
- [x] T039 [US3] Add error handling for update API failures with inline error messages in `src/app/components/UsersPage/index.tsx`
- [x] T040 [US3] Add "정보 수정" action menu item in user list table dropdown in `src/app/components/UsersPage/index.tsx`

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. Users can view the list, see details, and edit user information.

---

## Phase 6: User Story 4 - 사용자 차단 및 해제 (Priority: P2)

**Goal**: 관리자가 문제가 있는 사용자를 차단하여 서비스 이용을 제한하거나, 차단된 사용자의 차단을 해제할 수 있습니다.

**Independent Test**: 사용자 목록 또는 상세 화면에서 차단 버튼을 클릭하여 사용자를 차단하고, 차단된 사용자에게는 해제 버튼이 표시되어 차단을 해제할 수 있는지 확인할 수 있습니다.

### Implementation for User Story 4

- [x] T041 [US4] Implement handleBlockUser function with confirmation dialog in `src/app/components/UsersPage/index.tsx`
- [x] T042 [US4] Implement handleUnblockUser function with confirmation dialog in `src/app/components/UsersPage/index.tsx`
- [x] T043 [US4] Add confirmation dialog component using AlertDialog for block/unblock actions in `src/app/components/UsersPage/index.tsx`
- [x] T044 [US4] Add "차단" action menu item (only for ACTIVE users) in user list table dropdown in `src/app/components/UsersPage/index.tsx`
- [x] T045 [US4] Add "차단 해제" action menu item (only for BLOCKED users) in user list table dropdown in `src/app/components/UsersPage/index.tsx`
- [x] T046 [US4] Refresh user list after successful block/unblock in `src/app/components/UsersPage/index.tsx`
- [x] T047 [US4] Show success toast notification after block/unblock in `src/app/components/UsersPage/index.tsx`
- [x] T048 [US4] Add error handling for block/unblock API failures in `src/app/components/UsersPage/index.tsx`
- [x] T049 [US4] Handle cancel action in confirmation dialog (no API call) in `src/app/components/UsersPage/index.tsx`
- [x] T050 [US4] Add block/unblock buttons in user detail modal (conditional based on status) in `src/app/components/UsersPage/index.tsx`

**Checkpoint**: At this point, User Stories 1, 2, 3, AND 4 should all work independently. Users can view, edit, block, and unblock users.

---

## Phase 7: User Story 5 - 사용자 탈퇴 처리 (Priority: P3)

**Goal**: 관리자가 사용자의 탈퇴를 처리할 수 있습니다. 이는 소프트 삭제 방식으로, 사용자 데이터는 완전히 삭제되지 않고 비활성화 상태로 변경됩니다.

**Independent Test**: 사용자 목록 또는 상세 화면에서 탈퇴 처리 버튼을 클릭하고 확인하여 사용자가 탈퇴 상태로 변경되는지 확인할 수 있습니다.

### Implementation for User Story 5

- [x] T051 [US5] Implement handleDeactivateUser function with confirmation dialog in `src/app/components/UsersPage/index.tsx`
- [x] T052 [US5] Add confirmation dialog with warning message ("이 작업은 되돌릴 수 없습니다") in `src/app/components/UsersPage/index.tsx`
- [x] T053 [US5] Add "탈퇴 처리" action menu item (only for ACTIVE or BLOCKED users) in user list table dropdown in `src/app/components/UsersPage/index.tsx`
- [x] T054 [US5] Refresh user list after successful deactivation in `src/app/components/UsersPage/index.tsx`
- [x] T055 [US5] Show success toast notification after deactivation in `src/app/components/UsersPage/index.tsx`
- [x] T056 [US5] Add error handling for deactivate API failures in `src/app/components/UsersPage/index.tsx`
- [x] T057 [US5] Handle cancel action in confirmation dialog (no API call) in `src/app/components/UsersPage/index.tsx`
- [x] T058 [US5] Add deactivate button in user detail modal (conditional based on status) in `src/app/components/UsersPage/index.tsx`
- [x] T059 [US5] Verify INACTIVE users appear in filtered list when status filter is set to INACTIVE in `src/app/components/UsersPage/index.tsx`

**Checkpoint**: All user stories should now be independently functional. Complete user management functionality is available.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T060 [P] Add loading skeleton component for better UX during data fetching in `src/app/components/UsersPage/index.tsx`
- [ ] T061 [P] Improve error messages with more specific details in `src/app/components/UsersPage/index.tsx`
- [ ] T062 [P] Add keyboard navigation support for accessibility in `src/app/components/UsersPage/index.tsx`
- [ ] T063 [P] Optimize re-renders using React.memo for user list items in `src/app/components/UsersPage/index.tsx`
- [ ] T064 [P] Add responsive design improvements for mobile devices in `src/app/components/UsersPage/index.tsx`
- [ ] T065 [P] Add tooltips for action buttons to improve UX in `src/app/components/UsersPage/index.tsx`
- [ ] T066 [P] Verify all API error codes are handled appropriately (401, 404, 500) in `src/app/components/UsersPage/index.tsx`
- [ ] T067 [P] Add input sanitization for search terms to prevent XSS in `src/app/components/UsersPage/index.tsx`
- [ ] T068 [P] Code cleanup and refactoring for maintainability in `src/app/components/UsersPage/index.tsx`
- [ ] T069 [P] Run quickstart.md validation to ensure all examples work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 for user list UI, but can be implemented independently
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on US2 for user detail modal, but can be implemented independently
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Can be implemented independently, but integrates with US1/US2
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Can be implemented independently, but integrates with US1/US2

### Within Each User Story

- State management before UI components
- API integration before UI updates
- Core functionality before error handling
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, user stories can start in parallel (if team capacity allows)
- Different user stories can be worked on in parallel by different team members
- Polish phase tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# All foundational API functions can be implemented in parallel:
Task: "Extend UserStatus type to include 'BLOCKED' in src/app/commons/apis/user/index.ts"
Task: "Extend User interface with missing fields in src/app/commons/apis/user/index.ts"
Task: "Add getUserById function in src/app/commons/apis/user/index.ts"
Task: "Add blockUser function in src/app/commons/apis/user/index.ts"
Task: "Add unblockUser function in src/app/commons/apis/user/index.ts"
Task: "Add deactivateUser function in src/app/commons/apis/user/index.ts"

# Within User Story 1, some tasks can be done in parallel:
Task: "Add state management for user list in src/app/components/UsersPage/index.tsx"
Task: "Add state management for filters in src/app/components/UsersPage/index.tsx"
Task: "Implement user list table UI in src/app/components/UsersPage/index.tsx"
Task: "Implement pagination controls in src/app/components/UsersPage/index.tsx"
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
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (목록 조회)
   - Developer B: User Story 2 (상세 조회) - can start after US1 UI is ready
   - Developer C: User Story 4 (차단/해제) - can start in parallel
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All tasks target the same file (`src/app/components/UsersPage/index.tsx`) but are organized by feature area to minimize conflicts
- API functions are in separate file (`src/app/commons/apis/user/index.ts`) and can be developed in parallel

## Task Summary

- **Total Tasks**: 69
- **Setup Tasks**: 3
- **Foundational Tasks**: 6
- **User Story 1 Tasks**: 12
- **User Story 2 Tasks**: 7
- **User Story 3 Tasks**: 12
- **User Story 4 Tasks**: 10
- **User Story 5 Tasks**: 9
- **Polish Tasks**: 10
- **Parallel Opportunities**: Foundational phase (6 tasks), Polish phase (10 tasks)

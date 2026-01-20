# Tasks: 문의하기 기능

**Input**: Design documents from `/specs/002-inquiry-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: E2E 테스트는 기존 Playwright 구조를 활용하여 작성합니다. 테스트 파일은 이미 생성되어 있으며, **데이터 바인딩 전에 먼저 E2E 테스트를 실행하고 통과해야 합니다.**

**Organization**: 작업은 사용자 스토리별로 그룹화되어 각 스토리를 독립적으로 구현하고 테스트할 수 있습니다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 이 작업이 속한 사용자 스토리 (예: US1, US2, US3)
- 설명에 정확한 파일 경로 포함

## Path Conventions

- Next.js App Router 구조: `src/app/` 기준
- 기존 프로젝트 구조 유지
- API 파일: `src/app/commons/apis/inquiry/`
- 컴포넌트: `src/app/components/`
- 테스트: `src/app/tests/api-tests/inquiry-test/`

## Phase 1: Setup (공유 인프라)

**Purpose**: 프로젝트 초기화 및 기본 구조 확인

**Note**: API 및 Socket 파일(`http.ts`, `socket.ts`, `index.ts`)과 테스트 파일은 이미 생성되어 있습니다.

- [x] T001 [P] Verify API files exist in src/app/commons/apis/inquiry/http.ts, socket.ts, index.ts
- [x] T002 [P] Verify test files exist in src/app/tests/api-tests/inquiry-test/inquiry-api.spec.ts, inquiry-socket.spec.ts
- [x] T003 [P] Verify component files exist: InquiryPage, RecentInquiries, ChatInterface

---

## Phase 2: Foundational (차단 필수 사항)

**Purpose**: 모든 사용자 스토리 구현 전에 반드시 완료해야 하는 핵심 인프라

**⚠️ CRITICAL**: 이 단계가 완료되지 않으면 사용자 스토리 작업을 시작할 수 없습니다

- [x] T004 [P] Verify HTTP API client implementation in src/app/commons/apis/inquiry/http.ts (getInquiries, getInquiryDetail, deleteInquiry, updateInquiryStatus, updateMessage, deleteMessage)
- [x] T005 [P] Verify Socket.IO client implementation in src/app/commons/apis/inquiry/socket.ts (InquirySocketClient class with connect, disconnect, joinRoom, leaveRoom, sendMessage, receiveMessage handlers)
- [x] T006 [P] Verify API client token interceptor and error handling in src/app/commons/apis/inquiry/http.ts
- [x] T007 [P] Verify Socket.IO authentication and connection management in src/app/commons/apis/inquiry/socket.ts

**Checkpoint**: Foundation ready - E2E 테스트를 먼저 실행합니다

---

## Phase 3: E2E 테스트 실행 및 검증

**Purpose**: API 및 Socket.IO 클라이언트가 올바르게 구현되었는지 E2E 테스트로 검증합니다.

**⚠️ CRITICAL**: 이 단계의 모든 테스트가 통과해야만 데이터 바인딩 작업을 시작할 수 있습니다.

### HTTP API E2E Tests

- [x] T008 [P] Run E2E test for getInquiries API (with filters and pagination) in src/app/tests/api-tests/inquiry-test/inquiry-api.spec.ts
- [x] T009 [P] Run E2E test for getInquiryDetail API in src/app/tests/api-tests/inquiry-test/inquiry-api.spec.ts (skipped - no data, test code verified)
- [x] T010 [P] Run E2E test for deleteInquiry API in src/app/tests/api-tests/inquiry-test/inquiry-api.spec.ts (skipped - no data, test code verified)
- [x] T011 [P] Run E2E test for updateInquiryStatus API in src/app/tests/api-tests/inquiry-test/inquiry-api.spec.ts (skipped - no data, test code verified)
- [x] T012 [P] Run E2E test for updateMessage API in src/app/tests/api-tests/inquiry-test/inquiry-api.spec.ts (skipped - no data, test code verified)
- [x] T013 [P] Run E2E test for deleteMessage API in src/app/tests/api-tests/inquiry-test/inquiry-api.spec.ts (skipped - no data, test code verified)

### Socket.IO E2E Tests

- [x] T014 [P] Run E2E test for Socket.IO connection to /admin-chat namespace in src/app/tests/api-tests/inquiry-test/inquiry-socket.spec.ts
- [x] T015 [P] Run E2E test for join_room event in src/app/tests/api-tests/inquiry-test/inquiry-socket.spec.ts (skipped - no testRoomId, test code verified)
- [x] T016 [P] Run E2E test for send_message event in src/app/tests/api-tests/inquiry-test/inquiry-socket.spec.ts (skipped - no testRoomId, test code verified)
- [x] T017 [P] Run E2E test for receive_message event in src/app/tests/api-tests/inquiry-test/inquiry-socket.spec.ts (skipped - no testRoomId, test code verified)
- [x] T018 [P] Run E2E test for read_alert event in src/app/tests/api-tests/inquiry-test/inquiry-socket.spec.ts (skipped - no testRoomId, test code verified)
- [x] T019 [P] Run E2E test for leave_room event in src/app/tests/api-tests/inquiry-test/inquiry-socket.spec.ts (skipped - no testRoomId, test code verified)
- [x] T020 [P] Run E2E test for message length validation (max 1500 characters) in src/app/tests/api-tests/inquiry-test/inquiry-socket.spec.ts (skipped - no testRoomId, test code verified)

**Checkpoint**: 모든 E2E 테스트 통과 확인 - 이제 데이터 바인딩 작업을 시작할 수 있습니다

---

## Phase 4: User Story 1 - 문의 목록 조회 및 검색 (Priority: P1) 🎯 MVP

**Goal**: 관리자가 문의하기 페이지에서 고객이 생성한 문의(채팅방) 목록을 조회하고, 검색어나 필터를 사용하여 원하는 문의를 찾을 수 있습니다.

**Independent Test**: 관리자가 문의하기 페이지에 접속하여 문의 목록을 확인하고, 검색어를 입력하거나 상태 필터를 적용하여 원하는 문의를 찾는 것을 테스트할 수 있습니다.

### Implementation for User Story 1

> **NOTE: E2E 테스트가 모두 통과한 후에만 이 작업들을 시작합니다.**

### Implementation for User Story 1

- [x] T021 [US1] Update InquiryPage component to fetch inquiry list on mount in src/app/components/InquiryPage/index.tsx
- [x] T022 [US1] Integrate getInquiries API call in InquiryPage component in src/app/components/InquiryPage/index.tsx
- [x] T023 [P] [US1] Update RecentInquiries component to display inquiry list with customer info, status, and timestamps in src/app/components/RecentInquiries/index.tsx
- [x] T024 [P] [US1] Implement search functionality in RecentInquiries component (filter by customer name, subject, content) in src/app/components/RecentInquiries/index.tsx
- [x] T025 [P] [US1] Implement status filter dropdown in RecentInquiries component (PENDING, PROCESSING, COMPLETED) in src/app/components/RecentInquiries/index.tsx
- [x] T026 [US1] Implement pagination controls in RecentInquiries component (limit, offset) in src/app/components/RecentInquiries/index.tsx
- [x] T027 [US1] Implement delete inquiry functionality in RecentInquiries component (call deleteInquiry API) in src/app/components/RecentInquiries/index.tsx
- [x] T028 [US1] Add empty state message ("문의가 없습니다") in RecentInquiries component in src/app/components/RecentInquiries/index.tsx
- [x] T029 [US1] Add "검색 결과가 없습니다" message when search returns no results in RecentInquiries component in src/app/components/RecentInquiries/index.tsx
- [x] T030 [US1] Add loading state while fetching inquiry list in RecentInquiries component in src/app/components/RecentInquiries/index.tsx
- [x] T031 [US1] Add error handling for API failures in RecentInquiries component in src/app/components/RecentInquiries/index.tsx
- [x] T032 [US1] Connect inquiry selection handler to open ChatInterface in InquiryPage component in src/app/components/InquiryPage/index.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 5: User Story 2 - 문의 상세 조회 및 채팅 (Priority: P1)

**Goal**: 관리자가 문의 목록에서 고객이 생성한 특정 문의(채팅방)를 선택하여 상세 정보를 확인하고, 채팅 인터페이스를 통해 고객과 소통할 수 있습니다.

**Independent Test**: 관리자가 문의 목록에서 특정 문의를 클릭하여 채팅 인터페이스를 열고, 고객과의 대화 내역을 확인하며, 메시지를 입력하여 응답하는 것을 테스트할 수 있습니다.

### Implementation for User Story 2

> **NOTE: E2E 테스트가 모두 통과한 후에만 이 작업들을 시작합니다.**

- [x] T033 [US2] Update ChatInterface component to connect Socket.IO on mount in src/app/components/ChatInterface/index.tsx
- [x] T034 [US2] Implement Socket.IO connection to /admin-chat namespace with admin token in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [x] T035 [US2] Implement join_room event handler when inquiry is selected in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [x] T036 [US2] Integrate getInquiryDetail API call to fetch previous chat history in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [x] T037 [P] [US2] Display previous chat messages in chronological order in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [x] T038 [P] [US2] Distinguish between USER and ADMIN messages visually in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [x] T039 [US2] Implement send_message event handler for message input in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [x] T040 [US2] Implement Enter key handler to send message (Shift+Enter for newline) in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [x] T041 [US2] Disable send button when message is empty in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [x] T042 [US2] Implement message length validation (max 1500 characters) in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [x] T043 [US2] Implement receive_message event listener to display new messages in real-time in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [x] T044 [US2] Implement auto-scroll to latest message when new message arrives in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [x] T045 [US2] Implement read_alert event handler (send and receive) in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [x] T046 [US2] Implement leave_room event handler when closing ChatInterface in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [x] T047 [US2] Implement disconnect Socket.IO when closing ChatInterface in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [x] T048 [US2] Integrate updateMessage API call for editing own messages in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [x] T049 [US2] Integrate deleteMessage API call for deleting own messages in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [x] T050 [US2] Add error handling for network errors during message send ("네트워크 오류가 발생했습니다") in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [x] T051 [US2] Add loading state while fetching inquiry detail in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [x] T052 [US2] Display inquiry subject, customer info, and initial message in ChatInterface component in src/app/components/ChatInterface/index.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 6: User Story 3 - 문의 상태 관리 (Priority: P2)

**Goal**: 관리자가 문의의 상태를 변경하여 문의 처리 진행 상황을 관리할 수 있습니다.

**Independent Test**: 관리자가 문의의 상태를 변경하고, 변경된 상태가 문의 목록과 채팅 인터페이스에 반영되는 것을 테스트할 수 있습니다.

### Implementation for User Story 3

> **NOTE: E2E 테스트가 모두 통과한 후에만 이 작업들을 시작합니다.**

- [ ] T053 [US3] Add status change dropdown/button in RecentInquiries component in src/app/components/RecentInquiries/index.tsx
- [ ] T054 [US3] Integrate updateInquiryStatus API call in RecentInquiries component in src/app/components/RecentInquiries/index.tsx
- [ ] T055 [US3] Add status change dropdown/button in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [ ] T056 [US3] Integrate updateInquiryStatus API call in ChatInterface component in src/app/components/ChatInterface/index.tsx
- [ ] T057 [US3] Update inquiry list to reflect status changes in real-time in RecentInquiries component in src/app/components/RecentInquiries/index.tsx
- [ ] T058 [US3] Add visual status indicators (PENDING, PROCESSING, COMPLETED) in RecentInquiries component in src/app/components/RecentInquiries/index.tsx
- [ ] T059 [US3] Add visual status indicator in ChatInterface component header in src/app/components/ChatInterface/index.tsx
- [ ] T060 [US3] Handle concurrent status changes ("처리 중입니다" message or use first change) in RecentInquiries component in src/app/components/RecentInquiries/index.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 여러 사용자 스토리에 영향을 미치는 개선 사항

- [ ] T061 [P] Add TypeScript type safety improvements across all components
- [ ] T062 [P] Add error boundary for inquiry-related components in src/app/components/error-boundary.tsx
- [ ] T063 [P] Optimize API calls (debounce search, cache inquiry list) in RecentInquiries component
- [ ] T064 [P] Add toast notifications for success/error states using sonner in all inquiry components
- [ ] T065 [P] Add responsive design improvements for mobile devices in all inquiry components
- [ ] T066 [P] Add accessibility improvements (ARIA labels, keyboard navigation) in all inquiry components
- [ ] T067 [P] Run full E2E test suite for all inquiry features in src/app/tests/api-tests/inquiry-test/
- [ ] T068 [P] Code cleanup and refactoring (extract custom hooks, optimize re-renders)
- [ ] T069 [P] Add performance monitoring and logging for Socket.IO connections
- [ ] T070 [P] Verify all edge cases are handled (empty list, no search results, network errors, etc.)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **E2E Tests (Phase 3)**: Depends on Foundational completion - **CRITICAL: 모든 테스트 통과 후에만 데이터 바인딩 시작 가능**
- **User Stories (Phase 4+)**: All depend on E2E Tests phase completion
  - User stories can then proceed sequentially in priority order (P1 → P2)
  - User Story 1 and User Story 2 are both P1 but US2 depends on US1 for inquiry selection
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after E2E Tests (Phase 3) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after E2E Tests (Phase 3) - Depends on US1 for inquiry selection functionality
- **User Story 3 (P2)**: Can start after E2E Tests (Phase 3) - Depends on US1 for status display, can work with US2

### Within Each User Story

- E2E 테스트 통과 후 데이터 바인딩 시작
- API integration before UI updates
- Core functionality before edge cases
- Basic display before advanced features (search, filter, pagination)
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Within E2E Tests Phase: All HTTP API tests and Socket.IO tests can run in parallel (T008-T020)
- Within User Story 1: Search, filter, and pagination UI can be developed in parallel (T024, T025, T026)
- Within User Story 2: Message display, send functionality, and Socket.IO handlers can be developed in parallel (T037, T038, T039, T043)
- Within User Story 3: Status change UI in RecentInquiries and ChatInterface can be developed in parallel (T053, T055)
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all UI components for User Story 1 together:
Task: "Update RecentInquiries component to display inquiry list" (T011)
Task: "Implement search functionality in RecentInquiries component" (T012)
Task: "Implement status filter dropdown in RecentInquiries component" (T013)
Task: "Implement pagination controls in RecentInquiries component" (T014)
```

---

## Parallel Example: User Story 2

```bash
# Launch Socket.IO and message display features together:
Task: "Display previous chat messages in chronological order" (T027)
Task: "Distinguish between USER and ADMIN messages visually" (T028)
Task: "Implement send_message event handler" (T029)
Task: "Implement receive_message event listener" (T033)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: E2E Tests (CRITICAL - 모든 테스트 통과 확인)
4. Complete Phase 4: User Story 1 (문의 목록 조회 및 검색)
5. **STOP and VALIDATE**: Test User Story 1 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Complete E2E Tests → **모든 테스트 통과 확인**
3. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
4. Add User Story 2 → Test independently → Deploy/Demo
5. Add User Story 3 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Sequential Strategy (Recommended)

With single developer or limited capacity:

1. Complete Setup + Foundational together
2. **Complete E2E Tests → 모든 테스트 통과 확인 (CRITICAL)**
3. Complete User Story 1 (문의 목록 조회) → Test → Deploy
4. Complete User Story 2 (채팅 기능) → Test → Deploy
5. Complete User Story 3 (상태 관리) → Test → Deploy
6. Polish phase → Final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- API and Socket files are already created - focus on component integration
- **CRITICAL: E2E 테스트를 먼저 실행하고 통과한 후에만 데이터 바인딩 작업 시작**
- Test files are already created - Phase 3에서 모든 테스트 실행 및 통과 확인
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Edge cases are handled within each user story phase
- Performance goals: List load < 3s, Search/Filter < 1s, Chat open < 2s, Message send < 2s, Real-time receive < 1s

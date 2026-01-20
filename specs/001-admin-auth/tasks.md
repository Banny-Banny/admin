# Tasks: 관리자 로그인

**Input**: Design documents from `/specs/001-admin-auth/`
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

- [x] T001 [P] Create TypeScript type definitions for authentication in src/app/commons/types/auth.ts
- [x] T002 [P] Create token storage utility in src/app/commons/utils/token-storage.ts
- [x] T003 [P] Verify AdminRole enum exists in src/app/commons/enums.ts

---

## Phase 2: Foundational (차단 필수 사항)

**Purpose**: 모든 사용자 스토리 구현 전에 반드시 완료해야 하는 핵심 인프라

**⚠️ CRITICAL**: 이 단계가 완료되지 않으면 사용자 스토리 작업을 시작할 수 없습니다

- [x] T004 Update API client to add token interceptor in src/app/commons/provider/api-provider/api-client.ts
- [x] T005 [P] Implement token refresh logic in API client interceptor in src/app/commons/provider/api-provider/api-client.ts
- [x] T006 [P] Create authentication context provider in src/app/commons/context/auth-context.tsx
- [x] T007 Create authentication hook (optional wrapper) in src/app/commons/hooks/use-auth.ts

**Checkpoint**: Foundation ready - 사용자 스토리 구현을 이제 병렬로 시작할 수 있습니다

---

## Phase 3: User Story 1 - 관리자 로그인 (Priority: P1) 🎯 MVP

**Goal**: 관리자가 이메일과 비밀번호로 로그인할 수 있고, 로그인 성공 시 인증 토큰과 관리자 정보를 받아와 저장하며, 관리자 대시보드로 이동합니다.

**Independent Test**: 관리자가 로그인 페이지에서 유효한 이메일과 비밀번호를 입력하고 로그인 버튼을 클릭하여 대시보드로 이동하는 것을 테스트할 수 있습니다. 이 기능만으로도 관리자가 시스템에 접근할 수 있는 최소한의 가치를 제공합니다.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T008 [P] [US1] Create E2E test for successful login flow in src/app/tests/api-tests/admin-test/login.spec.ts
- [x] T009 [P] [US1] Create E2E test for login with invalid credentials in src/app/tests/api-tests/admin-test/login.spec.ts
- [x] T010 [P] [US1] Create E2E test for login form validation in src/app/tests/api-tests/admin-test/login.spec.ts

### Implementation for User Story 1

- [x] T011 [US1] Update LoginResponse interface to include role field in src/app/commons/apis/admin/index.ts
- [x] T012 [US1] Integrate React Hook Form into LoginPage component in src/app/components/LoginPage/index.tsx
- [x] T013 [US1] Implement login form submission handler in src/app/components/LoginPage/index.tsx
- [x] T014 [US1] Add error handling and user feedback (toast notifications) in src/app/components/LoginPage/index.tsx
- [x] T015 [US1] Add loading state during login request in src/app/components/LoginPage/index.tsx
- [x] T016 [US1] Implement redirect to dashboard on successful login in src/app/components/LoginPage/index.tsx
- [x] T017 [US1] Add form validation (email format, required fields) in src/app/components/LoginPage/index.tsx
- [x] T018 [US1] Update root page to check authentication state and redirect in src/app/page.tsx
- [x] T019 [US1] Wrap application with AuthProvider in src/app/layout.tsx or src/app/page.tsx

**Checkpoint**: 이 시점에서 User Story 1은 완전히 기능하며 독립적으로 테스트 가능해야 합니다

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: 여러 사용자 스토리에 영향을 미치는 개선 사항

- [x] T020 [P] Add error boundary for authentication errors in src/app/commons/components/error-boundary.tsx
- [x] T021 [P] Implement automatic token refresh on 401 responses in src/app/commons/provider/api-provider/api-client.ts
- [x] T022 [P] Add logout functionality integration in Header component in src/app/components/Header/index.tsx
- [x] T023 [P] Add session persistence check on page load in src/app/commons/context/auth-context.tsx
- [x] T024 [P] Improve error messages for network errors in src/app/components/LoginPage/index.tsx
- [x] T025 [P] Add prevent duplicate login requests logic in src/app/components/LoginPage/index.tsx
- [x] T026 [P] Update documentation in README.md with authentication flow
- [x] T027 [P] Add default API_BASE_URL fallback in src/app/commons/provider/api-provider/api-client.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 - 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작 - 모든 사용자 스토리를 차단
- **User Stories (Phase 3)**: Foundational 단계 완료 후 시작
  - 사용자 스토리는 병렬로 진행 가능 (인력이 있는 경우)
  - 또는 우선순위 순서대로 순차 진행 (P1 → P2 → P3)
- **Polish (Final Phase)**: 원하는 모든 사용자 스토리 완료 후 시작

### User Story Dependencies

- **User Story 1 (P1)**: Foundational (Phase 2) 완료 후 시작 가능 - 다른 스토리에 대한 의존성 없음

### Within Each User Story

- 테스트는 구현 전에 작성하고 실패 확인
- 타입 정의 → 서비스 → 컴포넌트 순서
- 핵심 구현 → 통합 순서
- 스토리 완료 후 다음 우선순위로 이동

### Parallel Opportunities

- Setup 단계의 모든 [P] 작업은 병렬 실행 가능
- Foundational 단계의 [P] 작업은 병렬 실행 가능 (Phase 2 내에서)
- Foundational 완료 후 모든 사용자 스토리를 병렬로 시작 가능 (팀 인력이 허용하는 경우)
- 사용자 스토리의 모든 테스트 [P]는 병렬 실행 가능
- 사용자 스토리 내의 모델 [P]는 병렬 실행 가능
- 다른 사용자 스토리는 다른 팀원이 병렬로 작업 가능

---

## Parallel Example: User Story 1

```bash
# User Story 1의 모든 테스트를 함께 시작:
Task: "Create E2E test for successful login flow in src/app/tests/api-tests/admin-test/login.spec.ts"
Task: "Create E2E test for login with invalid credentials in src/app/tests/api-tests/admin-test/login.spec.ts"
Task: "Create E2E test for login form validation in src/app/tests/api-tests/admin-test/login.spec.ts"

# Phase 1의 모든 타입 정의를 함께 시작:
Task: "Create TypeScript type definitions for authentication in src/app/commons/types/auth.ts"
Task: "Create token storage utility in src/app/commons/utils/token-storage.ts"
Task: "Verify AdminRole enum exists in src/app/commons/enums.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료 (CRITICAL - 모든 스토리 차단)
3. Phase 3: User Story 1 완료
4. **STOP and VALIDATE**: User Story 1을 독립적으로 테스트
5. 배포/데모 준비되면 진행

### Incremental Delivery

1. Setup + Foundational 완료 → Foundation 준비 완료
2. User Story 1 추가 → 독립적으로 테스트 → 배포/데모 (MVP!)
3. 각 스토리는 이전 스토리를 깨뜨리지 않고 가치를 추가

### Parallel Team Strategy

여러 개발자가 있는 경우:

1. 팀이 함께 Setup + Foundational 완료
2. Foundational 완료 후:
   - Developer A: User Story 1
   - (추가 스토리가 있다면) Developer B: User Story 2
3. 스토리들이 독립적으로 완료되고 통합됨

---

## Task Summary

**Total Tasks**: 27
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 4 tasks
- **Phase 3 (User Story 1)**: 12 tasks (3 tests + 9 implementation)
- **Phase 4 (Polish)**: 8 tasks

**Parallel Opportunities**:
- Phase 1: 3 tasks 모두 병렬 가능
- Phase 2: 2 tasks 병렬 가능 (T005, T007)
- Phase 3: 3 tests 병렬 가능
- Phase 4: 대부분의 작업 병렬 가능

**Independent Test Criteria for User Story 1**:
- 관리자가 로그인 페이지에서 유효한 자격 증명을 입력하고 로그인 버튼을 클릭하여 대시보드로 이동할 수 있어야 합니다
- 로그인 실패 시 적절한 에러 메시지가 표시되어야 합니다
- 폼 검증이 올바르게 작동해야 합니다

**Suggested MVP Scope**: User Story 1만 구현 (관리자 로그인 기능)

---

## Notes

- [P] 작업 = 다른 파일, 의존성 없음
- [Story] 레이블은 추적 가능성을 위해 특정 사용자 스토리에 작업을 매핑
- 각 사용자 스토리는 독립적으로 완료 가능하고 테스트 가능해야 함
- 구현 전에 테스트가 실패하는지 확인
- 각 작업 또는 논리적 그룹 후 커밋
- 모든 체크포인트에서 스토리를 독립적으로 검증할 수 있도록 중지
- 피해야 할 것: 모호한 작업, 동일 파일 충돌, 독립성을 깨는 스토리 간 의존성

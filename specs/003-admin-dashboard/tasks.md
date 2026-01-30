# Tasks: 관리자 대시보드 조회 및 차트 시각화

**Input**: Design documents from `/specs/003-admin-dashboard/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: E2E 테스트 포함 (스펙 요구사항: "E2E 테스트가 통과된 후에만 UI 데이터 바인딩 작업 진행")

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 프로젝트 초기화 및 필요한 라이브러리 설치

- [x] T001 [P] React Query (TanStack Query) 패키지 설치: `npm install @tanstack/react-query`
- [x] T002 [P] Chart.js 및 react-chartjs-2 패키지 설치: `npm install chart.js react-chartjs-2`
- [x] T003 React Query QueryClientProvider를 앱 루트에 설정 (`src/app/layout.tsx` 수정)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 사용자 스토리가 의존하는 핵심 인프라

**⚠️ CRITICAL**: 이 단계가 완료되어야 모든 사용자 스토리 구현을 시작할 수 있습니다

- [x] T004 [P] 대시보드 관련 타입 정의 생성 (`src/app/commons/types/dashboard.ts`)
- [x] T005 [P] 대시보드 API 함수 구현 (`src/app/commons/apis/admin/index.ts`에 추가)
  - `getDashboardSummary()` 함수 추가
  - `getDashboardCharts()` 함수 추가
  - `getUserTrends()` 함수 추가
- [x] T006 [P] React Query 훅 생성 (`src/app/commons/hooks/use-dashboard.ts`)
  - `useDashboardSummary()` 훅 구현
  - `useDashboardCharts()` 훅 구현
  - `useUserTrends()` 훅 구현

**Checkpoint**: Foundation ready - 사용자 스토리 구현을 시작할 수 있습니다

---

## Phase 3: User Story 1 - 대시보드 요약 지표 조회 (Priority: P1) 🎯 MVP

**Goal**: 관리자가 대시보드에 접속하면 서비스의 핵심 요약 지표(총 사용자, 활성 사용자, 총 주문 수, 총 매출)를 한눈에 확인할 수 있습니다.

**Independent Test**: 관리자가 대시보드 페이지에 접속하면, 총 사용자 수, 활성 사용자 수, 총 주문 수, 총 매출 등의 핵심 지표가 즉시 표시됩니다. 이 정보만으로도 서비스 전체 현황을 파악할 수 있습니다.

### E2E Tests for User Story 1 ⚠️

> **NOTE: E2E 테스트를 먼저 작성하고, 통과한 후에만 UI 데이터 바인딩 작업 진행**

- [x] T007 [P] [US1] 대시보드 요약 지표 조회 E2E 테스트 작성 (`src/app/tests/api-tests/admin-test/dashboard-api.spec.ts`)
  - 로그인 후 대시보드 접속 테스트
  - 요약 지표 카드들이 올바르게 표시되는지 확인
  - 로딩 상태 표시 확인
  - 빈 데이터 상태 처리 확인

### Implementation for User Story 1

- [x] T008 [US1] DashboardOverview 컴포넌트에 요약 지표 표시 로직 추가 (`src/app/components/DashboardOverview/index.tsx`)
  - `useDashboardSummary()` 훅 사용
  - 로딩 상태 UI 추가
  - 에러 상태 UI 추가
  - 빈 상태 UI 추가
  - 요약 지표 카드 컴포넌트에 실제 데이터 바인딩

**Checkpoint**: User Story 1이 완전히 작동하며 독립적으로 테스트 가능합니다

---

## Phase 4: User Story 2 - 기간별 차트 데이터 조회 및 시각화 (Priority: P2)

**Goal**: 관리자가 일/주/월 단위로 서비스 데이터를 조회하고 차트로 시각화하여 시간에 따른 변화 추이를 분석할 수 있습니다.

**Independent Test**: 관리자가 기간 선택 옵션(일/주/월)을 선택하면, 해당 기간의 데이터가 차트로 표시됩니다. 이를 통해 시간에 따른 변화 추이를 시각적으로 확인할 수 있습니다.

### E2E Tests for User Story 2 ⚠️

- [x] T009 [P] [US2] 기간별 차트 데이터 조회 E2E 테스트 추가 (`src/app/tests/api-tests/admin-test/dashboard-api.spec.ts`)
  - 기간 선택 (일/주/월) 테스트
  - 차트가 올바르게 표시되는지 확인
  - 날짜 범위 선택 기능 테스트
  - 차트 툴팁 표시 확인
  - 반응형 디자인 확인

### Implementation for User Story 2

- [x] T010 [P] [US2] 기간 선택 UI 컴포넌트 구현 (`src/app/components/DashboardOverview/index.tsx`)
  - 일/주/월 선택 옵션 추가
  - 시작일/종료일 선택 UI 추가 (선택사항)
- [x] T011 [US2] Chart.js를 사용한 차트 컴포넌트 구현 (`src/app/components/DashboardOverview/index.tsx`)
  - `useDashboardCharts()` 훅 사용
  - Line 또는 Bar 차트로 데이터 시각화
  - 툴팁 설정
  - 범례 설정
  - 반응형 디자인 적용
- [x] T012 [US2] DashboardOverview 컴포넌트에 차트 통합 (`src/app/components/DashboardOverview/index.tsx`)
  - 로딩 상태 처리
  - 에러 상태 처리
  - 빈 데이터 상태 처리

**Checkpoint**: User Stories 1 AND 2가 모두 독립적으로 작동합니다

---

## Phase 5: User Story 3 - 사용자 가입/탈퇴 추이 조회 및 시각화 (Priority: P2)

**Goal**: 관리자가 최근 기간 동안의 사용자 가입 및 탈퇴 추이를 라인 차트로 조회하여 서비스의 사용자 동향을 분석할 수 있습니다.

**Independent Test**: 관리자가 사용자 추이 차트를 조회하면, 가입과 탈퇴 데이터가 두 개의 라인으로 표시되어 시간에 따른 변화를 비교할 수 있습니다.

### E2E Tests for User Story 3 ⚠️

- [x] T013 [P] [US3] 사용자 추이 데이터 조회 E2E 테스트 추가 (`src/app/tests/api-tests/admin-test/dashboard-api.spec.ts`)
  - 사용자 추이 차트 표시 확인
  - 가입/탈퇴 라인이 올바르게 표시되는지 확인
  - 차트 툴팁에 가입/탈퇴 수 표시 확인
  - 범례 구분 확인

### Implementation for User Story 3

- [x] T014 [US3] 사용자 추이 라인 차트 컴포넌트 구현 (`src/app/components/DashboardOverview/index.tsx`)
  - `useUserTrends()` 훅 사용
  - Chart.js Line 차트로 가입/탈퇴 2개 라인 표시
  - 가입 라인과 탈퇴 라인 구분 (다른 색상)
  - 툴팁 설정 (날짜별 가입 수, 탈퇴 수 표시)
  - 범례 설정
  - 반응형 디자인 적용
- [x] T015 [US3] DashboardOverview 컴포넌트에 사용자 추이 차트 통합 (`src/app/components/DashboardOverview/index.tsx`)
  - 로딩 상태 처리
  - 에러 상태 처리
  - 빈 데이터 상태 처리

**Checkpoint**: 모든 사용자 스토리가 이제 독립적으로 작동합니다

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 여러 사용자 스토리에 영향을 미치는 개선 사항

- [x] T016 [P] 대시보드 컴포넌트 스타일 개선 (`src/app/components/DashboardOverview/styles.module.css`)
- [x] T017 [P] 에러 처리 및 사용자 피드백 개선 (구현 완료)
- [x] T018 [P] 접근성 개선 (키보드 네비게이션, ARIA 레이블 등) - 기본 접근성 구현 완료
- [x] T019 [P] 성능 최적화 (차트 렌더링 최적화, 메모이제이션 등) - React Query 캐싱 활용
- [x] T020 [P] 코드 리뷰 및 리팩토링 (린트 통과 확인 완료)
- [x] T021 quickstart.md 검증 및 문서 업데이트 (문서 작성 완료)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 - 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작 - 모든 사용자 스토리를 블로킹
- **User Stories (Phase 3+)**: Foundational 단계 완료 후 시작
  - 사용자 스토리는 병렬로 진행 가능 (팀 구성에 따라)
  - 또는 우선순위 순서대로 순차 진행 (P1 → P2)
- **Polish (Final Phase)**: 원하는 모든 사용자 스토리 완료 후 시작

### User Story Dependencies

- **User Story 1 (P1)**: Foundational (Phase 2) 완료 후 시작 가능 - 다른 스토리와 독립적
- **User Story 2 (P2)**: Foundational (Phase 2) 완료 후 시작 가능 - US1과 독립적이지만 같은 컴포넌트 수정
- **User Story 3 (P2)**: Foundational (Phase 2) 완료 후 시작 가능 - US1, US2와 독립적이지만 같은 컴포넌트 수정

### Within Each User Story

- E2E 테스트를 먼저 작성하고 실패 확인
- Foundational 단계의 API 함수와 훅 사용
- 컴포넌트에 데이터 바인딩
- 스토리 완료 후 다음 우선순위로 진행

### Parallel Opportunities

- Setup 단계의 모든 [P] 태스크는 병렬 실행 가능
- Foundational 단계의 모든 [P] 태스크는 병렬 실행 가능 (Phase 2 내에서)
- Foundational 단계 완료 후, 모든 사용자 스토리를 병렬로 시작 가능 (팀 용량이 허용하는 경우)
- 각 사용자 스토리의 [P] 태스크는 병렬 실행 가능
- 다른 사용자 스토리는 다른 팀원이 병렬로 작업 가능

---

## Parallel Example: User Story 1

```bash
# User Story 1의 E2E 테스트 작성 (먼저 실행)
Task: "대시보드 요약 지표 조회 E2E 테스트 작성"

# 테스트 통과 후 UI 구현
Task: "DashboardOverview 컴포넌트에 요약 지표 표시 로직 추가"
```

## Parallel Example: User Story 2

```bash
# User Story 2의 구현 태스크들 (Foundational 완료 후)
Task: "기간 선택 UI 컴포넌트 구현"
Task: "Chart.js를 사용한 차트 컴포넌트 구현"
Task: "DashboardOverview 컴포넌트에 차트 통합"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료 (CRITICAL - 모든 스토리 블로킹)
3. Phase 3: User Story 1 완료
4. **STOP and VALIDATE**: User Story 1을 독립적으로 테스트
5. 배포/데모 준비 완료

### Incremental Delivery

1. Setup + Foundational 완료 → Foundation 준비 완료
2. User Story 1 추가 → 독립적으로 테스트 → 배포/데모 (MVP!)
3. User Story 2 추가 → 독립적으로 테스트 → 배포/데모
4. User Story 3 추가 → 독립적으로 테스트 → 배포/데모
5. 각 스토리는 이전 스토리를 깨뜨리지 않고 가치를 추가

### Parallel Team Strategy

여러 개발자가 있는 경우:

1. 팀이 Setup + Foundational을 함께 완료
2. Foundational 완료 후:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. 스토리들이 독립적으로 완료되고 통합

---

## Notes

- [P] 태스크 = 다른 파일, 의존성 없음
- [Story] 레이블은 특정 사용자 스토리에 대한 태스크 추적을 위해 매핑
- 각 사용자 스토리는 독립적으로 완료 가능하고 테스트 가능해야 함
- 구현 전에 테스트가 실패하는지 확인
- 각 태스크 또는 논리적 그룹 후 커밋
- 모든 체크포인트에서 스토리를 독립적으로 검증
- 피해야 할 것: 모호한 태스크, 동일 파일 충돌, 독립성을 깨뜨리는 스토리 간 의존성

---

## Task Summary

- **Total Tasks**: 21
- **Setup Tasks**: 3
- **Foundational Tasks**: 3
- **User Story 1 Tasks**: 2 (1 test + 1 implementation)
- **User Story 2 Tasks**: 4 (1 test + 3 implementation)
- **User Story 3 Tasks**: 3 (1 test + 2 implementation)
- **Polish Tasks**: 6

### Parallel Opportunities Identified

- Phase 1: T001, T002 병렬 가능
- Phase 2: T004, T005, T006 모두 병렬 가능
- Phase 3: E2E 테스트 후 구현
- Phase 4: T010, T011, T012 중 일부 병렬 가능
- Phase 5: 독립적 구현
- Phase 6: 모든 태스크 병렬 가능

### Independent Test Criteria

- **User Story 1**: 대시보드 접속 시 요약 지표가 표시되는지 확인
- **User Story 2**: 기간 선택 시 차트가 올바르게 표시되는지 확인
- **User Story 3**: 사용자 추이 차트에 가입/탈퇴 라인이 표시되는지 확인

### Suggested MVP Scope

**MVP = User Story 1만 구현**
- Phase 1: Setup
- Phase 2: Foundational
- Phase 3: User Story 1 (요약 지표 조회)
- E2E 테스트 통과 확인
- 배포/데모 준비

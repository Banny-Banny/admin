# Tasks: 유저 알림 메시지 발송 기능

**Input**: Design documents from `/specs/003-notification-send/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Playwright E2E 테스트 사용(시나리오 명시).  
**Organization**: 사용자 스토리별로 작업을 묶어 독립적으로 구현·테스트 가능하도록 구성.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: 병렬 실행 가능 (파일/의존성 분리)
- **[Story]**: US1, US2, US3 등 사용자 스토리 레이블
- 설명에 반드시 파일 경로 포함

## Path Conventions
- Next.js App Router 단일 프로젝트: `src/app/` 기준
- 공통 API: `src/app/commons/apis/`
- 컴포넌트: `src/app/components/`
- 테스트: `src/app/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 알림 기능을 위한 기본 폴더와 테스트 스켈레톤 생성

- [x] T001 [P] `src/app/commons/apis/notification/` 디렉터리 및 `index.ts`, `types.ts` 스켈레톤 생성
- [x] T002 [P] E2E 테스트 파일 스켈레톤 생성 `src/app/tests/api-tests/notification-test/notification.spec.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 스토리에 공통으로 필요한 API 타입·클라이언트 기반 마련

- [x] T003 [P] 알림 요청/응답 타입 정의 `src/app/commons/apis/notification/types.ts` (SendNotificationRequest/Response, enums)
- [x] T004 알림 발송 API 함수 구현 `src/app/commons/apis/notification/index.ts` (apiClient.post `/api/admin/notifications`)

**Checkpoint**: 타입/클라이언트 준비 완료 → 스토리별 UI 작업 시작 가능

---

## Phase 3: User Story 1 - 즉시 알림 메시지 발송 (Priority: P1) 🎯 MVP

**Goal**: 관리자 폼 입력 후 즉시 메시지 발송 및 내역 반영  
**Independent Test**: 제목/내용/유형/대상 입력 후 즉시 발송 → 성공 메시지 및 내역 기록 확인 (Playwright)

### Tests for User Story 1
- [ ] T005 [P] [US1] 즉시 발송 성공 시나리오 E2E 테스트 작성 `src/app/tests/api-tests/notification-test/notification.spec.ts` (성공 응답 모킹/검증 포함)

### Implementation for User Story 1
- [x] T006 [US1] 폼 제출 시 `sendNotification` 호출 및 상태 반영 `src/app/components/MarketingPage/index.tsx` (sendNow=true 경로)
- [x] T007 [US1] 발송 성공/실패 UX 처리 및 내역 추가 로직 정비 `src/app/components/MarketingPage/index.tsx`

**Checkpoint**: 즉시 발송 플로우 동작 및 E2E 통과

---

## Phase 4: User Story 2 - 메시지 유형 및 발송 대상 선택 (Priority: P1)

**Goal**: 유형/대상 드롭다운이 정의된 옵션과 바인딩되고 선택 값이 발송 데이터에 반영  
**Independent Test**: 각 드롭다운에서 옵션 노출·선택 후 제출 시 선택 값이 요청에 포함됨

### Implementation for User Story 2
- [x] T008 [US2] 메시지 유형/발송 대상 옵션 바인딩 및 상태 연결 `src/app/components/MarketingPage/index.tsx` (enum값 일치 확인)
- [x] T009 [P] [US2] 대상별 수신자 수 계산 로직 정비 `src/app/components/MarketingPage/index.tsx` (전체/활성/휴면/VIP 매핑)

**Checkpoint**: 유형/대상 선택 및 수신자 계산이 요청/내역에 반영

---

## Phase 5: User Story 3 - 메시지 내용 입력 및 유효성 검사 (Priority: P1)

**Goal**: 제목/내용 공백 불가, 둘 다 입력 시에만 발송 버튼 활성화; 필수 필드 미입력 시 제출 차단  
**Independent Test**: 제목 또는 내용 비움 → 버튼 비활성; 둘 다 입력 → 활성화 및 제출 가능

### Tests for User Story 3
- [ ] T010 [P] [US3] 제목/내용 미입력 시 버튼 비활성 E2E 테스트 추가 `src/app/tests/api-tests/notification-test/notification.spec.ts`

### Implementation for User Story 3
- [x] T011 [P] [US3] 제목/내용 trim 기반 `isFormValid` 계산 및 버튼 `disabled` 반영 `src/app/components/MarketingPage/index.tsx`
- [x] T012 [US3] 유형/대상/제목/내용 필수 검증 및 제출 가드 추가 `src/app/components/MarketingPage/index.tsx` (오류 메시지/알림 표시)

**Checkpoint**: 유효성 검사 동작 및 E2E 통과

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: 문서/테스트 보강 및 품질 개선

- [ ] T013 [P] `specs/001-notification-send/quickstart.md` 최신 상태 반영(실행/테스트 절차, 주의사항)
- [ ] T014 코드 정리 및 주석/로그 메시지 정돈 `src/app/components/MarketingPage/index.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)** → **Foundational (Phase 2)** → **User Stories (Phase 3–5)** → **Polish**

### User Story Dependencies
- US1, US2, US3 모두 Foundational 완료 후 시작 가능. 내용/유효성(US3)은 발송 로직(US1), 옵션 바인딩(US2)과 병렬 가능하나 최종 제출 가드는 US1 제출 경로에 포함되어야 함.

### Within Each User Story
- (테스트 작성) → 구현 → E2E 실행 → 체크포인트 통과

### Parallel Opportunities
- Setup T001–T002 병렬 가능
- Foundational T003 병렬, T004 이후 스토리 착수
- US1 테스트(T005)와 구현(T006–T007)은 의존 관계에 따라 병렬 일부 가능(모킹 준비 후)
- US2 T009 병렬 가능
- US3 T011, T010 병렬 가능; T012는 T011 이후 제출 가드 적용 필요

---

## Implementation Strategy

### MVP First (User Story 1 중심)
1) Phase 1~2 완료 후 US1(T005~T007) 우선 구현/검증  
2) US2 옵션 바인딩/수신자 계산 적용 → 요청 데이터 정합성 확보  
3) US3 유효성/버튼 상태 확정 → 회귀 E2E 전체 실행  
4) Polish 단계에서 문서/코드 정돈


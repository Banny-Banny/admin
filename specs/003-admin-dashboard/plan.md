# Implementation Plan: 관리자 대시보드 조회 및 차트 시각화

**Branch**: `003-admin-dashboard` | **Date**: 2026-01-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-admin-dashboard/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

관리자 대시보드에서 서비스 현황을 조회하고 차트로 시각화하는 기능을 구현합니다. 기존 UI 컴포넌트에 실제 API 데이터를 연동하여 요약 지표, 기간별 차트, 사용자 가입/탈퇴 추이를 표시합니다. API 통신은 Axios를 통해 진행하며, 서버 상태 관리를 위해 React Query를 도입하고, 차트 시각화는 Chart.js + react-chartjs-2를 사용합니다.

## Technical Context

**Language/Version**: TypeScript 5  
**Primary Dependencies**: Next.js 16 (App Router), React 19, Axios  
**Storage**: N/A (프론트엔드 기능, 백엔드 API에 의존)  
**Testing**: Playwright (E2E)  
**Target Platform**: Web (브라우저)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: 대시보드 로딩 3초 이내, 차트 조회 5초 이내 (SC-001, SC-002)  
**Constraints**: 반응형 디자인 지원 (데스크톱, 태블릿, 모바일), 동시 10명 이상 관리자 접속 지원 (SC-006)  
**Scale/Scope**: 관리자 대시보드 페이지 1개, API 엔드포인트 3개, 차트 컴포넌트 2개

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Component-First Architecture
- ✅ DashboardOverview 컴포넌트는 이미 `src/app/components/DashboardOverview/`에 위치
- ✅ 차트 컴포넌트는 기존 `src/app/commons/components/chart/` 구조 활용 가능
- ✅ 각 컴포넌트는 `index.tsx`와 `styles.module.css`로 구성 (기존 패턴 준수)

### II. API Integration Standards
- ✅ API 호출은 `src/app/commons/apis/admin/` 디렉토리에 모듈화 (기존 패턴 준수)
- ✅ 인증 토큰은 `ApiProvider`를 통해 자동 관리 (기존 구조 활용)
- ✅ API 에러는 일관된 형식으로 처리 (api-client.ts의 기존 에러 핸들링 활용)
- ✅ 환경변수 `NEXT_PUBLIC_API_BASE_URL` 사용 (기존 설정 활용)

### III. Type Safety
- ✅ 모든 API 응답 타입을 인터페이스로 정의 필요
- ✅ 컴포넌트 props 명시적 타입 정의 필요
- ✅ `any` 타입 사용 금지

### IV. E2E Testing
- ✅ Playwright를 사용한 E2E 테스트 구조 활용
- ✅ 대시보드 조회 플로우 테스트 작성 필요

### V. Accessibility & Admin UX
- ✅ 로딩 상태 및 빈 상태 UI 피드백 제공 필요
- ✅ 차트 툴팁 및 범례 제공 필요 (접근성 고려)

**Gate Status**: ✅ PASS (기존 프로젝트 구조와 완전히 일관성 있음, 추가 복잡도 없음)

## Project Structure

### Documentation (this feature)

```text
specs/003-admin-dashboard/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── admin-dashboard-api.yaml  # OpenAPI 스펙
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/app/
├── commons/
│   ├── apis/
│   │   └── admin/
│   │       └── index.ts              # 대시보드 API 함수 추가 (getDashboardSummary, getDashboardCharts, getUserTrends)
│   ├── types/
│   │   └── dashboard.ts              # 새로 생성: 대시보드 관련 타입 정의
│   └── hooks/
│       └── use-dashboard.ts          # 새로 생성: React Query 훅 (useDashboardSummary, useDashboardCharts, useUserTrends)
├── components/
│   └── DashboardOverview/
│       ├── index.tsx                 # 수정: 실제 API 데이터 연동 및 차트 통합
│       └── styles.module.css         # 기존 스타일 (수정 가능)
└── tests/
    └── api-tests/
        └── admin-test/
            └── dashboard-api.spec.ts # 새로 생성: 대시보드 API E2E 테스트
```

**Structure Decision**: 기존 Next.js App Router 구조를 그대로 활용하며, API 함수는 `src/app/commons/apis/admin/`에 추가하고, 타입은 `src/app/commons/types/`에 정의합니다. React Query 훅은 `src/app/commons/hooks/`에 추가합니다. 기존 DashboardOverview 컴포넌트를 수정하여 실제 데이터를 바인딩합니다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. 모든 구현은 기존 프로젝트 구조와 완전히 일치합니다.

## Phase Completion Status

### Phase 0: Outline & Research ✅

**Status**: Complete  
**Output**: `research.md`

**Key Decisions**:
- React Query (TanStack Query) 도입 확정
- Chart.js + react-chartjs-2 사용 확정 (스펙 요구사항 준수)
- 캐싱 전략: 5분 staleTime, 창 포커스 시 재요청
- 모든 NEEDS CLARIFICATION 해결 완료

### Phase 1: Design & Contracts ✅

**Status**: Complete  
**Outputs**: 
- `data-model.md` - 엔티티 모델 및 데이터 흐름 정의
- `contracts/admin-dashboard-api.yaml` - OpenAPI 스펙 정의
- `quickstart.md` - 개발자 가이드 작성
- Agent context 업데이트 완료

**Design Decisions**:
- API 함수: `src/app/commons/apis/admin/index.ts`에 추가
- 타입 정의: `src/app/commons/types/dashboard.ts`에 집중 관리
- React Query 훅: `src/app/commons/hooks/use-dashboard.ts`에 생성
- 컴포넌트: 기존 `DashboardOverview` 컴포넌트 수정

### Post-Phase 1 Constitution Check ✅

**Re-evaluation**: 모든 원칙 준수 확인 완료
- ✅ Component-First Architecture 준수
- ✅ API Integration Standards 준수
- ✅ Type Safety 보장
- ✅ E2E Testing 구조 준비 완료
- ✅ Accessibility & Admin UX 고려

**Gate Status**: ✅ PASS - Phase 2 (Tasks) 진행 가능

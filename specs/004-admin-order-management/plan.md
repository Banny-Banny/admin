# Implementation Plan: 관리자 대시보드 주문 관리 (2차)

**Branch**: `004-admin-order-management` | **Date**: 2026-01-21 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/004-admin-order-management/spec.md`

**Note**: Filled via `/speckit.plan`.

## Summary

- 관리자가 주문을 목록/필터, 상세, 상태 변경으로 운영할 수 있도록 API 연동(목록/상세/상태 변경)과 React Query 훅을 제공하고, E2E(API only) 통과 후 UI를 제작/바인딩한다.  
- 연구 결정: status/paymentStatus 기본값 ALL, limit 20 offset 0, created_at 역순 가정; 상태 변경은 명시 enum 5종만 허용; payment null은 “결제 대기 중” 표준 표현; 로딩/오류/빈 상태 필수 안내.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16 (App Router), React 19  
**Primary Dependencies**: Axios, React Query, Radix UI, Tailwind CSS 4 + CSS Modules  
**Storage**: N/A (프런트엔드 클라이언트)  
**Testing**: Playwright (E2E API 검증), 기존 lint/unit 설정 준수  
**Target Platform**: Web (관리자 콘솔)  
**Project Type**: Web app (Next.js frontend)  
**Performance Goals**: 목록/필터 응답 확인 5초 이내, 상태 변경 후 최신 목록 확인까지 5초 이내 (SC-001/002)  
**Constraints**: Radix 기반 컴포넌트, ApiProvider 통한 인증/베이스 URL, `any` 금지(Type Safety), E2E 통과 후 UI 바인딩 순서 준수  
**Scale/Scope**: 단일 관리자 도구, 주문 관리 페이지 + 모달, API 3개 범위

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Component-First Architecture: 페이지 컴포넌트는 `src/app/components/Orders/`, 재사용 요소는 `src/app/commons/components/`(Radix 기반)로 구성. **PASS**
- API Integration Standards: API 모듈을 `src/app/commons/apis/admin/`에 두고 `ApiProvider` 인증/베이스 URL 사용. **PASS**
- Type Safety: 모든 타입을 `src/app/commons/types/`에 정의, `any` 금지. **PASS**
- E2E Testing: Playwright로 API 통신 테스트(`npm run test:e2e`) 포함. **PASS**
- Accessibility & Admin UX: 로딩/빈 상태/오류 안내, 키보드 접근 가능한 필터/모달 제공. **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/004-admin-order-management/
├── plan.md              # /speckit.plan
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1
└── tasks.md             # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/commons/apis/
│   ├── admin/
│   │   ├── index.ts
│   │   └── orders.ts          # 신규: 목록/상세/상태 변경 API
│   ├── dashboard/
│   │   └── index.ts
│   └── ...
├── app/commons/types/
│   ├── dashboard.ts
│   └── orders.ts              # 신규: 주문/상품/결제/유저/필터/응답 타입
├── app/commons/hooks/
│   └── use-admin-orders.ts    # 신규: 목록/상세 useQuery, 상태 변경 useMutation
├── app/components/
│   ├── DashboardOverview/
│   └── Orders/                # 신규: 필터, 테이블, 상세 모달, 상태변경 모달
└── app/tests/api-tests/
    ├── dashboard/
    └── orders/                # 신규: orders-api.spec.ts (API only)
```

**Structure Decision**: 단일 Next.js 프런트엔드 구조 유지. API/타입/훅을 commons 하위에, 페이지 UI는 `src/app/components/Orders/`로 분리. 테스트는 `src/app/tests/api-tests/orders/`에 Playwright 스펙으로 추가.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

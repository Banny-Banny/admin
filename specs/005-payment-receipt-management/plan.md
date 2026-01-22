# Implementation Plan: 관리자 대시보드 - 결제 및 영수증 관리 기능

**Branch**: `005-payment-receipt-management` | **Date**: 2026-01-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-payment-receipt-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

관리자가 결제를 취소하고, 결제 로그를 조회하며, 영수증을 재발급할 수 있는 기능을 구현합니다. 기존 관리자 대시보드 구조를 활용하여 API 통합, React Query 훅, E2E 테스트를 작성하고, 프로젝트 톤앤매너에 맞는 UI 컴포넌트를 개발합니다.

## Technical Context

**Language/Version**: TypeScript 5  
**Primary Dependencies**: Next.js 16 (App Router), React 19, Axios 1.7.9, @tanstack/react-query 5.90.19  
**Storage**: N/A (백엔드 API 사용)  
**Testing**: Playwright 1.48.0 (E2E 테스트)  
**Target Platform**: Web (Next.js App Router)  
**Project Type**: Web application (frontend only)  
**Performance Goals**: 결제 로그 조회 시 10,000건 이상의 데이터에서도 페이지네이션을 통해 정상 조회 가능, API 응답 시간 < 2초  
**Constraints**: 기존 프로젝트 구조 및 스타일 가이드 준수, Constitution 원칙 준수  
**Scale/Scope**: 관리자 대시보드 내 3개 주요 기능 (결제 취소, 로그 조회, 영수증 재발급)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Component-First Architecture
- ✅ API 함수는 `src/app/commons/apis/admin/`에 모듈화
- ✅ React Query 훅은 `src/app/commons/hooks/`에 위치
- ✅ 페이지 컴포넌트는 `src/app/components/[PageName]/`에 위치
- ✅ 공통 컴포넌트는 Radix UI primitives 기반

### II. API Integration Standards
- ✅ API 호출은 `src/app/commons/apis/admin/`에 모듈화
- ✅ 인증 토큰은 기존 `ApiProvider`를 통해 자동 관리
- ✅ API 에러는 일관된 형식으로 처리
- ✅ 환경변수 `NEXT_PUBLIC_API_BASE_URL` 사용

### III. Type Safety
- ✅ 모든 API 요청/응답 타입은 TypeScript 인터페이스로 정의
- ✅ `any` 타입 사용 금지
- ✅ 공통 타입은 `src/app/commons/types/`에 정의

### IV. E2E Testing
- ✅ Playwright를 사용한 API 통신 테스트 작성
- ✅ 테스트는 `npm run test:e2e`로 실행 가능
- ✅ UI 요소는 테스트하지 않음 (API 통신만 테스트)

### V. Accessibility & Admin UX
- ✅ 로딩 상태 및 에러 상태 UI 피드백 제공
- ✅ 빈 데이터 상태 처리

**Gate Status**: ✅ PASS (기존 프로젝트 구조와 일관성 유지, 추가 복잡도 없음)

## Project Structure

### Documentation (this feature)

```text
specs/005-payment-receipt-management/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── admin-payments-api.yaml  # OpenAPI 스펙
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/app/
├── commons/
│   ├── apis/
│   │   └── admin/
│   │       ├── index.ts              # 기존 파일 (결제 관련 API 함수 추가)
│   │       └── payments.ts            # 새로 생성: 결제 취소, 로그 조회, 영수증 재발급 API 함수
│   ├── hooks/
│   │   └── use-payments.ts            # 새로 생성: React Query 훅 (useQuery, useMutation)
│   └── types/
│       └── payments.ts                # 새로 생성: 결제 관련 TypeScript 타입 정의
├── components/
│   └── PaymentsPage/                  # 새로 생성: 결제 관리 페이지 컴포넌트
│       ├── index.tsx
│       ├── styles.module.css
│       ├── PaymentLogsTable.tsx       # 결제 로그 테이블 컴포넌트
│       ├── CancelPaymentModal.tsx     # 결제 취소 모달 컴포넌트
│       └── ReceiptReissueModal.tsx    # 영수증 재발급 모달 컴포넌트
└── tests/
    └── api-tests/
        └── payments/
            └── payments-api.spec.ts   # 새로 생성: E2E API 테스트
```

**Structure Decision**: 기존 프로젝트 구조를 따르며, API 함수는 `src/app/commons/apis/admin/payments.ts`에, React Query 훅은 `src/app/commons/hooks/use-payments.ts`에, 타입은 `src/app/commons/types/payments.ts`에 위치시킵니다. 페이지 컴포넌트는 `src/app/components/PaymentsPage/`에 생성합니다.

## Phase 0: Research ✅ COMPLETE

**Status**: 모든 NEEDS CLARIFICATION 해결 완료

**Outputs**:
- ✅ `research.md` - 기술 결정 및 불명확한 요구사항 해결
  - 환불 계좌 정보 처리 방식 결정 (선택사항)
  - API 엔드포인트 구조 및 응답 형식 결정
  - React Query 훅 구조 결정
  - E2E 테스트 구조 결정
  - UI 컴포넌트 구조 결정

## Phase 1: Design & Contracts ✅ COMPLETE

**Status**: 모든 설계 문서 생성 완료

**Outputs**:
- ✅ `data-model.md` - 데이터 모델 및 엔티티 정의
- ✅ `contracts/admin-payments-api.yaml` - OpenAPI 스펙
- ✅ `quickstart.md` - 개발자 빠른 시작 가이드
- ✅ Agent context 업데이트 완료

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

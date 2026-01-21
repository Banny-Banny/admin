# Implementation Plan: 상품 관리 페이지

**Branch**: `003-product-management` | **Date**: 2026-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-product-management/spec.md`

## Summary

관리자가 상품을 등록, 조회, 수정, 삭제할 수 있는 상품 관리 페이지를 구현합니다. 5개의 REST API 엔드포인트를 사용하며, 모두 토큰 기반 인증이 필요합니다. 진행 순서는 API 연결 → E2E 테스트(API 통신 확인) → UI 데이터 바인딩 순서로 진행합니다. 기존 Next.js 프로젝트 구조를 활용하여 ProductsPage 컴포넌트에 통합합니다.

## Technical Context

**Language/Version**: TypeScript 5, JavaScript (ES2020+)  
**Primary Dependencies**: 
- Next.js 16.1.3
- React 19.2.3
- Axios 1.7.9
- Radix UI 컴포넌트 라이브러리
- Playwright 1.48.0 (E2E 테스트)

**Storage**: N/A (백엔드 API를 통해 데이터 관리)  
**Testing**: Playwright E2E 테스트 (`npm run test:e2e`)  
**Target Platform**: 웹 브라우저 (최신 버전, JavaScript 활성화 필요)  
**Project Type**: Web application (Next.js 기반 관리자 대시보드)  
**Performance Goals**: 
- 상품 목록 조회: 2초 이내
- 검색/필터링: 1초 이내
- 상품 등록: 1분 이내
- 상품 수정: 30초 이내
- 상품 삭제: 10초 이내

**Constraints**: 
- 토큰 기반 인증 필수
- API 응답 형식: `{ success: boolean, data: {...} }`
- Soft Delete 방식으로 상품 삭제 처리
- 네트워크 오류 및 토큰 만료 처리 필요
- 로딩 상태 표시 필요

**Scale/Scope**: 
- 관리자 다수 동시 접속 지원
- 페이지네이션을 통한 대량 상품 목록 관리
- 검색 및 필터링 기능

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Gate Status**: ✅ PASS (Pre-Phase 0) → ✅ PASS (Post-Phase 1)

- 기존 프로젝트 구조 활용 (추가 복잡도 없음)
- 기존 API 클라이언트 및 인증 시스템 재사용
- 기존 ProductsPage 컴포넌트 구조 활용
- E2E 테스트 구조 활용
- TypeScript 타입 안정성 유지

**Post-Phase 1 Re-check**: Phase 1 설계 완료 후에도 모든 게이트 통과 확인됨. 추가 복잡도 없음.

## Project Structure

### Documentation (this feature)

```text
specs/003-product-management/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── admin-products-api.yaml  # OpenAPI 스펙
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/app/
├── commons/
│   ├── apis/
│   │   └── product/
│   │       ├── http.ts                 # HTTP API 클라이언트 및 함수들
│   │       └── index.ts                # API 함수 export
│   ├── types/
│   │   └── product.ts                  # 상품 관련 TypeScript 타입 정의
├── components/
│   ├── ProductsPage/
│   │   ├── index.tsx                   # 상품 관리 페이지 컴포넌트 (기존, 수정 필요)
│   │   └── styles.module.css           # 스타일 파일
│   └── ProductList/
│       ├── index.tsx                   # 상품 목록 컴포넌트 (기존, 수정 필요)
│       └── styles.module.css           # 스타일 파일
└── page.tsx                             # 메인 페이지 (라우팅, 기존)

src/app/tests/
└── api-tests/
    └── product-test/
        └── product-api.spec.ts         # HTTP API E2E 테스트
```

**Structure Decision**: 기존 Next.js 프로젝트 구조를 활용하여 `src/app/commons/apis/product/` 폴더에 HTTP API 클라이언트(`http.ts`)를 구현하고, `index.ts`에서 export합니다. 기존 ProductsPage와 ProductList 컴포넌트를 수정하여 API 데이터를 바인딩합니다.

## Phase 0: Research ✅ COMPLETE

**Status**: 완료  
**Output**: `research.md`

### 주요 결정사항

1. **API 클라이언트 구조**: 기존 inquiry API 구조를 따라 `src/app/commons/apis/product/` 폴더에 구현
2. **API 응답 형식 처리**: 기존 `apiClient`의 응답 처리 방식 활용
3. **상품 타입 정의**: `src/app/commons/types/product.ts`에 타입 정의
4. **검색 및 필터링**: Query 파라미터로 전달, API에서 처리
5. **로딩 상태 및 에러 처리**: React 상태 + Toast 알림 사용
6. **기존 컴포넌트 수정**: 하드코딩된 데이터를 API 호출로 교체
7. **E2E 테스트 구조**: 기존 `inquiry-test` 구조를 따라 `product-test` 폴더 생성

## Phase 1: Design & Contracts ✅ COMPLETE

**Status**: 완료  
**Outputs**: 
- `data-model.md`
- `contracts/admin-products-api.yaml`
- `quickstart.md`
- Agent context 업데이트 완료

### 생성된 아티팩트

1. **Data Model**: 상품 엔티티, API 요청/응답 타입 정의 완료
2. **API Contracts**: OpenAPI 3.0.3 스펙으로 5개 엔드포인트 문서화 완료
3. **Quick Start Guide**: 개발자 가이드 작성 완료
4. **Agent Context**: Cursor IDE 컨텍스트 업데이트 완료

### API 엔드포인트

- `GET /api/admin/products`: 상품 목록 조회 (검색, 필터링, 페이지네이션)
- `POST /api/admin/products`: 상품 등록
- `GET /api/admin/products/{id}`: 상품 상세 조회
- `PATCH /api/admin/products/{id}`: 상품 정보 수정
- `DELETE /api/admin/products/{id}`: 상품 삭제 (Soft Delete)

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

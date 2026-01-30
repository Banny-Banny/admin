<!--
Sync Impact Report
==================
Version change: N/A → 1.0.0
Modified principles: N/A (initial creation)
Added sections: Core Principles (5), Technology Stack, Development Workflow, Governance
Removed sections: N/A
Templates requiring updates: ✅ No updates needed (templates are generic)
Follow-up TODOs: None
-->

# Admin Dashboard Constitution

## Core Principles

### I. Component-First Architecture

모든 UI 요소는 `src/app/commons/components/`에 재사용 가능한 컴포넌트로 구현되어야 한다.

- 컴포넌트는 Radix UI primitives를 기반으로 구축해야 한다 (MUST)
- 각 컴포넌트는 `index.tsx`와 `styles.module.css`로 구성해야 한다 (MUST)
- 페이지별 컴포넌트는 `src/app/components/[PageName]/`에 위치해야 한다 (MUST)
- 공통 컴포넌트 수정 시 영향받는 모든 페이지를 검증해야 한다 (MUST)

**Rationale**: 일관된 UI/UX와 유지보수성을 보장한다.

### II. API Integration Standards

외부 백엔드 API와의 통신은 표준화된 방식을 따라야 한다.

- API 호출은 `src/app/commons/apis/` 디렉토리에 모듈화해야 한다 (MUST)
- 인증 토큰은 `ApiProvider`를 통해 자동으로 관리해야 한다 (MUST)
- API 에러는 일관된 형식으로 처리하고 사용자에게 피드백을 제공해야 한다 (MUST)
- 환경별 API URL은 환경변수(`NEXT_PUBLIC_API_BASE_URL`)로 관리해야 한다 (MUST)

**Rationale**: 백엔드 의존성을 명확히 관리하고 인증 흐름을 안정적으로 유지한다.

### III. Type Safety

TypeScript를 통한 타입 안전성을 보장해야 한다.

- 모든 컴포넌트 props는 명시적 타입 정의가 필요하다 (MUST)
- API 응답 타입은 인터페이스로 정의해야 한다 (MUST)
- `any` 타입 사용은 금지한다. 불가피한 경우 `unknown`과 타입 가드를 사용해야 한다 (MUST)
- 공통 타입은 `src/app/commons/` 하위에 정의해야 한다 (SHOULD)

**Rationale**: 런타임 에러를 컴파일 타임에 방지하고 코드 품질을 보장한다.

### IV. E2E Testing

Playwright를 사용한 E2E 테스트로 주요 사용자 흐름을 검증해야 한다.

- 인증 흐름(로그인/로그아웃)은 반드시 테스트해야 한다 (MUST)
- 새로운 페이지 추가 시 기본 네비게이션 테스트를 포함해야 한다 (SHOULD)
- 테스트는 `npm run test:e2e`로 실행 가능해야 한다 (MUST)
- CI/CD 파이프라인에서 테스트 통과가 배포 조건이다 (SHOULD)

**Rationale**: 관리자 도구의 핵심 기능이 안정적으로 동작함을 보장한다.

### V. Accessibility & Admin UX

관리자 사용자 경험과 접근성을 고려해야 한다.

- 모든 인터랙티브 요소는 키보드로 접근 가능해야 한다 (MUST)
- 폼 입력에는 명확한 레이블과 에러 메시지를 제공해야 한다 (MUST)
- 데이터 테이블은 정렬, 필터링, 페이지네이션을 지원해야 한다 (SHOULD)
- 로딩 상태와 빈 상태에 대한 UI 피드백을 제공해야 한다 (MUST)

**Rationale**: 관리자의 업무 효율성과 실수 방지를 보장한다.

## Technology Stack

프로젝트는 다음 기술 스택을 사용한다:

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + CSS Modules
- **UI Components**: Radix UI primitives
- **HTTP Client**: Axios
- **Testing**: Playwright (E2E)
- **Package Manager**: npm/yarn/pnpm/bun

스택 변경은 Governance 절차를 따라야 한다.

## Development Workflow

### 브랜치 전략

- `main`: 프로덕션 배포 브랜치
- `feat/*`: 기능 개발 브랜치
- `fix/*`: 버그 수정 브랜치

### 코드 리뷰

- 모든 PR은 린트 검사(`npm run lint`)를 통과해야 한다 (MUST)
- E2E 테스트 통과 후 머지할 수 있다 (SHOULD)

### 스펙 기반 개발

- 새 기능은 `/speckit.specify`로 스펙 문서를 먼저 작성한다
- 스펙 승인 후 `/speckit.plan` → `/speckit.tasks` → `/speckit.implement` 순으로 진행한다

## Governance

- 이 Constitution은 프로젝트의 모든 개발 관행보다 우선한다
- 원칙 변경은 문서화, 승인, 마이그레이션 계획이 필요하다
- 버전 관리: MAJOR(원칙 삭제/재정의), MINOR(원칙 추가/확장), PATCH(문구 수정)
- 모든 PR/리뷰는 Constitution 준수 여부를 확인해야 한다

**Version**: 1.0.0 | **Ratified**: 2026-01-20 | **Last Amended**: 2026-01-20

# Implementation Plan: 관리자 로그인

**Branch**: `001-admin-auth` | **Date**: 2025-01-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-admin-auth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

관리자가 이메일과 비밀번호로 로그인할 수 있는 기능을 구현합니다. 로그인 성공 시 인증 토큰(accessToken, refreshToken)과 관리자 정보(id, email, name, role)를 받아와 저장하고, 이후 API 요청에 자동으로 인증 토큰을 포함시킵니다. Next.js App Router 기반의 클라이언트 컴포넌트로 구현하며, 기존 API 클라이언트 구조를 활용합니다.

## Technical Context

**Language/Version**: TypeScript 5.x, JavaScript (ES2020+)  
**Primary Dependencies**: Next.js 16.1.3, React 19.2.3, Axios 1.7.9, React Hook Form 7.71.1  
**Storage**: 브라우저 로컬 스토리지 또는 세션 스토리지 (인증 토큰 저장)  
**Testing**: Playwright (E2E 테스트), 기존 테스트 구조 활용  
**Target Platform**: 웹 브라우저 (Chrome, Firefox, Safari, Edge)  
**Project Type**: web (Next.js App Router 기반 단일 페이지 애플리케이션)  
**Performance Goals**: 로그인 요청 응답 시간 3초 이내 (95% 이상), 로그인 완료 시간 5초 이내  
**Constraints**: 
- 인증 토큰은 안전하게 저장되어야 함
- 토큰 만료 시 자동 갱신 메커니즘 필요
- 네트워크 오류 시 적절한 에러 처리
- 동시 요청 방지 (로딩 상태 관리)  
**Scale/Scope**: 단일 관리자 인증 기능, 기존 관리자 시스템에 통합

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution 파일이 템플릿 형태로 되어 있어 구체적인 원칙을 확인할 수 없습니다. 다음 사항들을 확인해야 합니다:

- **테스트 우선 개발**: 기존 E2E 테스트 구조(Playwright)를 활용하여 로그인 기능 테스트 작성
- **코드 품질**: TypeScript 타입 안정성 유지, 기존 코드 스타일 준수
- **보안**: 인증 토큰 안전한 저장 및 전송, XSS 방지
- **사용자 경험**: 명확한 에러 메시지, 로딩 상태 표시

**Gate Status**: ✅ PASS (기존 프로젝트 구조와 일관성 유지, 추가 복잡도 없음)

## Project Structure

### Documentation (this feature)

```text
specs/001-admin-auth/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── admin-auth-api.yaml  # OpenAPI 스펙
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/app/
├── commons/
│   ├── apis/
│   │   └── admin/
│   │       └── index.ts              # 기존 API 함수 (login 함수 수정 필요)
│   ├── provider/
│   │   └── api-provider/
│   │       ├── api-client.ts        # 기존 API 클라이언트 (토큰 인터셉터 추가 필요)
│   │       └── api-provider.tsx     # 기존 API Provider
│   └── hooks/
│       └── use-auth.ts              # 새로 생성: 인증 상태 관리 훅
│   └── context/
│       └── auth-context.tsx         # 새로 생성: 인증 컨텍스트
│   └── utils/
│       └── token-storage.ts         # 새로 생성: 토큰 저장/조회 유틸리티
├── components/
│   └── LoginPage/
│       ├── index.tsx                # 기존 컴포넌트 (로그인 로직 추가)
│       └── styles.module.css        # 기존 스타일
└── page.tsx                         # 기존 루트 페이지 (인증 상태에 따른 라우팅 추가)

src/app/tests/
└── api-tests/
    └── admin-test/
        └── admim-test.spec.ts       # 기존 테스트 (로그인 테스트 추가/확장)
```

**Structure Decision**: 기존 Next.js App Router 구조를 유지하며, 인증 관련 기능을 `commons` 디렉토리에 추가합니다. 인증 상태 관리를 위한 Context와 Custom Hook을 추가하고, 기존 API 클라이언트에 토큰 인터셉터를 추가합니다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

현재 구조는 기존 프로젝트와 일관성을 유지하며 추가 복잡도가 없습니다.

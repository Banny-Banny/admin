# Implementation Plan: 하위 관리자 계정 생성 및 관리

**Branch**: `002-sub-admin-management` | **Date**: 2025-01-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-sub-admin-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

슈퍼 어드민이 하위 관리자 계정을 생성하고 관리할 수 있는 기능을 구현합니다. 관리자 추가 폼을 통해 이름, 이메일, 권한, 임시 비밀번호를 입력받아 계정을 생성하고, 생성된 계정은 즉시 관리자 목록에 표시됩니다. 생성된 관리자는 동일한 로그인 API를 사용하여 로그인할 수 있으며, 각 관리자는 자신의 계정으로 알림/마케팅 글을 작성하고 관리할 수 있습니다. Next.js App Router 기반의 클라이언트 컴포넌트로 구현하며, 기존 API 클라이언트 구조와 인증 시스템을 활용합니다.

## Technical Context

**Language/Version**: TypeScript 5.x, JavaScript (ES2020+)  
**Primary Dependencies**: Next.js 16.1.3, React 19.2.3, Axios 1.7.9, React Hook Form 7.71.1  
**Storage**: 브라우저 로컬 스토리지 (인증 토큰 저장), 백엔드 데이터베이스 (관리자 계정 정보)  
**Testing**: Playwright (E2E 테스트), 기존 테스트 구조 활용  
**Target Platform**: 웹 브라우저 (Chrome, Firefox, Safari, Edge)  
**Project Type**: web (Next.js App Router 기반 단일 페이지 애플리케이션)  
**Performance Goals**: 
- 관리자 계정 생성 요청 응답 시간 3초 이내 (95% 이상)
- 관리자 계정 생성 완료 시간 30초 이내
- 관리자 목록 조회 응답 시간 1초 이내 (95% 이상)  
**Constraints**: 
- 슈퍼 어드민 권한 검증 필수
- 이메일 중복 검사 및 형식 검증
- 비밀번호 최소 길이 검증 (8자 이상)
- 관리자 목록 실시간 업데이트
- 작성자 정보 저장 및 표시
- 권한 기반 접근 제어  
**Scale/Scope**: 
- 최대 100명의 하위 관리자 계정 관리
- 관리자별 알림/마케팅 메시지 작성 및 관리
- 기존 관리자 인증 시스템과 통합

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution 파일이 템플릿 형태로 되어 있어 구체적인 원칙을 확인할 수 없습니다. 다음 사항들을 확인해야 합니다:

- **테스트 우선 개발**: 기존 E2E 테스트 구조(Playwright)를 활용하여 관리자 계정 생성 및 관리 기능 테스트 작성
- **코드 품질**: TypeScript 타입 안정성 유지, 기존 코드 스타일 준수
- **보안**: 슈퍼 어드민 권한 검증, 이메일 중복 검사, 비밀번호 검증
- **사용자 경험**: 명확한 에러 메시지, 로딩 상태 표시, 실시간 목록 업데이트
- **기존 시스템 통합**: 기존 관리자 인증 시스템(001-admin-auth)과의 일관성 유지

**Gate Status**: ✅ PASS (기존 프로젝트 구조와 일관성 유지, 기존 인증 시스템 활용, 추가 복잡도 최소화)

**Post-Phase 1 Re-check**: ✅ PASS
- Phase 1 설계 완료 후 재검증 결과, 모든 원칙을 준수함
- 기존 인증 시스템 재사용으로 복잡도 최소화
- 테스트 가능한 구조로 설계됨
- 보안 및 권한 검증이 적절히 설계됨

## Project Structure

### Documentation (this feature)

```text
specs/002-sub-admin-management/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── admin-management-api.yaml  # OpenAPI 스펙
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/app/
├── commons/
│   ├── apis/
│   │   └── admin/
│   │       └── index.ts              # 기존 API 함수 (createAdmin, 관리자 목록 조회 API 추가)
│   ├── context/
│   │   └── auth-context.tsx          # 기존 인증 컨텍스트 (슈퍼 어드민 권한 확인 함수 추가)
│   └── types/
│       └── auth.ts                   # 기존 타입 정의 (관리자 목록 관련 타입 추가)
├── components/
│   ├── UsersPage/
│   │   ├── index.tsx                # 기존 컴포넌트 (관리자 추가 폼 로직 개선, 관리자 목록 API 연동)
│   │   └── styles.module.css        # 기존 스타일
│   └── MarketingPage/
│       ├── index.tsx                # 기존 컴포넌트 (작성자 정보 추가, 권한 기반 수정/삭제 로직 추가)
│       └── styles.module.css        # 기존 스타일
└── tests/
    └── api-tests/
        └── admin-test/
            └── admin-management.spec.ts  # 새로 생성: 관리자 계정 생성 및 관리 테스트
```

**Structure Decision**: 기존 Next.js App Router 구조를 유지하며, 기존 API 클라이언트와 인증 시스템을 활용합니다. UsersPage 컴포넌트의 관리자 추가 폼을 백엔드 API와 연동하고, MarketingPage 컴포넌트에 작성자 정보 및 권한 관리 기능을 추가합니다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

현재 구조는 기존 프로젝트와 일관성을 유지하며 추가 복잡도가 없습니다. 기존 인증 시스템을 재사용하고, 기존 컴포넌트를 확장하는 방식으로 구현하여 복잡도를 최소화합니다.

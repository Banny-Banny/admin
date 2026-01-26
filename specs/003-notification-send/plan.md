# Implementation Plan: 유저 알림 메시지 발송 기능

**Branch**: `003-notification-send` | **Date**: 2026-01-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-notification-send/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

관리자가 유저에게 알림 메시지를 발송할 수 있는 기능을 구현합니다. 메시지 유형(광고, 안내, 이벤트, 업데이트)과 발송 대상(전체 회원, 활성 회원, 휴면 회원, VIP 회원)을 선택하고, 제목과 내용을 입력하여 즉시 발송할 수 있습니다. 제목과 내용이 모두 입력되어야만 즉시 발송 버튼이 활성화됩니다.

기술적 접근:
- 기존 Next.js App Router 구조 활용
- TypeScript 타입 안정성 유지
- 기존 API 클라이언트 패턴 준수
- React Hook Form을 활용한 폼 유효성 검사
- 실시간 버튼 활성화/비활성화 상태 관리

## Technical Context

**Language/Version**: TypeScript 5, React 19.2.3, Next.js 16.1.3  
**Primary Dependencies**: 
- React 19.2.3
- Next.js 16.1.3 (App Router)
- Axios 1.7.9 (API 클라이언트)
- React Hook Form 7.71.1 (폼 관리)
- TypeScript 5
- Playwright 1.48.0 (E2E 테스트)

**Storage**: 백엔드 API를 통한 데이터 저장 (프론트엔드에서는 로컬 상태 관리만)  
**Testing**: Playwright E2E 테스트  
**Target Platform**: 웹 브라우저 (Next.js SSR/CSR)  
**Project Type**: Web application (Next.js App Router)  
**Performance Goals**: 
- 메시지 발송 폼 렌더링: 100ms 이내
- API 호출 응답 시간: 500ms 이내 (백엔드 의존)
- 버튼 활성화/비활성화 상태 변경: 즉시 반영

**Constraints**: 
- 제목과 내용은 필수 입력 항목
- 제목이나 내용이 비어있으면 즉시 발송 버튼 비활성화
- 메시지 유형과 발송 대상은 필수 선택 항목
- 기존 프로젝트 구조 및 코딩 스타일 준수

**Scale/Scope**: 
- 단일 페이지 컴포넌트 (MarketingPage)
- 4가지 메시지 유형 지원
- 4가지 발송 대상 지원
- 실시간 폼 유효성 검사

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Gate Status**: ✅ PASS

**Check Results**:
- ✅ 기존 프로젝트 구조와 일관성 유지 (src/app/commons/apis/, src/app/components/)
- ✅ TypeScript 타입 안정성 유지
- ✅ 기존 API 클라이언트 패턴 준수
- ✅ 추가 복잡도 없음 (기존 컴포넌트 수정)
- ✅ 테스트 우선 개발 (Playwright E2E 테스트 구조 활용)

## Project Structure

### Documentation (this feature)

```text
specs/003-notification-send/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md         # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── notification-api.yaml  # OpenAPI 스펙
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/app/
├── commons/
│   ├── apis/
│   │   └── notification/
│   │       ├── index.ts                 # 알림 메시지 API 함수들
│   │       └── types.ts                 # 알림 메시지 타입 정의
│   └── provider/
│       └── api-provider/
│           └── api-client.ts            # 기존 API 클라이언트 (수정 불필요)
├── components/
│   └── MarketingPage/
│       ├── index.tsx                    # 기존 컴포넌트 (메시지 발송 기능 추가)
│       └── styles.module.css            # 기존 스타일
└── tests/
    └── api-tests/
        └── notification-test/
            └── notification.spec.ts     # 알림 메시지 발송 E2E 테스트
```

**Structure Decision**: 기존 Next.js 프로젝트 구조를 활용하여 `src/app/commons/apis/notification/` 폴더에 알림 메시지 API 함수들을 구현하고, 기존 `MarketingPage` 컴포넌트를 수정하여 메시지 발송 기능을 추가합니다. E2E 테스트는 기존 Playwright 구조를 따라 `src/app/tests/api-tests/notification-test/` 폴더에 작성합니다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

현재 복잡도 위반 사항 없음.

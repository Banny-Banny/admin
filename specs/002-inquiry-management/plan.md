# Implementation Plan: 문의하기 기능

**Branch**: `002-inquiry-management` | **Date**: 2026-01-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-inquiry-management/spec.md`

## Summary

관리자가 고객이 생성한 문의(채팅방) 목록을 조회하고, 실시간 채팅을 통해 고객과 소통할 수 있는 기능을 구현합니다. 문의 목록 조회는 HTTP API를 통해, 실시간 채팅은 Socket.IO WebSocket을 통해 처리합니다. 기존 Next.js 프로젝트 구조를 활용하여 InquiryPage 컴포넌트에 통합합니다.

## Technical Context

**Language/Version**: TypeScript 5, JavaScript (ES2020+)  
**Primary Dependencies**: 
- Next.js 16.1.3
- React 19.2.3
- Socket.IO Client 4.8.3
- Axios 1.7.9
- Radix UI 컴포넌트 라이브러리
- Playwright 1.48.0 (E2E 테스트)

**Storage**: N/A (백엔드 API를 통해 데이터 관리)  
**Testing**: Playwright E2E 테스트 (`npm run test:e2e`)  
**Target Platform**: 웹 브라우저 (최신 버전, JavaScript 활성화 필요)  
**Project Type**: Web application (Next.js 기반 관리자 대시보드)  
**Performance Goals**: 
- 문의 목록 조회: 3초 이내
- 검색/필터링: 1초 이내
- 채팅 인터페이스 열기: 2초 이내
- 메시지 전송: 2초 이내
- 실시간 메시지 수신: 1초 이내

**Constraints**: 
- 메시지 길이 제한: 최대 1500자
- Socket.IO 연결 안정성: 99% 이상
- 반응형 디자인 지원
- 네트워크 오류 처리 필요

**Scale/Scope**: 
- 관리자 다수 동시 접속 지원
- 실시간 채팅 메시지 처리
- 페이지네이션을 통한 대량 문의 목록 관리

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Gate Status**: ✅ PASS

- 기존 프로젝트 구조 활용 (추가 복잡도 없음)
- 기존 API 클라이언트 및 인증 시스템 재사용
- 기존 컴포넌트 구조에 통합
- E2E 테스트 구조 활용
- TypeScript 타입 안정성 유지

## Project Structure

### Documentation (this feature)

```text
specs/002-inquiry-management/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── admin-inquiry-api.yaml  # OpenAPI 스펙
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/app/
├── commons/
│   ├── apis/
│   │   └── inquiry/
│   │       ├── http.ts                 # HTTP API 클라이언트 및 함수들
│   │       ├── socket.ts               # Socket.IO 클라이언트
│   │       └── index.ts                # HTTP 및 Socket 통합 export
├── components/
│   ├── InquiryPage/
│   │   ├── index.tsx                    # 문의하기 페이지 컴포넌트 (기존, 수정 필요)
│   │   └── styles.module.css           # 스타일 파일
│   ├── RecentInquiries/
│   │   ├── index.tsx                    # 문의 목록 컴포넌트 (기존, 수정 필요)
│   │   └── styles.module.css
│   └── ChatInterface/
│       ├── index.tsx                    # 채팅 인터페이스 컴포넌트 (기존, 수정 필요)
│       └── styles.module.css
└── page.tsx                             # 메인 페이지 (라우팅, 기존)

src/app/tests/
└── api-tests/
    └── inquiry-test/
        ├── inquiry-api.spec.ts         # HTTP API E2E 테스트
        └── inquiry-socket.spec.ts      # Socket.IO E2E 테스트
```

**Structure Decision**: 기존 Next.js 프로젝트 구조를 활용하여 `src/app/commons/apis/inquiry/` 폴더에 HTTP API(`http.ts`)와 Socket.IO 클라이언트(`socket.ts`)를 분리하여 구현하고, `index.ts`에서 통합 export합니다. 기존 컴포넌트를 수정하여 데이터 바인딩 및 실시간 통신을 구현합니다.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

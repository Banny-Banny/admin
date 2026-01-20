# Research: 관리자 로그인 기능

**Feature**: 관리자 로그인  
**Date**: 2025-01-19  
**Phase**: Phase 0 - Research

## Research Questions

### 1. 인증 토큰 저장 방식

**Question**: 브라우저에서 인증 토큰을 어디에 저장할 것인가?

**Decision**: localStorage 사용

**Rationale**:
- Next.js App Router는 클라이언트 사이드 렌더링을 사용하므로 브라우저 스토리지 접근 가능
- localStorage는 세션이 종료되어도 유지되어 사용자 편의성 향상
- refreshToken도 함께 저장하여 자동 갱신 가능
- XSS 공격에 대한 보안 고려 필요하지만, 이 프로젝트는 관리자 전용 시스템이므로 상대적으로 안전

**Alternatives considered**:
- **sessionStorage**: 세션 종료 시 자동 삭제되어 보안성은 높지만, 사용자가 매번 로그인해야 하는 불편함
- **httpOnly Cookie**: XSS 공격에 더 안전하지만, 클라이언트 사이드에서 직접 접근 불가하여 Next.js App Router 구조와 맞지 않음
- **메모리 저장**: 가장 안전하지만 페이지 새로고침 시 토큰 손실

**Security Considerations**:
- XSS 방지를 위한 입력값 검증 및 sanitization
- HTTPS 사용 필수
- 토큰 만료 시간 적절히 설정

---

### 2. 인증 상태 관리 방식

**Question**: React에서 인증 상태를 어떻게 관리할 것인가?

**Decision**: React Context API + Custom Hook 조합

**Rationale**:
- Next.js App Router는 클라이언트 컴포넌트에서 Context 사용 가능
- 전역 상태 관리 라이브러리(Redux, Zustand 등) 도입 없이도 충분
- 기존 프로젝트 구조와 일관성 유지
- Custom Hook으로 인증 로직 캡슐화하여 재사용성 향상

**Alternatives considered**:
- **Zustand**: 가볍고 사용하기 쉬우나, 프로젝트에 추가 의존성 도입 필요
- **Redux**: 강력하지만 이 기능에는 과함
- **Props Drilling**: 간단하지만 여러 컴포넌트에서 사용 시 복잡도 증가

**Implementation Pattern**:
```typescript
// AuthContext: 인증 상태 및 메서드 제공
// useAuth: 인증 관련 로직을 캡슐화한 커스텀 훅
```

---

### 3. 토큰 자동 갱신 메커니즘

**Question**: accessToken이 만료되었을 때 자동으로 갱신할 것인가?

**Decision**: Axios 인터셉터를 사용한 자동 갱신

**Rationale**:
- 기존 ApiClient 클래스에 인터셉터가 이미 구현되어 있음
- 401 응답 시 refreshToken으로 자동 갱신 시도
- 사용자 경험 향상 (재로그인 불필요)
- 토큰 갱신 실패 시 자동 로그아웃 처리

**Alternatives considered**:
- **수동 갱신**: 사용자가 직접 재로그인, 구현은 간단하지만 사용자 경험 저하
- **주기적 갱신**: 토큰 만료 전 주기적으로 갱신, 불필요한 API 호출 가능

**Implementation Strategy**:
1. API 요청 시 401 응답 감지
2. refreshToken으로 토큰 갱신 API 호출
3. 새 accessToken으로 원래 요청 재시도
4. 갱신 실패 시 로그아웃 처리

---

### 4. 로그인 폼 검증

**Question**: 폼 검증을 어떻게 구현할 것인가?

**Decision**: React Hook Form 사용

**Rationale**:
- 프로젝트에 이미 react-hook-form이 설치되어 있음
- 성능 최적화 (불필요한 리렌더링 방지)
- 타입 안정성 (TypeScript와 잘 통합)
- 에러 메시지 관리 용이

**Alternatives considered**:
- **기본 HTML5 validation**: 간단하지만 커스터마이징 제한
- **Formik**: 인기 있지만 프로젝트에 추가 의존성 필요
- **수동 상태 관리**: 구현 가능하지만 코드 복잡도 증가

---

### 5. 에러 처리 및 사용자 피드백

**Question**: 로그인 실패 시 어떻게 사용자에게 알릴 것인가?

**Decision**: Toast 알림 (sonner 라이브러리) + 인라인 에러 메시지

**Rationale**:
- 프로젝트에 이미 sonner가 설치되어 있음
- 비침투적이고 사용자 친화적
- React Hook Form과 통합하여 필드별 에러 메시지 표시
- 네트워크 오류, 인증 실패 등 다양한 에러 상황 처리

**Alternatives considered**:
- **Alert/Dialog**: 침투적이고 사용자 경험 저하
- **콘솔 로그만**: 사용자가 에러를 인지하기 어려움

---

### 6. 라우팅 및 인증 가드

**Question**: 인증되지 않은 사용자가 보호된 페이지에 접근할 때 어떻게 처리할 것인가?

**Decision**: 클라이언트 사이드 라우팅 가드

**Rationale**:
- Next.js App Router는 클라이언트 컴포넌트에서 라우팅 제어 가능
- page.tsx에서 인증 상태 확인 후 로그인 페이지로 리다이렉트
- 기존 구조(page.tsx의 currentPage 상태) 활용

**Alternatives considered**:
- **Middleware**: 서버 사이드에서 처리 가능하지만 App Router 구조와 맞지 않음
- **서버 컴포넌트**: 인증 상태를 서버에서 확인하기 어려움 (토큰이 클라이언트에 저장됨)

---

### 7. API 클라이언트 토큰 인터셉터

**Question**: API 요청 시 토큰을 어떻게 자동으로 포함시킬 것인가?

**Decision**: Axios 요청 인터셉터 활용

**Rationale**:
- 기존 ApiClient 클래스에 인터셉터 구조가 이미 있음
- 모든 API 요청에 자동으로 Authorization 헤더 추가
- 토큰이 없을 때는 헤더를 추가하지 않음 (로그인 API 등)

**Implementation**:
```typescript
// 요청 인터셉터에서 localStorage에서 토큰 조회
// Authorization: Bearer {accessToken} 헤더 추가
```

---

## 기술 스택 요약

| 항목 | 선택된 기술 | 이유 |
|------|------------|------|
| 토큰 저장 | localStorage | 세션 유지, 사용자 편의성 |
| 상태 관리 | React Context + Custom Hook | 기존 구조와 일관성, 추가 의존성 없음 |
| 폼 관리 | React Hook Form | 이미 설치됨, 성능 최적화 |
| 에러 알림 | Sonner (Toast) | 이미 설치됨, 사용자 친화적 |
| API 클라이언트 | Axios (기존) | 기존 구조 활용 |
| 라우팅 | Next.js App Router (기존) | 기존 구조 활용 |

## 보안 고려사항

1. **XSS 방지**: 입력값 검증 및 sanitization
2. **HTTPS 사용**: 프로덕션 환경에서 필수
3. **토큰 만료 시간**: 적절한 만료 시간 설정 (백엔드와 협의)
4. **토큰 갱신 실패 처리**: 자동 로그아웃으로 보안 유지
5. **민감 정보 로깅**: 토큰은 콘솔에 로그하지 않음

## 성능 고려사항

1. **토큰 조회**: localStorage 접근은 동기적이지만 빠름
2. **인증 상태 체크**: Context를 통한 전역 상태로 불필요한 API 호출 방지
3. **로딩 상태**: 사용자 경험을 위한 로딩 인디케이터 표시
4. **동시 요청 방지**: 로그인 중 추가 요청 방지

## 다음 단계

Phase 1에서 다음을 구현:
1. data-model.md: 관리자 계정 및 인증 세션 엔티티 정의
2. contracts/: API 스펙 문서화
3. quickstart.md: 개발자 가이드

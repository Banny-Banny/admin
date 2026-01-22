# Research: 하위 관리자 계정 생성 및 관리 기능

**Feature**: 하위 관리자 계정 생성 및 관리  
**Date**: 2025-01-19  
**Phase**: Phase 0 - Research

## Research Questions

### 1. 관리자 계정 생성 API 설계

**Question**: 관리자 계정 생성 API는 어떤 구조로 설계할 것인가?

**Decision**: RESTful API 패턴 사용, 기존 관리자 인증 API 구조와 일관성 유지

**Rationale**:
- 기존 `/api/admin/auth/login` API와 일관된 구조
- 슈퍼 어드민 권한 검증은 백엔드에서 처리
- 생성된 계정은 즉시 로그인 가능해야 함
- 이메일 중복 검사는 백엔드에서 수행

**API 구조**:
```
POST /api/admin/auth/admins
Headers: Authorization: Bearer {accessToken}
Body: {
  name: string,
  email: string,
  password: string,
  role: AdminRole
}
Response: {
  id: string,
  email: string,
  name: string,
  role: AdminRole,
  createdAt: string
}
```

**Alternatives considered**:
- **GraphQL**: 유연하지만 기존 REST API 구조와 불일치
- **별도 도메인**: `/api/admin/management/admins` - 일관성 저하

---

### 2. 관리자 목록 조회 API 설계

**Question**: 관리자 목록을 어떻게 조회할 것인가?

**Decision**: GET 엔드포인트로 전체 관리자 목록 조회, 페이지네이션은 추후 확장 가능

**Rationale**:
- 초기에는 관리자 수가 적을 것으로 예상 (최대 100명)
- 간단한 GET 요청으로 충분
- 추후 페이지네이션 필요 시 쿼리 파라미터 추가 가능

**API 구조**:
```
GET /api/admin/auth/admins
Headers: Authorization: Bearer {accessToken}
Response: {
  admins: Array<{
    id: string,
    email: string,
    name: string,
    role: AdminRole,
    createdAt: string,
    lastLoginAt: string | null
  }>
}
```

**Alternatives considered**:
- **페이지네이션 포함**: 초기에는 불필요한 복잡도
- **필터링/정렬**: 추후 필요 시 추가

---

### 3. 슈퍼 어드민 권한 검증

**Question**: 슈퍼 어드민 권한을 어떻게 검증할 것인가?

**Decision**: 백엔드 API에서 권한 검증, 프론트엔드는 현재 로그인한 관리자의 role 확인

**Rationale**:
- 보안은 백엔드에서 확실하게 보장
- 프론트엔드는 UI 표시 제어만 수행
- 기존 인증 시스템의 AdminRole enum 활용
- AuthContext에서 현재 관리자 정보 확인 가능

**Implementation**:
```typescript
// 프론트엔드: UI 제어
const { admin } = useAuth();
const isSuperAdmin = admin?.role === AdminRole.SUPER_ADMIN;

// 백엔드: 실제 권한 검증 (API 요청 시)
// Authorization 헤더의 토큰에서 role 확인
```

**Alternatives considered**:
- **프론트엔드만 검증**: 보안 취약점
- **별도 권한 API**: 불필요한 API 호출

---

### 4. 관리자 목록 실시간 업데이트

**Question**: 관리자 계정 생성 후 목록을 어떻게 업데이트할 것인가?

**Decision**: Optimistic Update 패턴 사용, API 호출 후 목록 재조회

**Rationale**:
- 사용자 경험 향상 (즉시 피드백)
- API 성공 후 서버 데이터로 동기화
- 간단하고 안정적인 패턴

**Implementation Flow**:
1. 관리자 추가 폼 제출
2. Optimistic: 로컬 상태에 임시 관리자 추가 (로딩 표시)
3. API 호출: POST /api/admin/auth/admins
4. 성공: 관리자 목록 재조회 (GET /api/admin/auth/admins)
5. 실패: Optimistic 업데이트 롤백, 에러 메시지 표시

**Alternatives considered**:
- **서버 푸시 (WebSocket)**: 불필요한 복잡도
- **폴링**: 불필요한 네트워크 요청
- **수동 새로고침**: 사용자 경험 저하

---

### 5. 알림/마케팅 메시지 작성자 정보 저장

**Question**: 메시지 작성자 정보를 어떻게 저장하고 표시할 것인가?

**Decision**: 메시지 엔티티에 `createdBy` 필드 추가, 현재 로그인한 관리자 ID 저장

**Rationale**:
- 간단하고 명확한 구조
- 작성자 추적 가능
- 권한 기반 수정/삭제 제어 가능
- 기존 메시지 구조 확장

**Data Model**:
```typescript
interface Message {
  id: number;
  title: string;
  content: string;
  type: '광고' | '안내' | '이벤트' | '업데이트';
  target: string;
  status: '발송완료' | '발송대기' | '예약';
  sentAt: string;
  recipients: number;
  openRate: number;
  createdBy: string; // 관리자 ID
  createdByName: string; // 관리자 이름 (표시용)
  createdAt: string;
}
```

**Alternatives considered**:
- **별도 작성자 테이블**: 불필요한 복잡도
- **이메일만 저장**: 이름 표시를 위해 추가 조회 필요

---

### 6. 권한 기반 메시지 수정/삭제 제어

**Question**: 메시지 수정/삭제 권한을 어떻게 제어할 것인가?

**Decision**: 프론트엔드에서 UI 제어, 백엔드에서 실제 권한 검증

**Rationale**:
- 사용자 경험: 자신이 작성한 메시지만 수정/삭제 버튼 표시
- 보안: 백엔드 API에서 실제 권한 검증
- 슈퍼 어드민은 모든 메시지 관리 가능

**Implementation**:
```typescript
// 프론트엔드: UI 제어
const canEdit = message.createdBy === admin?.id || admin?.role === AdminRole.SUPER_ADMIN;

// 백엔드: 실제 권한 검증
// PUT/DELETE /api/marketing/messages/:id 요청 시
// Authorization 헤더의 관리자 ID와 message.createdBy 비교
```

**Alternatives considered**:
- **역할 기반만**: 작성자 정보 없이 역할만으로 제어 (유연성 부족)
- **모든 관리자가 모든 메시지 수정 가능**: 책임 소재 불명확

---

### 7. 에러 처리 및 사용자 피드백

**Question**: 관리자 계정 생성 실패 시 어떻게 사용자에게 알릴 것인가?

**Decision**: React Hook Form 에러 메시지 + Toast 알림 (sonner)

**Rationale**:
- 기존 프로젝트의 에러 처리 패턴과 일관성
- 필드별 에러 메시지 (이메일 중복, 형식 오류 등)
- 전역 에러 알림 (네트워크 오류 등)
- 사용자 친화적인 피드백

**Error Types**:
- **이메일 중복**: 인라인 에러 메시지
- **이메일 형식 오류**: React Hook Form 검증
- **비밀번호 길이 오류**: React Hook Form 검증
- **권한 오류**: Toast 알림
- **네트워크 오류**: Toast 알림

**Alternatives considered**:
- **Alert만**: 침투적이고 사용자 경험 저하
- **콘솔 로그만**: 사용자가 에러를 인지하기 어려움

---

### 8. 관리자 목록 정렬 및 표시

**Question**: 관리자 목록을 어떤 순서로 표시할 것인가?

**Decision**: 최신 생성 순서로 정렬 (createdAt DESC), 백엔드에서 정렬된 데이터 제공

**Rationale**:
- 최근에 추가된 관리자를 먼저 확인 가능
- 사용자 요구사항 명시 (스펙의 FR-013)
- 간단하고 직관적

**Alternatives considered**:
- **이름 순**: 최신 관리자를 찾기 어려움
- **이메일 순**: 실용성 낮음
- **클라이언트 정렬**: 불필요한 처리

---

## 기술 스택 요약

| 항목 | 선택된 기술 | 이유 |
|------|------------|------|
| API 패턴 | RESTful (기존) | 기존 구조와 일관성 |
| 상태 관리 | React State + Context (기존) | 기존 인증 시스템 활용 |
| 폼 관리 | React Hook Form (기존) | 이미 설치됨, 검증 용이 |
| 에러 알림 | Sonner (Toast, 기존) | 이미 설치됨, 사용자 친화적 |
| API 클라이언트 | Axios (기존) | 기존 구조 활용 |
| 권한 검증 | 백엔드 + 프론트엔드 UI 제어 | 보안 + 사용자 경험 |

## 보안 고려사항

1. **슈퍼 어드민 권한 검증**: 백엔드에서 필수 검증
2. **이메일 중복 검사**: 백엔드에서 수행
3. **비밀번호 검증**: 최소 8자 이상, 백엔드에서 검증
4. **권한 기반 접근 제어**: 메시지 수정/삭제 시 백엔드에서 검증
5. **HTTPS 사용**: 프로덕션 환경에서 필수

## 성능 고려사항

1. **Optimistic Update**: 즉시 피드백으로 사용자 경험 향상
2. **목록 재조회**: API 성공 후 서버 데이터로 동기화
3. **로딩 상태**: 사용자 경험을 위한 로딩 인디케이터 표시
4. **동시 요청 방지**: 계정 생성 중 추가 요청 방지

## 기존 시스템 통합

1. **인증 시스템 (001-admin-auth)**: 
   - 기존 로그인 API 재사용
   - AuthContext 활용
   - AdminRole enum 활용

2. **API 클라이언트**:
   - 기존 ApiClient 클래스 활용
   - 토큰 인터셉터 자동 적용

3. **컴포넌트 구조**:
   - 기존 UsersPage 컴포넌트 확장
   - 기존 MarketingPage 컴포넌트 확장

## 다음 단계

Phase 1에서 다음을 구현:
1. data-model.md: 하위 관리자 계정, 관리자 목록, 알림/마케팅 메시지 엔티티 정의
2. contracts/: 관리자 계정 생성 및 목록 조회 API 스펙 문서화
3. quickstart.md: 개발자 가이드

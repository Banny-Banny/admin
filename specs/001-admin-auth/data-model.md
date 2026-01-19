# Data Model: 관리자 인증

**Feature**: 관리자 로그인  
**Date**: 2025-01-19  
**Phase**: Phase 1 - Design

## Entities

### 1. 관리자 계정 (Admin Account)

관리자 시스템을 사용하는 사용자 계정입니다.

**Attributes**:
- `id` (string, required): 관리자 고유 식별자
- `email` (string, required): 관리자 이메일 주소 (로그인 ID로 사용)
- `name` (string, required): 관리자 이름
- `role` (AdminRole enum, required): 관리자 역할 (SUPER_ADMIN, ADMIN 등)
- `password` (string, required): 비밀번호 (해시된 형태로 저장, 클라이언트에는 전송되지 않음)
- `createdAt` (string, optional): 계정 생성 일시 (ISO 8601 형식)
- `updatedAt` (string, optional): 계정 수정 일시 (ISO 8601 형식)

**Validation Rules**:
- `email`: 유효한 이메일 형식이어야 함
- `password`: 최소 길이 및 복잡도 요구사항 충족 (백엔드에서 검증)
- `name`: 비어있지 않아야 함

**State Transitions**:
- 계정은 슈퍼 관리자에 의해 생성됨
- 생성된 계정으로 로그인 가능
- 계정 삭제/비활성화는 별도 기능 (이 명세서 범위 아님)

**Relationships**:
- 관리자 계정은 여러 인증 세션을 가질 수 있음 (다른 기기에서 동시 로그인 가능)

---

### 2. 인증 세션 (Authentication Session)

관리자의 인증 상태를 나타내는 정보입니다.

**Attributes**:
- `accessToken` (string, required): API 요청에 사용되는 액세스 토큰
- `refreshToken` (string, required): 액세스 토큰 갱신에 사용되는 리프레시 토큰
- `admin` (AdminInfo, required): 현재 로그인한 관리자 정보
  - `id` (string): 관리자 ID
  - `email` (string): 관리자 이메일
  - `name` (string): 관리자 이름
  - `role` (AdminRole): 관리자 역할

**Storage**:
- 클라이언트 측: localStorage에 JSON 형태로 저장
- 키: `admin_auth_session` (또는 유사한 명명 규칙)

**State Transitions**:
- **초기 상태**: 인증 세션 없음 (로그인 전)
- **로그인 성공**: 인증 세션 생성 및 저장
- **토큰 갱신**: accessToken 갱신, refreshToken은 유지 또는 갱신
- **로그아웃**: 인증 세션 삭제
- **토큰 만료**: accessToken 만료 시 자동 갱신 시도, 실패 시 로그아웃

**Validation Rules**:
- `accessToken`: 유효한 JWT 토큰 형식이어야 함
- `refreshToken`: 유효한 토큰 형식이어야 함
- `admin`: 필수 필드가 모두 포함되어야 함

**Relationships**:
- 인증 세션은 하나의 관리자 계정에 속함

---

### 3. 로그인 요청 (Login Request)

관리자 로그인 시 전송되는 데이터입니다.

**Attributes**:
- `email` (string, required): 관리자 이메일
- `password` (string, required): 관리자 비밀번호 (평문, HTTPS로 전송)

**Validation Rules**:
- `email`: 유효한 이메일 형식이어야 함
- `password`: 비어있지 않아야 함

---

### 4. 로그인 응답 (Login Response)

로그인 성공 시 받아오는 데이터입니다.

**Attributes**:
- `accessToken` (string, optional): 액세스 토큰
- `refreshToken` (string, optional): 리프레시 토큰
- `admin` (AdminInfo, optional): 관리자 정보
  - `id` (string): 관리자 ID
  - `email` (string): 관리자 이메일
  - `name` (string): 관리자 이름
  - `role` (AdminRole): 관리자 역할
- `message` (string, optional): 응답 메시지

**Error Response**:
- HTTP 401: 인증 실패 (잘못된 이메일 또는 비밀번호)
- HTTP 400: 잘못된 요청 (필수 필드 누락, 형식 오류)
- HTTP 500: 서버 오류

---

## Data Flow

### 로그인 플로우

```
1. 사용자가 이메일과 비밀번호 입력
2. LoginRequest 생성 및 검증
3. POST /api/admin/auth/login 요청
4. 백엔드에서 인증 처리
5. LoginResponse 수신 (accessToken, refreshToken, admin 정보)
6. 인증 세션을 localStorage에 저장
7. AuthContext 상태 업데이트
8. 관리자 대시보드로 리다이렉트
```

### 토큰 갱신 플로우

```
1. API 요청 시 401 응답 수신
2. refreshToken으로 토큰 갱신 API 호출
3. 새 accessToken 수신
4. localStorage 업데이트
5. 원래 요청 재시도
```

### 로그아웃 플로우

```
1. 사용자가 로그아웃 버튼 클릭
2. POST /api/admin/auth/logout 요청 (선택적)
3. localStorage에서 인증 세션 삭제
4. AuthContext 상태 초기화
5. 로그인 페이지로 리다이렉트
```

## TypeScript Interfaces

```typescript
// 관리자 역할 열거형
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
}

// 관리자 정보
export interface AdminInfo {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

// 로그인 요청
export interface LoginRequest {
  email: string;
  password: string;
}

// 로그인 응답
export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  admin?: AdminInfo;
  message?: string;
}

// 인증 세션 (클라이언트 저장용)
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  admin: AdminInfo;
}

// 인증 상태 (Context에서 사용)
export interface AuthState {
  isAuthenticated: boolean;
  admin: AdminInfo | null;
  isLoading: boolean;
  error: string | null;
}
```

## Storage Schema

### localStorage

```typescript
// 키: 'admin_auth_session'
// 값: JSON.stringify(AuthSession)
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "admin-123",
    "email": "admin@example.com",
    "name": "관리자",
    "role": "ADMIN"
  }
}
```

## Validation Rules Summary

| 필드 | 규칙 | 검증 위치 |
|------|------|----------|
| email | 유효한 이메일 형식 | 클라이언트 (React Hook Form), 서버 |
| password | 비어있지 않음, 최소 길이/복잡도 | 클라이언트 (기본), 서버 (실제 검증) |
| accessToken | 유효한 JWT 형식 | 서버 (토큰 검증) |
| refreshToken | 유효한 토큰 형식 | 서버 (토큰 검증) |
| admin.id | 비어있지 않음 | 서버 |
| admin.email | 유효한 이메일 형식 | 서버 |
| admin.name | 비어있지 않음 | 서버 |
| admin.role | 유효한 AdminRole 값 | 서버 |

# Data Model: 하위 관리자 계정 생성 및 관리

**Feature**: 하위 관리자 계정 생성 및 관리  
**Date**: 2025-01-19  
**Phase**: Phase 1 - Design

## Entities

### 1. 하위 관리자 계정 (Sub Admin Account)

슈퍼 어드민에 의해 생성되는 관리자 계정입니다. 기존 관리자 계정 엔티티를 확장합니다.

**Attributes**:
- `id` (string, required): 관리자 고유 식별자 (서버에서 생성)
- `email` (string, required): 관리자 이메일 주소 (로그인 ID로 사용, 시스템 내 고유)
- `name` (string, required): 관리자 이름
- `role` (AdminRole enum, required): 관리자 역할 (SUPER_ADMIN, ADMIN, CONTENT_ADMIN, CUSTOMER_SUPPORT 등)
- `password` (string, required): 비밀번호 (해시된 형태로 저장, 클라이언트에는 전송되지 않음)
- `createdAt` (string, required): 계정 생성 일시 (ISO 8601 형식)
- `updatedAt` (string, optional): 계정 수정 일시 (ISO 8601 형식)
- `lastLoginAt` (string, optional): 마지막 로그인 일시 (ISO 8601 형식, 로그인 전에는 null)

**Validation Rules**:
- `email`: 유효한 이메일 형식이어야 함, 시스템 내에서 고유해야 함
- `password`: 최소 8자 이상, 백엔드에서 검증
- `name`: 비어있지 않아야 함
- `role`: 유효한 AdminRole enum 값이어야 함

**State Transitions**:
- **초기 상태**: 계정 없음
- **생성**: 슈퍼 어드민이 계정 생성 → 계정 생성됨, 관리자 목록에 추가됨
- **로그인 가능**: 생성된 계정으로 로그인 가능
- **로그인**: 로그인 성공 시 lastLoginAt 업데이트
- **삭제**: 슈퍼 어드민이 계정 삭제 (선택적 기능, 이 명세서 범위 아님)

**Relationships**:
- 관리자 계정은 여러 인증 세션을 가질 수 있음 (다른 기기에서 동시 로그인 가능)
- 관리자 계정은 여러 알림/마케팅 메시지를 작성할 수 있음

---

### 2. 관리자 목록 (Admin List)

시스템에 등록된 모든 관리자 계정의 목록입니다.

**Attributes**:
- `admins` (Array<AdminListItem>, required): 관리자 목록
  - 각 항목은 AdminListItem 타입

**AdminListItem Attributes**:
- `id` (string, required): 관리자 고유 식별자
- `email` (string, required): 관리자 이메일
- `name` (string, required): 관리자 이름
- `role` (AdminRole, required): 관리자 역할
- `createdAt` (string, required): 계정 생성 일시 (ISO 8601 형식)
- `lastLoginAt` (string | null, required): 마지막 로그인 일시 (ISO 8601 형식, 로그인 전에는 null)

**Sorting**:
- 기본 정렬: `createdAt` DESC (최신 생성 순서)

**Relationships**:
- 관리자 목록은 여러 관리자 계정을 포함함

---

### 3. 관리자 계정 생성 요청 (Create Admin Request)

슈퍼 어드민이 하위 관리자 계정을 생성할 때 전송되는 데이터입니다.

**Attributes**:
- `name` (string, required): 관리자 이름
- `email` (string, required): 관리자 이메일 주소 (시스템 내 고유해야 함)
- `password` (string, required): 임시 비밀번호 (최소 8자 이상, 평문, HTTPS로 전송)
- `role` (AdminRole enum, required): 관리자 역할

**Validation Rules**:
- `email`: 유효한 이메일 형식이어야 함, 클라이언트와 서버에서 검증
- `password`: 최소 8자 이상, 클라이언트와 서버에서 검증
- `name`: 비어있지 않아야 함, 클라이언트와 서버에서 검증
- `role`: 유효한 AdminRole enum 값이어야 함

---

### 4. 관리자 계정 생성 응답 (Create Admin Response)

관리자 계정 생성 성공 시 받아오는 데이터입니다.

**Attributes**:
- `id` (string, required): 생성된 관리자 고유 식별자
- `email` (string, required): 관리자 이메일
- `name` (string, required): 관리자 이름
- `role` (AdminRole, required): 관리자 역할
- `createdAt` (string, required): 계정 생성 일시 (ISO 8601 형식)
- `message` (string, optional): 응답 메시지

**Error Response**:
- HTTP 400: 잘못된 요청 (필수 필드 누락, 형식 오류, 비밀번호 길이 부족)
- HTTP 409: 이메일 중복 (이미 존재하는 이메일)
- HTTP 403: 권한 없음 (슈퍼 어드민이 아님)
- HTTP 401: 인증 실패 (토큰 없음 또는 만료)
- HTTP 500: 서버 오류

---

### 5. 알림/마케팅 메시지 (Marketing Message) - 확장

기존 알림/마케팅 메시지 엔티티에 작성자 정보를 추가합니다.

**기존 Attributes** (유지):
- `id` (number, required): 메시지 고유 식별자
- `title` (string, required): 메시지 제목
- `content` (string, required): 메시지 내용
- `type` ('광고' | '안내' | '이벤트' | '업데이트', required): 메시지 유형
- `target` (string, required): 발송 대상
- `status` ('발송완료' | '발송대기' | '예약', required): 발송 상태
- `sentAt` (string, required): 발송 일시
- `recipients` (number, required): 수신자 수
- `openRate` (number, required): 오픈률 (0-100)

**추가 Attributes**:
- `createdBy` (string, required): 작성자 관리자 ID
- `createdByName` (string, required): 작성자 관리자 이름 (표시용)
- `createdByEmail` (string, optional): 작성자 관리자 이메일 (표시용, 선택적)
- `createdAt` (string, required): 작성 일시 (ISO 8601 형식)
- `updatedAt` (string, optional): 수정 일시 (ISO 8601 형식)

**Validation Rules**:
- `createdBy`: 유효한 관리자 ID여야 함
- `createdByName`: 비어있지 않아야 함

**State Transitions**:
- **작성**: 관리자가 메시지 작성 → `createdBy`, `createdByName` 저장
- **수정**: 작성자 또는 슈퍼 어드민이 메시지 수정 → `updatedAt` 업데이트
- **삭제**: 작성자 또는 슈퍼 어드민이 메시지 삭제

**Relationships**:
- 메시지는 하나의 관리자 계정에 의해 작성됨 (createdBy)
- 관리자 계정은 여러 메시지를 작성할 수 있음

---

## Data Flow

### 관리자 계정 생성 플로우

```
1. 슈퍼 어드민이 관리자 추가 폼에 정보 입력
2. CreateAdminRequest 생성 및 클라이언트 검증
3. POST /api/admin/auth/admins 요청 (Authorization 헤더 포함)
4. 백엔드에서 슈퍼 어드민 권한 검증
5. 백엔드에서 이메일 중복 검사
6. 백엔드에서 비밀번호 검증
7. 관리자 계정 생성 (비밀번호 해시화)
8. CreateAdminResponse 수신
9. 관리자 목록 재조회 (GET /api/admin/auth/admins)
10. UI 업데이트 (관리자 목록에 추가 표시)
11. 성공 메시지 표시
```

### 관리자 목록 조회 플로우

```
1. 사용자 관리 페이지 접속
2. GET /api/admin/auth/admins 요청 (Authorization 헤더 포함)
3. 백엔드에서 관리자 목록 조회 (createdAt DESC 정렬)
4. AdminListResponse 수신
5. UI에 관리자 목록 표시
```

### 알림/마케팅 메시지 작성 플로우 (확장)

```
1. 관리자가 로그인한 상태에서 알림/마케팅 페이지 접속
2. 메시지 작성 폼에 정보 입력
3. 현재 로그인한 관리자 정보 (admin.id, admin.name) 포함
4. POST /api/marketing/messages 요청 (Authorization 헤더 포함)
5. 백엔드에서 createdBy, createdByName 저장
6. 메시지 생성 완료
7. 발송 내역에 작성자 정보 표시
```

### 메시지 수정/삭제 권한 검증 플로우

```
1. 관리자가 메시지 수정/삭제 시도
2. 프론트엔드: message.createdBy === admin.id || admin.role === SUPER_ADMIN 확인
3. UI: 권한이 있으면 수정/삭제 버튼 표시
4. PUT/DELETE /api/marketing/messages/:id 요청 (Authorization 헤더 포함)
5. 백엔드: Authorization 헤더의 관리자 ID와 message.createdBy 비교
6. 백엔드: 슈퍼 어드민인지 확인
7. 권한 있음: 수정/삭제 수행
8. 권한 없음: HTTP 403 응답
```

---

## TypeScript Interfaces

```typescript
// 기존 AdminRole enum (001-admin-auth에서 정의됨)
export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  CONTENT_ADMIN = 'CONTENT_ADMIN',
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
}

// 관리자 계정 생성 요청
export interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
}

// 관리자 계정 생성 응답
export interface CreateAdminResponse {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  createdAt: string;
  message?: string;
}

// 관리자 목록 항목
export interface AdminListItem {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  createdAt: string;
  lastLoginAt: string | null;
}

// 관리자 목록 응답
export interface AdminListResponse {
  admins: AdminListItem[];
}

// 알림/마케팅 메시지 (확장)
export interface MarketingMessage {
  id: number;
  title: string;
  content: string;
  type: '광고' | '안내' | '이벤트' | '업데이트';
  target: string;
  status: '발송완료' | '발송대기' | '예약';
  sentAt: string;
  recipients: number;
  openRate: number;
  // 추가된 필드
  createdBy: string;
  createdByName: string;
  createdByEmail?: string;
  createdAt: string;
  updatedAt?: string;
}
```

---

## Storage Schema

### 백엔드 데이터베이스

```sql
-- 관리자 계정 테이블 (예시)
CREATE TABLE admins (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  last_login_at TIMESTAMP
);

-- 알림/마케팅 메시지 테이블 (확장)
CREATE TABLE marketing_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  target VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  sent_at TIMESTAMP NOT NULL,
  recipients INT NOT NULL,
  open_rate DECIMAL(5,2) NOT NULL,
  -- 추가된 필드
  created_by VARCHAR(255) NOT NULL,
  created_by_name VARCHAR(255) NOT NULL,
  created_by_email VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admins(id)
);
```

### 클라이언트 (기존 구조 유지)

인증 세션은 기존과 동일하게 localStorage에 저장됩니다 (001-admin-auth 참조).

---

## Validation Rules Summary

| 필드 | 규칙 | 검증 위치 |
|------|------|----------|
| CreateAdminRequest.email | 유효한 이메일 형식, 시스템 내 고유 | 클라이언트 (React Hook Form), 서버 |
| CreateAdminRequest.password | 최소 8자 이상 | 클라이언트 (React Hook Form), 서버 |
| CreateAdminRequest.name | 비어있지 않음 | 클라이언트 (React Hook Form), 서버 |
| CreateAdminRequest.role | 유효한 AdminRole enum 값 | 클라이언트, 서버 |
| AdminListItem.lastLoginAt | ISO 8601 형식 또는 null | 서버 |
| MarketingMessage.createdBy | 유효한 관리자 ID | 서버 |
| MarketingMessage.createdByName | 비어있지 않음 | 서버 |

---

## 기존 엔티티와의 관계

### 관리자 계정 (001-admin-auth)

이 기능은 기존 관리자 계정 엔티티를 확장합니다:
- 기존 관리자 계정 구조 유지
- 하위 관리자 계정도 동일한 구조 사용
- 동일한 로그인 API 사용
- 동일한 인증 세션 구조 사용

### 인증 세션 (001-admin-auth)

생성된 하위 관리자 계정도 기존 인증 시스템을 사용합니다:
- 동일한 로그인 API 사용
- 동일한 토큰 구조
- 동일한 인증 세션 저장 방식

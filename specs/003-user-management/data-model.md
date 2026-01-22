# Data Model: 일반 사용자 관리

**Feature**: 일반 사용자 관리  
**Date**: 2025-01-27  
**Phase**: Phase 1 - Design

## Entities

### User (일반 사용자)

일반 사용자는 앱을 사용하는 최종 사용자를 나타냅니다. 카카오톡 소셜 로그인 또는 자체 로그인을 통해 회원가입할 수 있습니다.

#### Attributes

| 필드명 | 타입 | 설명 | 제약 조건 |
|--------|------|------|----------|
| `id` | string | 사용자 고유 식별자 | 필수, 읽기 전용 |
| `nickname` | string? | 사용자 닉네임 | 선택, 수정 가능 |
| `email` | string | 사용자 이메일 | 필수, 수정 가능, 이메일 형식 검증 |
| `phoneNumber` | string? | 사용자 전화번호 | 선택, 수정 가능, 전화번호 형식 검증 |
| `profileImg` | string? | 프로필 이미지 URL | 선택, 수정 가능, URL 형식 검증 |
| `isMarketingAgreed` | boolean | 마케팅 동의 여부 | 필수, 수정 가능, 기본값: false |
| `isPushAgreed` | boolean | 푸시 알림 동의 여부 | 필수, 수정 가능, 기본값: false |
| `status` | UserStatus | 사용자 상태 | 필수, 읽기 전용 (API로만 변경) |
| `createdAt` | string (ISO 8601) | 가입일시 | 필수, 읽기 전용 |
| `updatedAt` | string (ISO 8601) | 수정일시 | 필수, 읽기 전용 |

#### UserStatus Enum

사용자의 현재 상태를 나타냅니다.

| 값 | 설명 | 비고 |
|----|------|------|
| `ALL` | 모든 상태 (필터링용) | API 파라미터에서만 사용 |
| `ACTIVE` | 활성 상태 | 정상적으로 서비스를 이용 중 |
| `INACTIVE` | 비활성 상태 | 탈퇴 처리됨 (소프트 삭제) |
| `BLOCKED` | 차단 상태 | 관리자에 의해 차단됨 |

**상태 전이 규칙**:
- `ACTIVE` → `BLOCKED`: 차단 API 호출
- `BLOCKED` → `ACTIVE`: 차단 해제 API 호출
- `ACTIVE` 또는 `BLOCKED` → `INACTIVE`: 탈퇴 처리 API 호출
- `INACTIVE` → 다른 상태: 불가능 (탈퇴된 사용자는 복구 불가)

#### Validation Rules

**이메일 (email)**:
- 필수 필드
- 이메일 형식 검증 (RFC 5322 기본 규칙)
- 최대 길이: 255자
- 클라이언트 및 서버 양쪽에서 검증

**전화번호 (phoneNumber)**:
- 선택 필드
- 한국 전화번호 형식: `010-1234-5678` 또는 `01012345678`
- 최대 길이: 20자
- 클라이언트 및 서버 양쪽에서 검증

**닉네임 (nickname)**:
- 선택 필드
- 최대 길이: 50자
- 특수문자 제한 (XSS 방지)

**프로필 이미지 URL (profileImg)**:
- 선택 필드
- 유효한 URL 형식
- 최대 길이: 500자
- HTTPS URL 권장

**마케팅 동의 (isMarketingAgreed)**:
- 필수 필드
- boolean 타입
- 기본값: false

**푸시 알림 동의 (isPushAgreed)**:
- 필수 필드
- boolean 타입
- 기본값: false

## API Request/Response Models

### GetUsersParams (사용자 목록 조회 파라미터)

| 필드명 | 타입 | 설명 | 기본값 | 제약 조건 |
|--------|------|------|--------|----------|
| `search` | string? | 검색어 (닉네임/이메일) | - | 최대 100자 |
| `status` | UserStatus | 사용자 상태 필터 | `ALL` | `ALL`, `ACTIVE`, `INACTIVE` 중 하나 |
| `startDate` | string? | 가입 시작일 (YYYY-MM-DD) | - | ISO 8601 날짜 형식 |
| `endDate` | string? | 가입 종료일 (YYYY-MM-DD) | - | ISO 8601 날짜 형식, startDate 이후 |
| `limit` | number? | 페이지 크기 | 20 | 1 이상, 최대 100 |
| `offset` | number? | 페이지 오프셋 | 0 | 0 이상 |

### GetUsersResponse (사용자 목록 조회 응답)

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `users` | User[] | 사용자 목록 |
| `total` | number | 전체 사용자 수 |
| `limit` | number | 페이지 크기 |
| `offset` | number | 현재 페이지 오프셋 |

### UpdateUserRequest (사용자 정보 수정 요청)

| 필드명 | 타입 | 설명 | 제약 조건 |
|--------|------|------|----------|
| `nickname` | string? | 닉네임 | 최대 50자 |
| `email` | string? | 이메일 | 이메일 형식 검증 |
| `phoneNumber` | string? | 전화번호 | 전화번호 형식 검증 |
| `profileImg` | string? | 프로필 이미지 URL | URL 형식 검증 |
| `isMarketingAgreed` | boolean? | 마케팅 동의 여부 | - |
| `isPushAgreed` | boolean? | 푸시 알림 동의 여부 | - |

**참고**: 모든 필드는 선택 필드이며, 수정하려는 필드만 포함하면 됩니다.

### UpdateUserResponse (사용자 정보 수정 응답)

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `id` | string | 사용자 ID |
| `nickname` | string? | 닉네임 |
| `email` | string | 이메일 |
| `phoneNumber` | string? | 전화번호 |
| `profileImg` | string? | 프로필 이미지 URL |
| `isMarketingAgreed` | boolean | 마케팅 동의 여부 |
| `isPushAgreed` | boolean | 푸시 알림 동의 여부 |
| `message` | string? | 성공 메시지 |

## State Management

### Client-Side State

**UsersPage 컴포넌트 상태**:

```typescript
interface UsersPageState {
  // 검색 및 필터
  searchTerm: string;
  statusFilter: UserStatus;
  startDate: string | null;
  endDate: string | null;
  
  // 페이지네이션
  currentPage: number;
  pageSize: number;
  
  // 데이터
  users: User[];
  totalUsers: number;
  selectedUser: User | null;
  
  // UI 상태
  isLoading: boolean;
  isEditing: boolean;
  showUserDetail: boolean;
  openDropdown: number | null;
  
  // 에러 상태
  error: string | null;
}
```

### Server State

서버 상태는 API 응답을 통해 관리되며, 클라이언트는 다음을 수행합니다:
- API 호출 후 응답 데이터로 로컬 상태 업데이트
- Optimistic Update는 사용하지 않음 (중요한 데이터이므로)
- 작업 완료 후 목록 재조회로 서버 상태와 동기화

## Data Flow

### 사용자 목록 조회

1. 사용자가 검색어 입력 또는 필터 변경
2. 디바운싱 적용 (검색어의 경우)
3. API 호출: `GET /api/admin/users?{params}`
4. 응답 데이터로 상태 업데이트
5. UI에 목록 표시

### 사용자 정보 수정

1. 사용자가 상세 정보에서 편집 모드 진입
2. 폼 필드 수정
3. React Hook Form으로 유효성 검사
4. 저장 버튼 클릭
5. API 호출: `POST /api/admin/users/{id}`
6. 성공 시 목록 재조회
7. Toast 알림 표시

### 사용자 차단/해제/탈퇴

1. 사용자가 액션 메뉴에서 작업 선택
2. 확인 다이얼로그 표시
3. 확인 클릭
4. API 호출: `POST /api/admin/users/{id}/{action}`
5. 성공 시 목록 재조회
6. Toast 알림 표시

## Relationships

### User와 다른 엔티티의 관계

- **관리자 (Admin)**: 관리자가 사용자를 관리 (다대다 관계, 관리 작업을 통한 간접 관계)
- **인증 정보**: 사용자는 카카오톡 소셜 로그인 또는 자체 로그인을 통해 인증됨 (별도 엔티티로 관리)

## Constraints

1. **권한 제약**: 모든 사용자 관리 작업은 관리자 권한이 필요함
2. **상태 제약**: 탈퇴 처리된 사용자(INACTIVE)는 복구 불가
3. **동시성 제약**: 동시에 여러 관리자가 같은 사용자 정보를 수정할 수 있음 (마지막 수정이 우선)
4. **데이터 무결성**: 사용자 ID는 고유하며 변경 불가

## Indexes (백엔드 고려사항)

백엔드에서 다음 필드에 대한 인덱스가 필요할 수 있습니다:
- `id`: Primary Key
- `email`: Unique Index (이메일 중복 방지)
- `status`: Index (상태 필터링 성능)
- `createdAt`: Index (날짜 범위 필터링 성능)
- `nickname`, `email`: Full-text Search Index (검색 성능)

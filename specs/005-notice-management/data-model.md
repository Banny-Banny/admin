# Data Model: 공지사항 관리

**Feature**: 공지사항 관리 페이지  
**Date**: 2026-01-27  
**Phase**: Phase 1 - Design

## Entities

### 1. 공지사항 (Notice)

시스템에서 관리하는 공지사항 정보입니다.

**Attributes**:
- `id` (string, UUID, required): 공지사항 고유 식별자
- `title` (string, required): 공지사항 제목
- `content` (string, required): 공지사항 내용
- `imageUrl` (string, nullable): 이미지 URL
- `isPinned` (boolean, required): 고정 여부
- `isVisible` (boolean, required): 공개 여부
- `createdAt` (string, ISO 8601, required): 생성 일시
- `updatedAt` (string, ISO 8601, nullable): 수정 일시

**Validation Rules**:
- `title`: 비어있지 않아야 함
- `content`: 비어있지 않아야 함
- `isPinned`: boolean 값이어야 함
- `isVisible`: boolean 값이어야 함
- `imageUrl`: 유효한 URL 형식이어야 함 (nullable)

**State Transitions**:
- **생성**: 공지사항 등록 시 생성
- **수정**: 공지사항 정보 업데이트
- **삭제**: 공지사항 삭제 (Hard Delete)

**UI 필드 매핑**:
- `author`: API 응답에 없음, UI에서 현재 로그인한 관리자로 표시
- `views`: API 응답에 없음, UI에서 표시하지 않거나 0으로 초기화

---

### 2. 공지사항 목록 응답 (Notice List Response)

공지사항 목록 조회 API의 응답입니다.

**Attributes**:
- `success` (boolean, required): 요청 성공 여부
- `data` (NoticeListData, required): 공지사항 목록 데이터
  - `items` (NoticeListItem[], required): 공지사항 배열 (목록용 축약 정보)
  - `total` (number, required): 전체 공지사항 개수
  - `limit` (number, required): 페이지 크기
  - `offset` (number, required): 페이지 오프셋

**NoticeListItem** (목록 조회용 축약 정보):
- `id` (string, UUID, required)
- `title` (string, required)
- `imageUrl` (string, nullable)
- `isPinned` (boolean, required)
- `createdAt` (string, ISO 8601, required)

**Pagination**:
- `limit`: 기본값 20, 한 페이지에 표시할 공지사항 개수
- `offset`: 기본값 0, 시작 위치
- `total`: 전체 공지사항 개수 (검색 적용 후)

---

### 3. 공지사항 상세 응답 (Notice Detail Response)

공지사항 상세 조회 API의 응답입니다.

**Attributes**:
- `success` (boolean, required): 요청 성공 여부
- `data` (NoticeDetail, required): 공지사항 상세 정보
  - `id` (string, UUID, required)
  - `title` (string, required)
  - `content` (string, required)
  - `imageUrl` (string, nullable)
  - `isPinned` (boolean, required)
  - `createdAt` (string, ISO 8601, required)
  - `updatedAt` (string, ISO 8601, nullable)

---

### 4. 공지사항 등록 요청 (Create Notice Request)

공지사항 등록 API의 요청 데이터입니다.

**Attributes**:
- `title` (string, required): 공지사항 제목
- `content` (string, required): 공지사항 내용
- `imageUrl` (string, optional): 이미지 URL
- `isPinned` (boolean, optional): 고정 여부 (기본값: false)
- `isVisible` (boolean, optional): 공개 여부 (기본값: true)

**Validation Rules**:
- `title`: 비어있지 않아야 함
- `content`: 비어있지 않아야 함
- `isPinned`: boolean 값이어야 함
- `isVisible`: boolean 값이어야 함

**Response**:
- `success` (boolean, required)
- `data` (Notice, required): 생성된 공지사항 정보

---

### 5. 공지사항 수정 요청 (Update Notice Request)

공지사항 수정 API의 요청 데이터입니다.

**Attributes**:
- `title` (string, optional): 공지사항 제목
- `content` (string, optional): 공지사항 내용
- `imageUrl` (string, optional): 이미지 URL
- `isPinned` (boolean, optional): 고정 여부
- `isVisible` (boolean, optional): 공개 여부

**Note**: 모든 필드가 optional이므로 부분 업데이트 가능

**Response**:
- HTTP 200: 성공

---

### 6. 공지사항 목록 조회 파라미터 (Get Notices Params)

공지사항 목록 조회 API의 쿼리 파라미터입니다.

**Attributes**:
- `search` (string, optional): 검색 키워드 (제목/본문)
- `limit` (number, optional): 페이지 크기 (기본값: 20)
- `offset` (number, optional): 페이지 오프셋 (기본값: 0)

---

## Data Flow

### 공지사항 목록 조회 플로우

```
1. 사용자가 공지사항 관리 페이지 접근
2. GET /api/notices?search=...&limit=20&offset=0 요청
3. 백엔드에서 검색 및 페이지네이션 처리
4. NoticeListResponse 수신
5. UI에 공지사항 목록 표시 (고정 공지사항 상단 배치)
```

### 공지사항 상세 조회 플로우

```
1. 사용자가 공지사항 목록에서 특정 공지사항 클릭
2. GET /api/notices/{id} 요청
3. 백엔드에서 공지사항 상세 정보 조회
4. NoticeDetailResponse 수신
5. UI에 공지사항 상세 정보 표시
```

### 공지사항 등록 플로우

```
1. 사용자가 공지사항 작성 폼 작성
2. CreateNoticeRequest 생성 및 검증
3. POST /api/admin/notices 요청 (토큰 포함)
4. 백엔드에서 공지사항 생성
5. 성공 응답 수신
6. 공지사항 목록 새로고침 또는 새 공지사항 추가
```

### 공지사항 수정 플로우

```
1. 사용자가 공지사항 상세 정보에서 수정 버튼 클릭
2. 수정 폼에 기존 데이터 로드
3. 사용자가 정보 수정
4. UpdateNoticeRequest 생성
5. PATCH /api/admin/notices/{id} 요청 (토큰 포함)
6. 백엔드에서 공지사항 정보 업데이트
7. 성공 응답 수신
8. 공지사항 목록 및 상세 정보 업데이트
```

### 공지사항 삭제 플로우

```
1. 사용자가 공지사항 상세 정보에서 삭제 버튼 클릭
2. 삭제 확인 다이얼로그 표시
3. 사용자가 확인 클릭
4. DELETE /api/admin/notices/{id} 요청 (토큰 포함)
5. 백엔드에서 공지사항 삭제
6. 성공 응답 수신
7. 공지사항 목록에서 제거
```

---

## TypeScript Interfaces

```typescript
// 공지사항 엔티티 (상세 조회용)
export interface Notice {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  isPinned: boolean;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string | null;
}

// 공지사항 목록 항목 (목록 조회용 축약 정보)
export interface NoticeListItem {
  id: string;
  title: string;
  imageUrl: string | null;
  isPinned: boolean;
  createdAt: string;
}

// 공지사항 목록 응답
export interface NoticeListResponse {
  success: boolean;
  data: {
    items: NoticeListItem[];
    total: number;
    limit: number;
    offset: number;
  };
}

// 공지사항 상세 응답
export interface NoticeDetailResponse {
  success: boolean;
  data: Notice;
}

// 공지사항 등록 요청
export interface CreateNoticeRequest {
  title: string;
  content: string;
  imageUrl?: string;
  isPinned?: boolean;
  isVisible?: boolean;
}

// 공지사항 등록 응답
export interface CreateNoticeResponse {
  success: boolean;
  data: Notice;
}

// 공지사항 수정 요청
export interface UpdateNoticeRequest {
  title?: string;
  content?: string;
  imageUrl?: string;
  isPinned?: boolean;
  isVisible?: boolean;
}

// 공지사항 목록 조회 파라미터
export interface GetNoticesParams {
  search?: string;
  limit?: number;
  offset?: number;
}
```

---

## API 응답 형식

### 성공 응답 (공통)
```typescript
{
  success: true,
  data: T  // T는 응답 데이터 타입
}
```

### 에러 응답
```typescript
{
  success: false,
  error?: string,
  message?: string
}
```

### HTTP 상태 코드
- `200`: 성공
- `400`: 잘못된 요청 (검증 실패 등)
- `401`: 인증 실패 (토큰 만료 등) - 관리자 API만 해당
- `404`: 공지사항을 찾을 수 없음
- `500`: 서버 오류

---

## Validation Rules Summary

| 필드 | 규칙 | 검증 위치 |
|------|------|----------|
| title | 비어있지 않음 | 클라이언트, 서버 |
| content | 비어있지 않음 | 클라이언트, 서버 |
| isPinned | boolean 값 | 클라이언트, 서버 |
| isVisible | boolean 값 | 클라이언트, 서버 |
| imageUrl | 유효한 URL 형식 (nullable) | 서버 |
| search | 문자열 (특수문자 허용) | 서버 |
| limit | 양수 (기본값: 20) | 서버 |
| offset | 0 이상 (기본값: 0) | 서버 |

---

## UI 필드 처리

### API에 없는 필드

1. **author** (작성자)
   - API 응답에 없음
   - UI에서 현재 로그인한 관리자 정보로 표시
   - 또는 표시하지 않음

2. **views** (조회수)
   - API 응답에 없음
   - UI에서 표시하지 않거나 0으로 초기화

### API에 있는 필드

1. **imageUrl** (이미지 URL)
   - API 응답에 포함됨
   - UI에서 이미지 표시에 사용

2. **isVisible** (공개 여부)
   - API 응답에 포함됨
   - UI에서 공개/비공개 상태 표시에 사용

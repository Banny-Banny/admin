# Research: 공지사항 관리 페이지

**Feature**: 공지사항 관리 페이지  
**Date**: 2026-01-27  
**Phase**: Phase 0 - Research

## Research Questions

### 1. API 클라이언트 구조

**Question**: 공지사항 관리 API를 어떻게 구조화할 것인가?

**Decision**: 기존 inquiry API 구조를 따라 `src/app/commons/apis/notice/` 폴더에 `http.ts`와 `index.ts`를 생성

**Rationale**:
- 기존 `src/app/commons/apis/inquiry/http.ts` 구조와 일관성 유지
- 기존 `apiClient` 클래스 재사용 (토큰 인터셉터 포함)
- 타입 안정성을 위한 TypeScript 인터페이스 정의

**Alternatives considered**:
- **별도 API 클라이언트 생성**: 불필요한 중복 코드
- **admin 폴더에 통합**: 공지사항 관리가 독립적인 도메인이므로 분리하는 것이 적절

**Implementation Pattern**:
```typescript
// http.ts: API 함수 및 타입 정의
// index.ts: 외부 export
```

---

### 2. API 응답 형식 처리

**Question**: API 응답이 `{ success: boolean, data: {...} }` 형식일 때 어떻게 처리할 것인가?

**Decision**: 기존 `apiClient`의 응답 처리 방식 활용, 필요시 래퍼 함수 추가

**Rationale**:
- 기존 `apiClient.get<T>()`, `apiClient.post<T>()` 등이 이미 응답 데이터를 반환
- `success` 필드는 백엔드에서 검증하므로 클라이언트에서는 `data` 필드만 사용
- 에러는 Axios 인터셉터에서 처리

**Alternatives considered**:
- **응답 래퍼 함수**: 불필요한 추상화
- **직접 axios 사용**: 기존 구조와 불일치

**Implementation Strategy**:
1. `apiClient.get<T>()`는 이미 `response.data`를 반환
2. 백엔드 응답이 `{ success: true, data: T }` 형식이면, `apiClient.get<{ success: boolean, data: T }>()`로 타입 지정
3. 실제 사용 시 `response.data`로 접근

---

### 3. 공지사항 타입 정의

**Question**: 공지사항 엔티티의 TypeScript 타입을 어떻게 정의할 것인가?

**Decision**: API 응답 형식에 맞춰 타입 정의, `src/app/commons/types/notice.ts`에 생성

**Rationale**:
- API 응답 형식이 이미 제공됨
- 기존 `src/app/commons/types/inquiry.ts` 패턴 참고
- 컴포넌트와 API 클라이언트에서 공유 사용

**Type Structure**:
```typescript
// Notice: API 응답의 data 필드 구조
// NoticeListResponse: GET /api/notices 응답
// NoticeDetailResponse: GET /api/notices/{id} 응답
// CreateNoticeRequest: POST /api/admin/notices 요청
// UpdateNoticeRequest: PATCH /api/admin/notices/{id} 요청
```

**API 필드와 UI 필드 차이**:
- API 응답에 없는 필드: `author`, `views`
- API 응답에 있는 필드: `imageUrl`, `isVisible`
- UI에서 `author`는 현재 로그인한 관리자로 표시
- UI에서 `views`는 0으로 초기화하거나 표시하지 않음

---

### 4. 검색 기능 구현

**Question**: 검색어를 어떻게 API에 전달할 것인가?

**Decision**: Query 파라미터로 전달, 기존 ReportsPage 컴포넌트의 로컬 필터링을 API 필터링으로 변경

**Rationale**:
- API가 이미 `search` 파라미터 지원 (제목/본문 검색)
- 페이지네이션도 API에서 처리 (`limit`, `offset`)
- 클라이언트 사이드 필터링은 대량 데이터에서 비효율적

**API Parameters**:
- `search`: 검색 키워드 (제목/본문)
- `limit`: 페이지 크기 (기본값: 20)
- `offset`: 페이지 오프셋 (기본값: 0)

---

### 5. 로딩 상태 및 에러 처리

**Question**: API 요청 중 로딩 상태와 에러를 어떻게 처리할 것인가?

**Decision**: React 상태로 로딩/에러 관리, Toast 알림 (sonner) 사용

**Rationale**:
- 기존 컴포넌트에서 이미 사용 중인 패턴
- `useState`로 로딩 상태 관리
- `apiClient`의 에러 인터셉터가 이미 토큰 만료 시 로그인 페이지 리다이렉트 처리
- 네트워크 오류는 Toast로 사용자에게 알림

**Implementation Pattern**:
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

try {
  setLoading(true);
  const notices = await getNotices(params);
  // 성공 처리
} catch (err) {
  setError(err.message);
  toast.error('공지사항 목록을 불러오는데 실패했습니다');
} finally {
  setLoading(false);
}
```

---

### 6. 기존 컴포넌트 수정 전략

**Question**: 기존 ReportsPage 컴포넌트를 어떻게 수정할 것인가?

**Decision**: 기존 컴포넌트 구조 유지, 하드코딩된 데이터를 API 호출로 교체

**Rationale**:
- 기존 UI 구조와 스타일 유지
- `useState`로 관리하던 로컬 데이터를 API 데이터로 교체
- 폼 제출 시 API 호출 추가
- 목록 조회 시 API 호출 추가

**Modification Points**:
1. `ReportsPage`: 공지사항 등록 API 호출 추가
2. `ReportsPage`: 공지사항 목록 조회 API 호출 추가, 검색을 API 파라미터로 전달
3. 공지사항 수정/삭제 기능 추가 (현재 UI에 있음)

---

### 7. E2E 테스트 구조

**Question**: E2E 테스트를 어떻게 작성할 것인가?

**Decision**: 기존 `src/app/tests/api-tests/product-test/` 구조를 따라 `notice-test/` 폴더 생성

**Rationale**:
- 기존 테스트 구조와 일관성 유지
- Playwright를 사용한 API 통신 테스트
- 인증 토큰을 사용한 테스트 시나리오

**Test Structure**:
```typescript
// notice-api.spec.ts
// - GET /api/notices 테스트
// - GET /api/notices/{id} 테스트
// - POST /api/admin/notices 테스트
// - PATCH /api/admin/notices/{id} 테스트 (POST 데이터 존재 시)
// - DELETE /api/admin/notices/{id} 테스트 (POST 데이터 존재 시)
```

**테스트 전제 조건**:
- PATCH와 DELETE 테스트는 POST로 생성한 데이터가 있을 경우에만 진행
- 테스트 데이터 정리 필요

---

### 8. 인증 처리

**Question**: 공개 API와 관리자 API의 인증을 어떻게 처리할 것인가?

**Decision**: 관리자 API(POST, PATCH, DELETE)는 토큰 필요, 공개 API(GET)는 토큰 불필요

**Rationale**:
- GET /api/notices와 GET /api/notices/{id}는 공개 API로 인증 불필요
- POST, PATCH, DELETE는 관리자 전용 API로 토큰 필요
- 기존 `apiClient`는 토큰이 없어도 요청 가능하도록 구현되어 있음

**Implementation Strategy**:
- 공개 API 호출 시 토큰 없이 요청
- 관리자 API 호출 시 토큰 자동 포함 (apiClient 인터셉터)
- 토큰 만료 시 자동 로그인 페이지 리다이렉트

---

## 기술 스택 요약

| 항목 | 선택된 기술 | 이유 |
|------|------------|------|
| API 클라이언트 | Axios (기존 apiClient) | 기존 구조 활용, 토큰 인터셉터 포함 |
| 타입 정의 | TypeScript | 타입 안정성, API 응답 형식 반영 |
| 상태 관리 | React useState | 간단한 상태 관리, 추가 의존성 없음 |
| 에러 알림 | Sonner (Toast) | 이미 설치됨, 사용자 친화적 |
| 로딩 표시 | 로딩 스피너 | 사용자 경험 향상 |
| 테스트 | Playwright | 기존 E2E 테스트 구조 활용 |

## API 응답 형식

### 성공 응답
```typescript
{
  success: true,
  data: {
    // 단일 공지사항 또는 공지사항 목록
  }
}
```

### 리스트 응답
```typescript
{
  success: true,
  data: {
    items: Notice[],
    total: number,
    limit: number,
    offset: number
  }
}
```

### 에러 응답
- HTTP 401: 인증 실패 (토큰 만료 등)
- HTTP 400: 잘못된 요청
- HTTP 404: 공지사항을 찾을 수 없음
- HTTP 500: 서버 오류

## 보안 고려사항

1. **토큰 기반 인증**: 관리자 API 요청에 Bearer 토큰 포함
2. **토큰 만료 처리**: 401 응답 시 자동 로그인 페이지 리다이렉트
3. **입력 검증**: 클라이언트 사이드 검증 + 서버 사이드 검증
4. **에러 메시지**: 민감한 정보 노출 방지

## 성능 고려사항

1. **페이지네이션**: 대량 데이터를 효율적으로 처리
2. **로딩 상태**: 사용자 경험을 위한 로딩 인디케이터
3. **검색 디바운싱**: 검색어 입력 시 API 호출 최적화 (필요시)
4. **캐싱**: 공지사항 목록 캐싱 고려 (선택적)

## 다음 단계

Phase 1에서 다음을 구현:
1. data-model.md: 공지사항 엔티티 및 API 요청/응답 타입 정의
2. contracts/: OpenAPI 스펙 문서화
3. quickstart.md: 개발자 가이드

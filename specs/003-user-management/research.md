# Research: 일반 사용자 관리 기능

**Feature**: 일반 사용자 관리  
**Date**: 2025-01-27  
**Phase**: Phase 0 - Research

## Research Questions

### 1. 사용자 목록 조회 API 설계

**Question**: 사용자 목록을 어떻게 조회하고 필터링할 것인가?

**Decision**: RESTful API 패턴 사용, GET 엔드포인트에 쿼리 파라미터로 검색, 필터링, 페이지네이션 지원

**Rationale**:
- 백엔드에서 이미 제공하는 API 구조 활용
- 검색어(닉네임/이메일), 상태 필터(ALL, ACTIVE, INACTIVE), 날짜 범위 필터, 페이지네이션(limit, offset) 지원
- 기존 관리자 API 구조와 일관성 유지
- 효율적인 서버 사이드 필터링 및 페이지네이션

**API 구조**:
```
GET /api/admin/users?search={search}&status={status}&startDate={startDate}&endDate={endDate}&limit={limit}&offset={offset}
Headers: Authorization: Bearer {accessToken}
Response: {
  users: Array<User>,
  total: number,
  limit: number,
  offset: number
}
```

**Alternatives considered**:
- **클라이언트 사이드 필터링**: 대량 데이터 처리 시 성능 저하
- **GraphQL**: 기존 REST API 구조와 불일치

---

### 2. 사용자 상세 정보 조회 API 설계

**Question**: 사용자 상세 정보를 어떻게 조회할 것인가?

**Decision**: GET 엔드포인트로 사용자 ID를 경로 파라미터로 받아 상세 정보 조회

**Rationale**:
- RESTful API 표준 패턴
- 간단하고 직관적인 구조
- 기존 API 구조와 일관성

**API 구조**:
```
GET /api/admin/users/{id}
Headers: Authorization: Bearer {accessToken}
Response: {
  id: string,
  nickname: string,
  email: string,
  phoneNumber: string,
  profileImg: string,
  isMarketingAgreed: boolean,
  isPushAgreed: boolean,
  status: UserStatus,
  createdAt: string,
  updatedAt: string
}
```

**Alternatives considered**:
- **목록 API에 상세 정보 포함**: 불필요한 데이터 전송
- **GraphQL**: 기존 구조와 불일치

---

### 3. 사용자 정보 수정 API 설계

**Question**: 사용자 정보를 어떻게 수정할 것인가?

**Decision**: POST 엔드포인트로 사용자 ID를 경로 파라미터로 받고, 수정할 필드만 요청 본문에 포함

**Rationale**:
- 백엔드 API 스펙에 따라 POST 메서드 사용
- 부분 업데이트 지원 (PATCH와 유사하지만 POST 사용)
- 필수 필드와 선택 필드 구분
- 유효성 검사는 백엔드에서 수행

**API 구조**:
```
POST /api/admin/users/{id}
Headers: Authorization: Bearer {accessToken}
Body: {
  nickname?: string,
  email?: string,
  phoneNumber?: string,
  profileImg?: string,
  isMarketingAgreed?: boolean,
  isPushAgreed?: boolean
}
Response: {
  id: string,
  nickname: string,
  email: string,
  phoneNumber: string,
  profileImg: string,
  isMarketingAgreed: boolean,
  isPushAgreed: boolean,
  message?: string
}
```

**Alternatives considered**:
- **PUT 메서드**: 전체 리소스 교체 방식, 부분 업데이트에 부적합
- **PATCH 메서드**: 백엔드 API 스펙과 불일치

---

### 4. 사용자 차단/해제 API 설계

**Question**: 사용자 차단 및 해제를 어떻게 처리할 것인가?

**Decision**: POST 엔드포인트로 사용자 ID를 경로 파라미터로 받아 차단/해제 처리

**Rationale**:
- RESTful 리소스 액션 패턴
- 명확한 엔드포인트 구분 (/block, /unblock)
- 백엔드 API 스펙과 일치
- 상태 변경 작업이므로 POST 메서드 사용

**API 구조**:
```
POST /api/admin/users/{id}/block
Headers: Authorization: Bearer {accessToken}
Response: 201 Created

POST /api/admin/users/{id}/unblock
Headers: Authorization: Bearer {accessToken}
Response: 201 Created
```

**Alternatives considered**:
- **PUT /api/admin/users/{id}?action=block**: 쿼리 파라미터 방식, 덜 직관적
- **PATCH /api/admin/users/{id}**: 상태 필드만 변경, 하지만 별도 엔드포인트가 더 명확

---

### 5. 사용자 탈퇴 처리 API 설계

**Question**: 사용자 탈퇴를 어떻게 처리할 것인가?

**Decision**: POST 엔드포인트로 사용자 ID를 경로 파라미터로 받아 소프트 삭제 처리

**Rationale**:
- 소프트 삭제 방식으로 데이터 보존
- 백엔드 API 스펙에 따라 /deactivate 엔드포인트 사용
- 상태를 INACTIVE로 변경
- 명확한 액션 표현

**API 구조**:
```
POST /api/admin/users/{id}/deactivate
Headers: Authorization: Bearer {accessToken}
Response: 201 Created
```

**Alternatives considered**:
- **DELETE /api/admin/users/{id}**: 하드 삭제, 데이터 손실 위험
- **PATCH /api/admin/users/{id}**: 상태 변경만으로는 탈퇴 처리의 의미가 불명확

---

### 6. 사용자 목록 UI 컴포넌트 구조

**Question**: 사용자 목록을 어떻게 표시하고 상호작용할 것인가?

**Decision**: 기존 UsersPage 컴포넌트에 일반 사용자 목록 섹션 추가, 테이블 형태로 표시

**Rationale**:
- 기존 관리자 목록과 유사한 UI 패턴 유지
- 테이블 형태로 많은 정보를 효율적으로 표시
- 검색, 필터, 페이지네이션 UI는 기존 패턴 활용
- 상세 정보는 모달 또는 드로어로 표시

**UI 구조**:
- 검색 입력 필드 (닉네임/이메일)
- 상태 필터 드롭다운 (ALL, ACTIVE, INACTIVE)
- 날짜 범위 필터 (시작일, 종료일)
- 사용자 목록 테이블
- 페이지네이션 컨트롤
- 각 행에 액션 메뉴 (상세 보기, 수정, 차단/해제, 탈퇴)

**Alternatives considered**:
- **카드 형태**: 테이블보다 많은 공간 필요
- **별도 페이지**: 기존 UsersPage와 분리, 하지만 관련 기능이므로 같은 페이지가 적절

---

### 7. 사용자 정보 수정 UI 설계

**Question**: 사용자 정보를 어떻게 수정할 것인가?

**Decision**: 모달 또는 드로어를 사용하여 인라인 편집 또는 별도 폼으로 수정

**Rationale**:
- 기존 관리자 생성 폼과 유사한 패턴
- React Hook Form을 사용하여 폼 관리 및 검증
- 실시간 유효성 검사
- 저장 후 목록 자동 새로고침

**UI 구조**:
- 사용자 상세 정보 모달/드로어
- 편집 모드 전환 버튼
- 폼 필드 (닉네임, 이메일, 전화번호, 프로필 이미지 URL, 마케팅 동의, 푸시 알림 동의)
- 저장/취소 버튼
- 유효성 검사 오류 메시지 표시

**Alternatives considered**:
- **인라인 편집**: 테이블 내 직접 수정, 복잡도 증가
- **별도 페이지**: 모달보다 더 많은 공간 필요하지만 불필요

---

### 8. 사용자 차단/해제/탈퇴 처리 UI 설계

**Question**: 사용자 차단, 해제, 탈퇴 처리를 어떻게 UI로 표현할 것인가?

**Decision**: 확인 다이얼로그를 사용하여 중요한 작업임을 명확히 하고, 성공/실패 알림 제공

**Rationale**:
- 중요한 작업이므로 확인 다이얼로그 필수
- 사용자 실수 방지
- 작업 완료 후 즉시 피드백 제공
- 목록 자동 새로고침으로 변경사항 반영

**UI 구조**:
- 각 사용자 행에 액션 메뉴 (드롭다운)
- 차단/해제/탈퇴 버튼 클릭 시 확인 다이얼로그 표시
- 확인 다이얼로그에서 작업 설명 및 확인/취소 버튼
- 작업 완료 시 Toast 알림 (Sonner 사용)
- 목록 자동 새로고침

**Alternatives considered**:
- **즉시 실행**: 사용자 실수 위험
- **별도 페이지**: 불필요한 복잡도

---

### 9. 에러 처리 및 사용자 피드백

**Question**: API 오류 및 네트워크 오류를 어떻게 처리할 것인가?

**Decision**: Toast 알림(Sonner)을 사용하여 에러 메시지 표시, 로딩 상태 표시

**Rationale**:
- 기존 프로젝트에서 Sonner 사용 중
- 사용자 친화적인 피드백
- 로딩 상태로 사용자 대기 시간 명확히 표시
- 네트워크 오류 시 재시도 옵션 제공

**Error Types**:
- **네트워크 오류**: Toast 알림 + 재시도 옵션
- **권한 오류 (401)**: 자동 토큰 갱신 또는 로그인 페이지로 리다이렉트
- **유효성 검사 오류**: 폼 필드에 인라인 에러 메시지
- **서버 오류 (500)**: Toast 알림 + 오류 메시지

**Alternatives considered**:
- **Alert만**: 침투적이고 사용자 경험 저하
- **콘솔 로그만**: 사용자가 에러를 인지하기 어려움

---

### 10. 페이지네이션 처리

**Question**: 사용자 목록 페이지네이션을 어떻게 처리할 것인가?

**Decision**: 서버 사이드 페이지네이션 사용, limit과 offset 파라미터로 제어

**Rationale**:
- 대량 데이터 처리 시 효율적
- 백엔드 API에서 지원
- 클라이언트 메모리 사용 최소화
- 응답 시간 최적화

**구현**:
- 기본 limit: 20
- offset 기반 페이지네이션
- 총 개수(total)를 받아 전체 페이지 수 계산
- 이전/다음 페이지 버튼 또는 페이지 번호 표시

**Alternatives considered**:
- **커서 기반 페이지네이션**: 구현 복잡도 증가, offset 방식으로 충분
- **클라이언트 사이드 페이지네이션**: 대량 데이터 처리 시 성능 저하

---

### 11. 검색 및 필터링 최적화

**Question**: 검색어 입력과 필터 변경 시 API 호출을 어떻게 최적화할 것인가?

**Decision**: 디바운싱을 사용하여 연속된 입력 시 마지막 입력 후 일정 시간 후에만 API 호출

**Rationale**:
- 불필요한 API 호출 방지
- 서버 부하 감소
- 사용자 경험 향상 (너무 빈번한 로딩 방지)
- 검색어 입력 중에는 즉시 호출하지 않음

**구현**:
- 검색어 입력: 500ms 디바운스
- 필터 변경: 즉시 API 호출 (사용자 의도가 명확)
- 날짜 범위 변경: 즉시 API 호출

**Alternatives considered**:
- **즉시 호출**: 검색어 입력 시 너무 빈번한 호출
- **수동 검색 버튼**: 추가 클릭 필요, 사용자 경험 저하

---

### 12. 사용자 상태 표시

**Question**: 사용자 상태(ACTIVE, INACTIVE, BLOCKED)를 어떻게 UI에 표시할 것인가?

**Decision**: 배지(Badge) 컴포넌트를 사용하여 상태별 색상으로 구분 표시

**Rationale**:
- 시각적으로 명확한 구분
- 기존 Radix UI Badge 컴포넌트 활용
- 상태별 색상 코딩 (ACTIVE: 초록, INACTIVE: 회색, BLOCKED: 빨강)

**구현**:
- 테이블의 상태 컬럼에 Badge 표시
- 상태별 텍스트: "활성", "비활성", "차단"
- 상태별 색상: 초록, 회색, 빨강

**Alternatives considered**:
- **텍스트만**: 시각적 구분이 어려움
- **아이콘만**: 텍스트가 더 명확

---

## 기술 스택 요약

| 항목 | 선택된 기술 | 이유 |
|------|------------|------|
| API 패턴 | RESTful (기존) | 기존 구조와 일관성, 백엔드 API 스펙 준수 |
| 상태 관리 | React State + Context (기존) | 기존 인증 시스템 활용 |
| 폼 관리 | React Hook Form (기존) | 이미 설치됨, 검증 용이 |
| 에러 알림 | Sonner (Toast, 기존) | 이미 설치됨, 사용자 친화적 |
| API 클라이언트 | Axios (기존) | 기존 구조 활용 |
| UI 컴포넌트 | Radix UI (기존) | 기존 컴포넌트 라이브러리 활용 |
| 페이지네이션 | 서버 사이드 (limit/offset) | 효율적인 대량 데이터 처리 |

## 보안 고려사항

1. **관리자 권한 검증**: 모든 API 요청 시 백엔드에서 필수 검증
2. **입력값 검증**: XSS 및 SQL injection 방지를 위한 클라이언트/서버 양쪽 검증
3. **토큰 관리**: 기존 토큰 관리 시스템 활용, 자동 갱신
4. **HTTPS 사용**: 프로덕션 환경에서 필수
5. **민감 정보 보호**: 사용자 정보 수정 시 적절한 권한 검증

## 성능 고려사항

1. **서버 사이드 필터링**: 검색 및 필터링은 서버에서 처리
2. **페이지네이션**: 대량 데이터를 효율적으로 처리
3. **디바운싱**: 검색어 입력 시 불필요한 API 호출 방지
4. **로딩 상태**: 사용자에게 명확한 피드백 제공
5. **Optimistic Update**: 가능한 경우 즉시 UI 업데이트 후 서버 동기화

## API 엔드포인트 요약

| 메서드 | 엔드포인트 | 용도 |
|--------|----------|------|
| GET | `/api/admin/users` | 사용자 목록 조회 (검색, 필터링, 페이지네이션) |
| GET | `/api/admin/users/{id}` | 사용자 상세 정보 조회 |
| POST | `/api/admin/users/{id}` | 사용자 정보 수정 |
| POST | `/api/admin/users/{id}/block` | 사용자 차단 |
| POST | `/api/admin/users/{id}/unblock` | 사용자 차단 해제 |
| POST | `/api/admin/users/{id}/deactivate` | 사용자 탈퇴 처리 (소프트 삭제) |

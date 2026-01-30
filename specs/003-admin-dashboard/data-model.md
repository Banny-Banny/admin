# Data Model: 관리자 대시보드 조회 및 차트 시각화

**Feature**: 관리자 대시보드 조회 및 차트 시각화  
**Date**: 2026-01-21

## Entities

### 1. 대시보드 요약 지표 (DashboardSummary)

**설명**: 서비스의 핵심 지표 집합을 나타내는 엔티티입니다. 관리자가 대시보드에 접속했을 때 즉시 확인할 수 있는 전체 현황 정보를 포함합니다.

**필드**:
- `totalUsers` (number): 총 사용자 수
- `activeUsers` (number): 활성 사용자 수
- `totalOrders` (number): 총 주문 수
- `totalRevenue` (number): 총 매출액

**Validation Rules**:
- 모든 필드는 필수이며, 0 이상의 숫자여야 합니다
- `activeUsers`는 `totalUsers`보다 작거나 같아야 합니다

**State**: 읽기 전용 (백엔드에서 계산되어 제공)

**Relationships**: 없음 (독립적인 집계 데이터)

---

### 2. 차트 데이터 (DashboardCharts)

**설명**: 특정 기간 동안의 서비스 지표 데이터를 나타내는 엔티티입니다. 시간에 따른 변화 추이를 시각화하기 위한 데이터 포인트와 레이블 정보를 포함합니다.

**필드**:
- `labels` (string[]): 차트의 X축 레이블 (날짜 또는 시간)
- `data` (number[]): 차트의 Y축 데이터 값

**Validation Rules**:
- `labels`와 `data` 배열의 길이는 동일해야 합니다
- `data` 배열의 모든 값은 0 이상의 숫자여야 합니다
- 빈 배열도 유효합니다 (데이터가 없는 경우)

**State**: 읽기 전용 (백엔드에서 집계되어 제공)

**Relationships**: 
- 기간 필터와 관련 (period, startDate, endDate 파라미터로 생성)

**Query Parameters**:
- `period` ('day' | 'week' | 'month'): 집계 기간 단위 (기본값: 'day')
- `startDate` (string, optional): 시작 날짜 (ISO 8601 형식)
- `endDate` (string, optional): 종료 날짜 (ISO 8601 형식)

---

### 3. 사용자 추이 데이터 (UserTrends)

**설명**: 특정 기간 동안의 사용자 가입 및 탈퇴 추이를 나타내는 엔티티입니다. 시간에 따른 사용자 변화를 분석하기 위한 데이터를 포함합니다.

**필드**:
- `dates` (string[]): 날짜 배열 (ISO 8601 형식)
- `signups` (number[]): 날짜별 가입 사용자 수
- `withdrawals` (number[]): 날짜별 탈퇴 사용자 수

**Validation Rules**:
- `dates`, `signups`, `withdrawals` 배열의 길이는 모두 동일해야 합니다
- `signups`와 `withdrawals` 배열의 모든 값은 0 이상의 숫자여야 합니다
- 빈 배열도 유효합니다 (데이터가 없는 경우)

**State**: 읽기 전용 (백엔드에서 집계되어 제공)

**Relationships**: 
- 기간 파라미터와 관련 (period 파라미터로 생성)

**Query Parameters**:
- `period` ('90d'): 조회 기간 (기본값: '90d', 최근 90일)

---

### 4. 기간 필터 (PeriodFilter)

**설명**: 데이터 조회에 사용되는 시간 범위 설정을 나타내는 엔티티입니다.

**필드**:
- `period` ('day' | 'week' | 'month'): 기간 타입
- `startDate` (string, optional): 시작일 (ISO 8601 형식, YYYY-MM-DD)
- `endDate` (string, optional): 종료일 (ISO 8601 형식, YYYY-MM-DD)

**Validation Rules**:
- `period`가 지정되면 `startDate`와 `endDate`는 선택사항
- `startDate`와 `endDate`가 모두 지정되면 `startDate`는 `endDate`보다 이전이어야 합니다
- 날짜 형식은 ISO 8601 (YYYY-MM-DD)를 따라야 합니다

**State**: 사용자 입력으로 생성 및 변경 가능

**Relationships**: 
- DashboardCharts 생성에 사용

---

## Data Flow

### 1. 대시보드 요약 지표 조회
```
사용자 액션: 대시보드 페이지 접속
  ↓
API 호출: GET /api/admin/dashboard/summary
  ↓
응답: DashboardSummary 엔티티
  ↓
UI 표시: 요약 지표 카드들
```

### 2. 기간별 차트 데이터 조회
```
사용자 액션: 기간 선택 (일/주/월) 또는 날짜 범위 선택
  ↓
PeriodFilter 엔티티 생성
  ↓
API 호출: GET /api/admin/dashboard/charts?period=...&startDate=...&endDate=...
  ↓
응답: DashboardCharts 엔티티
  ↓
UI 표시: 차트 시각화
```

### 3. 사용자 추이 데이터 조회
```
사용자 액션: 사용자 추이 차트 조회
  ↓
API 호출: GET /api/admin/dashboard/user-trends?period=90d
  ↓
응답: UserTrends 엔티티
  ↓
UI 표시: 라인 차트 (가입/탈퇴 2개 라인)
```

---

## Edge Cases

1. **빈 데이터 처리**: 모든 엔티티에서 빈 배열이나 0 값은 유효한 응답입니다. UI에서 적절한 빈 상태 메시지를 표시해야 합니다.

2. **날짜 범위 검증**: `startDate`가 `endDate`보다 이후인 경우 백엔드에서 에러를 반환하거나 자동으로 교정할 수 있습니다.

3. **음수 값 처리**: `signups`나 `withdrawals`에 음수 값이 포함될 수 있는 경우(데이터 수정 등), 차트에서 0으로 클리핑하거나 별도 표시가 필요할 수 있습니다.

4. **데이터 불일치**: `labels`와 `data` 배열 길이가 다른 경우는 에러로 처리해야 합니다.

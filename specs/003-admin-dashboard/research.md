# Research: 관리자 대시보드 조회 및 차트 시각화

**Feature**: 관리자 대시보드 조회 및 차트 시각화  
**Date**: 2026-01-21  
**Status**: Complete

## Research Questions

### 1. React Query 도입 필요성 및 통합 방법

**Decision**: React Query (TanStack Query) 도입

**Rationale**: 
- 서버 상태 관리의 표준 라이브러리로, 캐싱, 자동 재요청, 로딩/에러 상태 관리 등 기능 제공
- Axios와 함께 사용 시 API 호출 코드를 간결하게 만들고, 여러 컴포넌트에서 동일 데이터 공유 시 중복 요청 방지
- 대시보드처럼 주기적 업데이트가 필요한 데이터에 적합
- 기존 Axios 기반 API 클라이언트와 완벽 호환

**Alternatives considered**:
- **SWR**: Next.js 생태계와 잘 맞지만, React Query가 더 많은 기능 제공 및 더 큰 커뮤니티
- **상태 관리 라이브러리 직접 구현**: 복잡도 증가 및 유지보수 어려움

**Integration Plan**:
- `@tanstack/react-query` 패키지 설치
- `QueryClientProvider`를 앱 루트에 추가 (기존 ApiProvider와 함께)
- 커스텀 훅 패턴 사용 (`useDashboardSummary`, `useDashboardCharts`, `useUserTrends`)

---

### 2. 차트 라이브러리 선택: Chart.js vs Recharts

**Decision**: Chart.js + react-chartjs-2 사용 (스펙 요구사항 준수)

**Rationale**:
- 스펙에 명시된 요구사항이 Chart.js 사용
- 널리 사용되는 라이브러리로 안정성과 커뮤니티 지원 우수
- 다양한 차트 타입 지원 (Line, Bar, Pie 등)
- 반응형 디자인 및 커스터마이징 용이
- react-chartjs-2가 React와의 통합을 간편하게 제공

**Alternatives considered**:
- **Recharts**: 이미 프로젝트에 설치되어 있지만, 스펙 요구사항과 불일치
- **Victory**: 기능이 많지만 번들 크기가 큼
- **Nivo**: 예쁜 차트이지만 학습 곡선 존재

**Migration Note**: 
- 기존 Recharts는 다른 기능에서 사용 중일 수 있으므로 제거하지 않음
- 대시보드 기능만 Chart.js 사용

**Installation**:
- `chart.js` (차트 엔진)
- `react-chartjs-2` (React 통합 래퍼)

---

### 3. API 타입 정의 구조

**Decision**: `src/app/commons/types/dashboard.ts`에 대시보드 관련 타입 집중 관리

**Rationale**:
- 기존 패턴과 일관성 유지 (`src/app/commons/types/auth.ts`, `inquiry.ts` 참고)
- 타입을 한 곳에서 관리하여 유지보수 용이
- API 함수 파일과 타입 파일 분리로 관심사 분리

**Type Structure**:
```typescript
// Request types
interface DashboardChartsParams {
  period?: 'day' | 'week' | 'month';
  startDate?: string;
  endDate?: string;
}

interface UserTrendsParams {
  period?: '90d';
}

// Response types
interface DashboardSummaryResponse {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  totalRevenue: number;
}

interface DashboardChartsResponse {
  labels: string[];
  data: number[];
}

interface UserTrendsResponse {
  dates: string[];
  signups: number[];
  withdrawals: number[];
}
```

---

### 4. React Query 설정 및 캐싱 전략

**Decision**: 
- 기본 staleTime: 5분 (대시보드 데이터는 자주 변경되지 않음)
- 기본 cacheTime: 10분
- refetchOnWindowFocus: true (탭 전환 시 최신 데이터 확인)

**Rationale**:
- 대시보드 데이터는 실시간성이 중요하지만, 너무 자주 요청할 필요는 없음
- 5분 staleTime으로 불필요한 요청 최소화하면서도 최신성 유지
- 창 포커스 시 자동 재요청으로 여러 탭을 열고 있을 때 데이터 동기화

**Configuration**:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
```

---

### 5. E2E 테스트 구조

**Decision**: 기존 Playwright 구조 활용 (`src/app/tests/api-tests/admin-test/`)

**Rationale**:
- 기존 테스트 구조와 일관성 유지 (`login.spec.ts`, `admim-test.spec.ts` 참고)
- API 테스트는 인증된 상태에서 실행해야 하므로 기존 인증 헬퍼 함수 활용 가능

**Test Coverage**:
1. 대시보드 요약 지표 조회 테스트
2. 기간별 차트 데이터 조회 테스트 (일/주/월)
3. 사용자 추이 데이터 조회 테스트
4. 로딩 상태 표시 확인
5. 에러 상태 처리 확인

---

## Summary

- **React Query 도입**: 서버 상태 관리 개선, 설치 및 설정 필요
- **Chart.js + react-chartjs-2 사용**: 스펙 요구사항 준수, 라이브러리 설치 필요
- **타입 정의**: `src/app/commons/types/dashboard.ts`에 집중 관리
- **캐싱 전략**: 5분 staleTime, 창 포커스 시 재요청
- **E2E 테스트**: 기존 Playwright 구조 활용

모든 연구 항목이 해결되었으며, 구현 진행 가능합니다.

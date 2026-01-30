# Quick Start: 관리자 대시보드 조회 및 차트 시각화

**Feature**: 관리자 대시보드 조회 및 차트 시각화  
**Date**: 2026-01-21

## 개요

이 문서는 관리자 대시보드 조회 및 차트 시각화 기능을 빠르게 이해하고 시작할 수 있도록 주요 구성 요소와 통합 방법을 설명합니다.

## 아키텍처 개요

```
┌─────────────────────────────────────────────────────────┐
│                  DashboardOverview                       │
│                   (Page Component)                       │
└────────────┬────────────────────────────┬───────────────┘
             │                            │
    ┌────────▼────────┐        ┌─────────▼─────────┐
    │  useDashboard   │        │  useDashboard     │
    │  Summary Hook   │        │  Charts Hook      │
    └────────┬────────┘        └─────────┬─────────┘
             │                            │
    ┌────────▼────────┐        ┌─────────▼─────────┐
    │  React Query    │        │  React Query      │
    │  (QueryClient)  │        │  (QueryClient)    │
    └────────┬────────┘        └─────────┬─────────┘
             │                            │
    ┌────────▼────────────────────────────▼─────────┐
    │         API Functions (Axios)                 │
    │  - getDashboardSummary()                      │
    │  - getDashboardCharts()                       │
    │  - getUserTrends()                            │
    └────────┬──────────────────────────────────────┘
             │
    ┌────────▼────────┐
    │   API Client    │
    │  (api-client.ts)│
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │  Backend API    │
    └─────────────────┘
```

## 주요 구성 요소

### 1. API 함수 (`src/app/commons/apis/admin/index.ts`)

백엔드 API와 통신하는 함수들입니다.

```typescript
// 대시보드 요약 지표 조회
getDashboardSummary(): Promise<DashboardSummaryResponse>

// 기간별 차트 데이터 조회
getDashboardCharts(params?: DashboardChartsParams): Promise<DashboardChartsResponse>

// 사용자 가입/탈퇴 추이 조회
getUserTrends(params?: UserTrendsParams): Promise<UserTrendsResponse>
```

### 2. 타입 정의 (`src/app/commons/types/dashboard.ts`)

모든 대시보드 관련 타입이 정의된 파일입니다.

```typescript
// 요청 타입
interface DashboardChartsParams {
  period?: 'day' | 'week' | 'month';
  startDate?: string;
  endDate?: string;
}

interface UserTrendsParams {
  period?: '90d';
}

// 응답 타입
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

### 3. React Query 훅 (`src/app/commons/hooks/use-dashboard.ts`)

서버 상태 관리와 캐싱을 처리하는 커스텀 훅들입니다.

```typescript
// 요약 지표 조회 훅
useDashboardSummary(): UseQueryResult<DashboardSummaryResponse>

// 차트 데이터 조회 훅
useDashboardCharts(params?: DashboardChartsParams): UseQueryResult<DashboardChartsResponse>

// 사용자 추이 조회 훅
useUserTrends(params?: UserTrendsParams): UseQueryResult<UserTrendsResponse>
```

### 4. 대시보드 컴포넌트 (`src/app/components/DashboardOverview/index.tsx`)

실제 UI를 렌더링하는 메인 컴포넌트입니다.

- 요약 지표 카드 표시
- 차트 시각화 (Chart.js 사용)
- 로딩 및 에러 상태 처리

## 설치 및 설정

### 1. 필요한 패키지 설치

```bash
npm install @tanstack/react-query chart.js react-chartjs-2
```

### 2. React Query Provider 설정

`src/app/layout.tsx` 또는 루트 컴포넌트에 QueryClientProvider 추가:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

## 사용 예제

### 기본 사용법

```typescript
import { useDashboardSummary } from '@/app/commons/hooks/use-dashboard';

function DashboardOverview() {
  const { data, isLoading, error } = useDashboardSummary();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <StatCard label="총 사용자" value={data.totalUsers} />
      <StatCard label="활성 사용자" value={data.activeUsers} />
      <StatCard label="총 주문" value={data.totalOrders} />
      <StatCard label="총 매출" value={data.totalRevenue} />
    </div>
  );
}
```

### 기간별 차트 조회

```typescript
import { useDashboardCharts } from '@/app/commons/hooks/use-dashboard';
import { Line } from 'react-chartjs-2';

function DashboardCharts() {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const { data, isLoading } = useDashboardCharts({ period });

  if (isLoading) return <LoadingSpinner />;

  const chartData = {
    labels: data.labels,
    datasets: [{
      label: '데이터',
      data: data.data,
      // ... 차트 옵션
    }],
  };

  return (
    <div>
      <Select value={period} onChange={setPeriod}>
        <option value="day">일</option>
        <option value="week">주</option>
        <option value="month">월</option>
      </Select>
      <Line data={chartData} />
    </div>
  );
}
```

### 사용자 추이 차트

```typescript
import { useUserTrends } from '@/app/commons/hooks/use-dashboard';
import { Line } from 'react-chartjs-2';

function UserTrendsChart() {
  const { data, isLoading } = useUserTrends({ period: '90d' });

  if (isLoading) return <LoadingSpinner />;

  const chartData = {
    labels: data.dates,
    datasets: [
      {
        label: '가입',
        data: data.signups,
        borderColor: 'rgb(75, 192, 192)',
      },
      {
        label: '탈퇴',
        data: data.withdrawals,
        borderColor: 'rgb(255, 99, 132)',
      },
    ],
  };

  return <Line data={chartData} />;
}
```

## E2E 테스트

### 테스트 파일 위치

`src/app/tests/api-tests/admin-test/dashboard-api.spec.ts`

### 주요 테스트 시나리오

1. **요약 지표 조회 테스트**
   - 로그인 후 대시보드 접속
   - 요약 지표 카드들이 올바르게 표시되는지 확인

2. **기간별 차트 조회 테스트**
   - 기간 선택 (일/주/월)
   - 차트가 올바르게 표시되는지 확인

3. **사용자 추이 조회 테스트**
   - 사용자 추이 차트 표시 확인
   - 가입/탈퇴 라인이 올바르게 표시되는지 확인

4. **로딩 및 에러 상태 테스트**
   - 로딩 중 스피너 표시 확인
   - API 오류 시 에러 메시지 표시 확인

## 주요 파일 구조

```
src/app/
├── commons/
│   ├── apis/
│   │   └── admin/
│   │       └── index.ts              # API 함수 (추가)
│   ├── types/
│   │   └── dashboard.ts              # 타입 정의 (신규)
│   └── hooks/
│       └── use-dashboard.ts          # React Query 훅 (신규)
└── components/
    └── DashboardOverview/
        ├── index.tsx                 # 메인 컴포넌트 (수정)
        └── styles.module.css         # 스타일 (기존)
```

## 다음 단계

1. `/speckit.tasks` 명령으로 작업을 세부 태스크로 분해
2. 각 태스크를 순서대로 구현
3. E2E 테스트 작성 및 통과 확인
4. UI 데이터 바인딩 완료

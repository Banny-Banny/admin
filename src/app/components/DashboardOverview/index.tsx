'use client';

import { useState } from 'react';
import { useDashboardSummary, useDashboardCharts, useUserTrends } from '../../commons/hooks/use-dashboard';
import { StatCard } from '../StatCard';
import { Users, UserPlus, MessageSquare } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import styles from './styles.module.css';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function DashboardOverview() {
  const { data, isLoading, error } = useDashboardSummary();

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={styles.c_1j8i8bf}>
        <div>
          <h2 className={styles.c_1dlkxbt}>대시보드</h2>
          <p className={styles.c_9ngaqo}>전체 통계 및 최근 활동을 확인하세요</p>
        </div>
        <div className={styles.c_dashboard_content}>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="ml-4 text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={styles.c_1j8i8bf}>
        <div>
          <h2 className={styles.c_1dlkxbt}>대시보드</h2>
          <p className={styles.c_9ngaqo}>전체 통계 및 최근 활동을 확인하세요</p>
        </div>
        <div className={styles.c_dashboard_content}>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-red-600 text-lg font-semibold">데이터를 불러오는 중 오류가 발생했습니다</p>
              <p className="text-gray-600 mt-2">
                {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우 (빈 상태)
  if (!data || (data.signups == null && data.newInquiries == null && data.dau == null)) {
    return (
      <div className={styles.c_1j8i8bf}>
        <div>
          <h2 className={styles.c_1dlkxbt}>대시보드</h2>
          <p className={styles.c_9ngaqo}>전체 통계 및 최근 활동을 확인하세요</p>
        </div>
        <div className={styles.c_dashboard_content}>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-gray-600 text-lg">데이터가 없습니다</p>
              <p className="text-gray-500 mt-2">서비스가 시작되면 통계가 표시됩니다</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <DashboardContent summaryData={data} />;
}

// 대시보드 콘텐츠 컴포넌트 (차트 포함)
function DashboardContent({ summaryData }: { summaryData: NonNullable<ReturnType<typeof useDashboardSummary>['data']> }) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const { data: chartsData, isLoading: chartsLoading, error: chartsError } = useDashboardCharts({ period });
  const { data: trendsData, isLoading: trendsLoading, error: trendsError } = useUserTrends({ period: '90d' });

  const chartItems = chartsData?.items ?? [];

  const hasChartsData =
    Array.isArray(chartItems) &&
    chartItems.length > 0 &&
    chartItems.every(
      (item) =>
        typeof item.period === 'string' &&
        typeof item.signups === 'number' &&
        typeof item.revenue === 'number'
    );

  const trendsItems = trendsData ?? [];
  
  const hasTrendsData =
    Array.isArray(trendsItems) &&
    trendsItems.length > 0 &&
    trendsItems.every(
      (item) =>
        typeof item.date === 'string' &&
        typeof item.joined === 'number' &&
        typeof item.withdrawn === 'number'
    );

  return (
    <div className={styles.c_1j8i8bf}>
      <div>
        <h2 className={styles.c_1dlkxbt}>대시보드</h2>
        <p className={styles.c_9ngaqo}>전체 통계 및 최근 활동을 확인하세요</p>
      </div>

      {/* 요약 지표 카드 */}
      <div className={styles.c_dashboard_content} data-testid="dashboard-summary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="신규 가입"
            value={(summaryData.signups ?? 0).toLocaleString()}
            change="0%"
            changeType="increase"
            icon={UserPlus}
            color="blue"
          />
          <StatCard
            title="일일 활성 사용자"
            value={(summaryData.dau ?? 0).toLocaleString()}
            change="0%"
            changeType="increase"
            icon={Users}
            color="green"
          />
          <StatCard
            title="새 문의"
            value={(summaryData.newInquiries ?? 0).toLocaleString()}
            change="0%"
            changeType="increase"
            icon={MessageSquare}
            color="purple"
          />
        </div>

        {/* 기간별 차트 */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">기간별 통계</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setPeriod('day')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === 'day'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                일
              </button>
              <button
                onClick={() => setPeriod('week')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === 'week'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                주
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === 'month'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                월
              </button>
            </div>
          </div>

          {chartsLoading ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <p className="ml-4 text-gray-600">차트 데이터를 불러오는 중...</p>
            </div>
          ) : chartsError ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow">
              <div className="text-center">
                <p className="text-red-600 text-lg font-semibold">차트 데이터를 불러오는 중 오류가 발생했습니다</p>
                <p className="text-gray-600 mt-2">
                  {chartsError instanceof Error ? chartsError.message : '알 수 없는 오류가 발생했습니다'}
                </p>
              </div>
            </div>
          ) : hasChartsData ? (
            <div className="bg-white rounded-lg shadow p-6">
              <Line
                data={{
                  labels: chartItems.map((item) => item.period),
                  datasets: [
                    {
                      label: '가입자 수',
                      data: chartItems.map((item) => item.signups),
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      fill: true,
                      tension: 0.4,
                    },
                    {
                      label: '매출',
                      data: chartItems.map((item) => item.revenue),
                      borderColor: 'rgb(16, 185, 129)',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      fill: true,
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top' as const,
                    },
                    tooltip: {
                      mode: 'index' as const,
                      intersect: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
                height={300}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow">
              <div className="text-center">
                <p className="text-gray-600 text-lg">차트 데이터가 없습니다</p>
                <p className="text-gray-500 mt-2">선택한 기간에 데이터가 없습니다</p>
              </div>
            </div>
          )}
        </div>

        {/* 사용자 가입/탈퇴 추이 차트 */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">사용자 가입/탈퇴 추이 (최근 90일)</h3>
          {trendsLoading ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <p className="ml-4 text-gray-600">사용자 추이 데이터를 불러오는 중...</p>
            </div>
          ) : trendsError ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow">
              <div className="text-center">
                <p className="text-red-600 text-lg font-semibold">사용자 추이 데이터를 불러오는 중 오류가 발생했습니다</p>
                <p className="text-gray-600 mt-2">
                  {trendsError instanceof Error ? trendsError.message : '알 수 없는 오류가 발생했습니다'}
                </p>
              </div>
            </div>
          ) : hasTrendsData ? (
            <div className="bg-white rounded-lg shadow p-6">
              <Line
                data={{
                  labels: trendsData.dates,
                  datasets: [
                    {
                      label: '가입',
                      data: trendsData.signups,
                      borderColor: 'rgb(16, 185, 129)',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      fill: false,
                      tension: 0.4,
                    },
                    {
                      label: '탈퇴',
                      data: trendsData.withdrawals,
                      borderColor: 'rgb(239, 68, 68)',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      fill: false,
                      tension: 0.4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: true,
                      position: 'top' as const,
                    },
                    tooltip: {
                      mode: 'index' as const,
                      intersect: false,
                      callbacks: {
                        label: function(context) {
                          const label = context.dataset.label || '';
                          const value = context.parsed.y;
                          return `${label}: ${value}명`;
                        },
                      },
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return value + '명';
                        },
                      },
                    },
                  },
                }}
                height={300}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow">
              <div className="text-center">
                <p className="text-gray-600 text-lg">사용자 추이 데이터가 없습니다</p>
                <p className="text-gray-500 mt-2">최근 90일 동안의 데이터가 없습니다</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
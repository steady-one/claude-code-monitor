'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryCards } from './summary-cards';
import { MultiUserCostChart } from './charts/multi-user-cost-chart';
import { MultiUserTokenChart } from './charts/multi-user-token-chart';
import { ModelUsageChart } from './charts/model-usage-chart';
import { UsersTable } from './users-table';
import { DashboardSkeleton } from './dashboard-skeleton';
import {
  TimeRangePresetButtons,
  getTimeRangeFromPreset,
  type TimeRangePreset,
} from '@/components/ui/time-range-preset';
import {
  fetchSummary,
  fetchUsersCostTimeSeries,
  fetchUsersTokenTimeSeries,
  fetchModelStats,
  fetchUsers,
} from '@/lib/api';

export function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRangePreset>('today');
  const { from, to } = useMemo(() => getTimeRangeFromPreset(timeRange), [timeRange]);
  const interval = timeRange === 'today' ? 'hour' : 'day';

  const summaryQuery = useQuery({
    queryKey: ['metrics', 'summary', { from, to }],
    queryFn: () => fetchSummary({ from, to, interval }),
  });

  const usersCostQuery = useQuery({
    queryKey: ['metrics', 'cost', 'by-user', { from, to, interval }],
    queryFn: () => fetchUsersCostTimeSeries({ from, to, interval }),
  });

  const usersTokenQuery = useQuery({
    queryKey: ['metrics', 'tokens', 'by-user', { from, to, interval }],
    queryFn: () => fetchUsersTokenTimeSeries({ from, to, interval }),
  });

  const modelStatsQuery = useQuery({
    queryKey: ['metrics', 'models', { from, to }],
    queryFn: () => fetchModelStats({ from, to }),
  });

  const usersQuery = useQuery({
    queryKey: ['metrics', 'users', { from, to }],
    queryFn: () => fetchUsers({ from, to, pageSize: 10 }),
  });

  const isLoading =
    summaryQuery.isLoading ||
    usersCostQuery.isLoading ||
    usersTokenQuery.isLoading ||
    modelStatsQuery.isLoading ||
    usersQuery.isLoading;

  const isError =
    summaryQuery.isError ||
    usersCostQuery.isError ||
    usersTokenQuery.isError ||
    modelStatsQuery.isError ||
    usersQuery.isError;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h2 className="text-xl font-semibold text-destructive">
          데이터를 불러올 수 없습니다
        </h2>
        <p className="mt-2 text-muted-foreground">
          API 서버 연결을 확인해주세요
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {summaryQuery.error?.message ||
            usersCostQuery.error?.message ||
            usersTokenQuery.error?.message ||
            modelStatsQuery.error?.message ||
            usersQuery.error?.message}
        </p>
      </div>
    );
  }

  const modelChartData = modelStatsQuery.data?.models.map((model) => ({
    model: model.model,
    cost: model.totalCost,
    tokens: model.totalTokens,
  })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <TimeRangePresetButtons value={timeRange} onChange={setTimeRange} />
      </div>

      {summaryQuery.data && <SummaryCards summary={summaryQuery.data} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>사용자별 비용 추이</CardTitle>
          </CardHeader>
          <CardContent>
            {usersCostQuery.data && (
              <MultiUserCostChart data={usersCostQuery.data} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>사용자별 토큰 사용량</CardTitle>
          </CardHeader>
          <CardContent>
            {usersTokenQuery.data && (
              <MultiUserTokenChart data={usersTokenQuery.data} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>모델별 사용 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <ModelUsageChart data={modelChartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>사용자별 통계</CardTitle>
          </CardHeader>
          <CardContent>
            {usersQuery.data && <UsersTable data={usersQuery.data} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

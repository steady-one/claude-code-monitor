'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  type CustomRange,
} from '@/components/ui/time-range-preset';
import {
  fetchSummary,
  fetchUsersCostTimeSeries,
  fetchUsersTokenTimeSeries,
  fetchModelStats,
  fetchUsers,
} from '@/lib/api';

function formatLastUpdated(updatedAt: number): string {
  const diffMs = Date.now() - updatedAt;
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 10) {
    return '방금 전';
  }
  if (diffSeconds < 60) {
    return `${diffSeconds}초 전`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}시간 전`;
}

export function Dashboard() {
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState<TimeRangePreset>('today');
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);

  const { from, to } = useMemo(
    () => getTimeRangeFromPreset(timeRange, customRange),
    [timeRange, customRange],
  );
  const interval = timeRange === 'today' ? 'hour' : 'day';

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  const handleTimeRangeChange = useCallback((value: TimeRangePreset) => {
    if (value !== 'custom') {
      setCustomRange(null);
    }
    setTimeRange(value);
  }, []);

  const handleCustomRangeChange = useCallback((range: CustomRange) => {
    setCustomRange(range);
  }, []);

  const summaryQuery = useQuery({
    queryKey: ['metrics', 'summary', { from, to, comparePreviousPeriod: true }],
    queryFn: () => fetchSummary({ from, to, interval, comparePreviousPeriod: true }),
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <div className="flex items-center gap-3">
          {summaryQuery.dataUpdatedAt > 0 && (
            <span className="text-xs text-muted-foreground">
              마지막 갱신: {formatLastUpdated(summaryQuery.dataUpdatedAt)}
            </span>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className="h-8 w-8"
            aria-label="새로고침"
          >
            <RefreshCw
              className={`h-4 w-4 ${summaryQuery.isFetching ? 'animate-spin' : ''}`}
            />
          </Button>
          <TimeRangePresetButtons
            value={timeRange}
            onChange={handleTimeRangeChange}
            customRange={customRange}
            onCustomRangeChange={handleCustomRangeChange}
          />
        </div>
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

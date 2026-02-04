'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SummaryCards } from './summary-cards';
import { CostChart } from './charts/cost-chart';
import { TokenStackedChart } from './charts/token-stacked-chart';
import { UsersTable } from './users-table';
import { DashboardSkeleton } from './dashboard-skeleton';
import {
  fetchSummary,
  fetchCostTimeSeries,
  fetchDetailedTokens,
  fetchUsers,
} from '@/lib/api';

export function Dashboard() {
  const summaryQuery = useQuery({
    queryKey: ['metrics', 'summary'],
    queryFn: () => fetchSummary({ interval: 'hour' }),
  });

  const costQuery = useQuery({
    queryKey: ['metrics', 'cost'],
    queryFn: () => fetchCostTimeSeries({ interval: 'hour' }),
  });

  const tokenQuery = useQuery({
    queryKey: ['metrics', 'tokens', 'detailed'],
    queryFn: () => fetchDetailedTokens({ interval: 'hour' }),
  });

  const usersQuery = useQuery({
    queryKey: ['metrics', 'users'],
    queryFn: () => fetchUsers({ pageSize: 10 }),
  });

  const isLoading =
    summaryQuery.isLoading ||
    costQuery.isLoading ||
    tokenQuery.isLoading ||
    usersQuery.isLoading;

  const isError =
    summaryQuery.isError ||
    costQuery.isError ||
    tokenQuery.isError ||
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
            costQuery.error?.message ||
            tokenQuery.error?.message ||
            usersQuery.error?.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {summaryQuery.data && <SummaryCards summary={summaryQuery.data} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>비용 추이</CardTitle>
          </CardHeader>
          <CardContent>
            {costQuery.data && <CostChart data={costQuery.data} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>토큰 사용량</CardTitle>
          </CardHeader>
          <CardContent>
            {tokenQuery.data && (
              <TokenStackedChart
                data={tokenQuery.data.data}
                interval="hour"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>사용자별 통계</CardTitle>
        </CardHeader>
        <CardContent>
          {usersQuery.data && <UsersTable data={usersQuery.data} />}
        </CardContent>
      </Card>
    </div>
  );
}

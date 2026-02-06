'use client';

import { use, useState, useMemo, useCallback } from 'react';
import {
  useUserDetail,
  useUserDailyStats,
  useUserCostTimeSeries,
  useUserDetailedTokens,
} from '@/hooks/use-users';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TimeRangePresetButtons,
  getTimeRangeFromPreset,
  type TimeRangePreset,
  type CustomRange,
} from '@/components/ui/time-range-preset';
import { UserDetailHeader } from '@/components/users/user-detail-header';
import { UserStatsCards } from '@/components/users/user-stats-cards';
import { UserSessionInsights } from '@/components/users/user-session-insights';
import { UserModelUsage } from '@/components/users/user-model-usage';
import { UserActivityTabs } from '@/components/users/user-activity-tabs';
import { CostChart } from '@/components/charts/cost-chart';
import { TokenStackedChart } from '@/components/charts/token-stacked-chart';

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default function UserDetailPage({ params }: PageProps) {
  const { userId } = use(params);
  const [timeRange, setTimeRange] = useState<TimeRangePreset>('today');
  const [customRange, setCustomRange] = useState<CustomRange | null>(null);

  const { from, to } = useMemo(
    () => getTimeRangeFromPreset(timeRange, customRange),
    [timeRange, customRange],
  );

  const interval = timeRange === 'today' ? 'hour' : 'day';

  const periodDays = useMemo(
    () => Math.ceil((to - from) / (1000 * 60 * 60 * 24)),
    [from, to],
  );

  const handleTimeRangeChange = useCallback((value: TimeRangePreset) => {
    if (value !== 'custom') {
      setCustomRange(null);
    }
    setTimeRange(value);
  }, []);

  const handleCustomRangeChange = useCallback((range: CustomRange) => {
    setCustomRange(range);
  }, []);

  const { data: user, isLoading, isError, error } = useUserDetail(userId, {
    from,
    to,
  });

  const { data: dailyStatsData } = useUserDailyStats(userId, {
    from,
    to,
    groupBy: 'day',
  });

  const { data: costData, isLoading: isCostLoading } = useUserCostTimeSeries(
    userId,
    { from, to, interval },
  );

  const { data: tokenData, isLoading: isTokenLoading } = useUserDetailedTokens(
    userId,
    { from, to, interval },
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-16 w-96" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-destructive">
          데이터를 불러오는 중 오류가 발생했습니다: {error.message}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          사용자를 찾을 수 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <UserDetailHeader user={user} />
        <TimeRangePresetButtons
          value={timeRange}
          onChange={handleTimeRangeChange}
          customRange={customRange}
          onCustomRangeChange={handleCustomRangeChange}
        />
      </div>

      <UserStatsCards
        user={user}
        dailyStats={dailyStatsData?.stats}
        periodDays={periodDays}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>비용 추이</CardTitle>
          </CardHeader>
          <CardContent>
            {isCostLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : costData ? (
              <CostChart data={costData} />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                비용 데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>토큰 사용량</CardTitle>
          </CardHeader>
          <CardContent>
            {isTokenLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : tokenData && tokenData.data.length > 0 ? (
              <TokenStackedChart data={tokenData.data} interval={interval} />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                토큰 데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UserSessionInsights userId={user.userId} from={from} to={to} />
        <UserModelUsage user={user} />
      </div>

      <UserActivityTabs userId={user.userId} from={from} to={to} />
    </div>
  );
}

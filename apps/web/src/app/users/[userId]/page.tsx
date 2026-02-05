'use client';

import { use, useState, useMemo } from 'react';
import { useUserDetail, useUserDailyStats } from '@/hooks/use-users';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TimeRangePresetButtons,
  getTimeRangeFromPreset,
  type TimeRangePreset,
} from '@/components/ui/time-range-preset';
import { UserDetailHeader } from '@/components/users/user-detail-header';
import { UserStatsCards } from '@/components/users/user-stats-cards';
import { UserCostTrend } from '@/components/users/user-cost-trend';
import { UserSessionInsights } from '@/components/users/user-session-insights';
import { UserModelUsage } from '@/components/users/user-model-usage';
import { UserActivityTabs } from '@/components/users/user-activity-tabs';

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default function UserDetailPage({ params }: PageProps) {
  const { userId } = use(params);
  const [timeRange, setTimeRange] = useState<TimeRangePreset>('30d');

  const { from, to } = useMemo(
    () => getTimeRangeFromPreset(timeRange),
    [timeRange],
  );

  const periodDays = useMemo(
    () => Math.ceil((to - from) / (1000 * 60 * 60 * 24)),
    [from, to],
  );

  const { data: user, isLoading, isError, error } = useUserDetail(userId, {
    from,
    to,
  });

  const { data: dailyStatsData } = useUserDailyStats(userId, {
    from,
    to,
    groupBy: 'day',
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-16 w-96" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
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
        <TimeRangePresetButtons value={timeRange} onChange={setTimeRange} />
      </div>

      <UserStatsCards
        user={user}
        dailyStats={dailyStatsData?.stats}
        periodDays={periodDays}
      />

      <UserCostTrend userId={user.userId} from={from} to={to} />

      <div className="grid gap-6 lg:grid-cols-2">
        <UserSessionInsights userId={user.userId} from={from} to={to} />
        <UserModelUsage user={user} />
      </div>

      <UserActivityTabs userId={user.userId} from={from} to={to} />
    </div>
  );
}

'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDateShort } from '@/lib/format';
import { useUserDailyStats } from '@/hooks/use-users';
import type { DailyStatsRow } from '@claude-code-monitor/shared';

interface UserCostTrendProps {
  readonly userId: string;
  readonly from: number;
  readonly to: number;
}

interface ChartDataPoint {
  readonly date: string;
  readonly cost: number;
  readonly timestamp: number;
}

function aggregateToWeekly(
  stats: readonly DailyStatsRow[],
): readonly ChartDataPoint[] {
  if (stats.length === 0) return [];

  const weeklyData: Map<string, { cost: number; timestamp: number }> =
    new Map();

  for (const day of stats) {
    const date = new Date(day.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    const existing = weeklyData.get(weekKey);
    if (existing) {
      weeklyData.set(weekKey, {
        cost: existing.cost + day.totalCost,
        timestamp: existing.timestamp,
      });
    } else {
      weeklyData.set(weekKey, {
        cost: day.totalCost,
        timestamp: weekStart.getTime(),
      });
    }
  }

  return Array.from(weeklyData.entries())
    .map(([_, data]) => ({
      date: formatDateShort(data.timestamp),
      cost: data.cost,
      timestamp: data.timestamp,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

function transformToChartData(
  stats: readonly DailyStatsRow[],
  useWeekly: boolean,
): readonly ChartDataPoint[] {
  if (useWeekly) {
    return aggregateToWeekly(stats);
  }

  return stats.map((day) => ({
    date: day.dateLabel,
    cost: day.totalCost,
    timestamp: day.date,
  }));
}

function calculateAverage(data: readonly ChartDataPoint[]): number {
  if (data.length === 0) return 0;
  const total = data.reduce((sum, point) => sum + point.cost, 0);
  return total / data.length;
}

export function UserCostTrend({ userId, from, to }: UserCostTrendProps) {
  const periodDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24));
  const useWeekly = periodDays > 60;

  const { data, isLoading, isError, error } = useUserDailyStats(userId, {
    from,
    to,
    groupBy: 'day',
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>비용 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>비용 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-destructive">
            데이터를 불러오는 중 오류가 발생했습니다: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>비용 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            해당 기간에 데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = transformToChartData(data.stats, useWeekly);
  const avgCost = calculateAverage(chartData);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>비용 추이</CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span>{useWeekly ? '주별' : '일별'} 비용</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 border-t-2 border-dashed border-amber-500" />
            <span>평균 {formatCurrency(avgCost)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData as ChartDataPoint[]}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                stroke="var(--color-muted-foreground)"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  value >= 1 ? `$${value.toFixed(0)}` : `$${value.toFixed(2)}`
                }
                stroke="var(--color-muted-foreground)"
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-card)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0.5rem',
                }}
                formatter={(value: number) => [formatCurrency(value), '비용']}
                labelStyle={{ color: 'var(--color-foreground)' }}
              />
              <ReferenceLine
                y={avgCost}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="cost"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#colorCost)"
                dot={false}
                activeDot={{
                  r: 6,
                  fill: '#3b82f6',
                  stroke: 'var(--color-background)',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

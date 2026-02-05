'use client';

import {
  DollarSign,
  Hash,
  Zap,
  Calculator,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/format';
import type { UserDetail, DailyStatsRow } from '@claude-code-monitor/shared';

interface UserStatsCardsProps {
  readonly user: UserDetail;
  readonly dailyStats?: readonly DailyStatsRow[];
  readonly periodDays: number;
}

function getEfficiencyGrade(percentage: number): {
  label: string;
  colorClass: string;
} {
  if (percentage >= 70) {
    return { label: '매우 좋음', colorClass: 'text-emerald-600' };
  }
  if (percentage >= 50) {
    return { label: '좋음', colorClass: 'text-green-600' };
  }
  if (percentage >= 30) {
    return { label: '보통', colorClass: 'text-amber-600' };
  }
  return { label: '개선 필요', colorClass: 'text-red-600' };
}

function calculateEstimatedMonthlyCost(
  dailyStats: readonly DailyStatsRow[] | undefined,
): number | null {
  if (!dailyStats || dailyStats.length === 0) {
    return null;
  }

  const recentDays = dailyStats.slice(-7);
  if (recentDays.length === 0) {
    return null;
  }

  const totalCost = recentDays.reduce((sum, day) => sum + day.totalCost, 0);
  const avgDailyCost = totalCost / recentDays.length;

  return avgDailyCost * 30;
}

export function UserStatsCards({
  user,
  dailyStats,
  periodDays,
}: UserStatsCardsProps) {
  const { stats } = user;

  const cacheEfficiency =
    stats.totalTokens > 0
      ? (stats.cacheReadTokens / stats.totalTokens) * 100
      : 0;

  const avgSessionCost =
    stats.sessionCount > 0 ? stats.totalCost / stats.sessionCount : 0;

  const dailyAvgSessions =
    periodDays > 0 ? stats.sessionCount / periodDays : stats.sessionCount;

  const estimatedMonthlyCost = calculateEstimatedMonthlyCost(dailyStats);

  const efficiencyGrade = getEfficiencyGrade(cacheEfficiency);

  const cards = [
    {
      title: '총 비용',
      value: formatCurrency(stats.totalCost),
      icon: DollarSign,
      subValue: null,
      subValueClass: '',
    },
    {
      title: '평균 세션 비용',
      value: formatCurrency(avgSessionCost),
      icon: Calculator,
      subValue: `${formatNumber(stats.sessionCount)}개 세션 기준`,
      subValueClass: 'text-muted-foreground',
    },
    {
      title: '세션 수',
      value: formatNumber(stats.sessionCount),
      icon: Hash,
      subValue: `일평균 ${dailyAvgSessions.toFixed(1)}개`,
      subValueClass: 'text-muted-foreground',
    },
    {
      title: '캐시 히트율',
      value: formatPercentage(cacheEfficiency),
      icon: Zap,
      subValue: efficiencyGrade.label,
      subValueClass: efficiencyGrade.colorClass,
    },
    {
      title: '예상 월 비용',
      value:
        estimatedMonthlyCost !== null
          ? formatCurrency(estimatedMonthlyCost)
          : '-',
      icon: Calendar,
      subValue: estimatedMonthlyCost !== null ? '최근 7일 기준' : '데이터 부족',
      subValueClass: 'text-muted-foreground',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.subValue && (
                <p className={`text-xs mt-1 ${card.subValueClass}`}>
                  {card.subValue}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

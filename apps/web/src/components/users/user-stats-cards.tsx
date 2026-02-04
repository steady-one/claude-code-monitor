'use client';

import { DollarSign, Hash, Layers, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/format';
import type { UserDetail } from '@claude-code-monitor/shared';

interface UserStatsCardsProps {
  readonly user: UserDetail;
}

export function UserStatsCards({ user }: UserStatsCardsProps) {
  const { stats } = user;

  const cacheEfficiency =
    stats.totalTokens > 0
      ? (stats.cacheReadTokens / stats.totalTokens) * 100
      : 0;

  const cards = [
    {
      title: '총 비용',
      value: formatCurrency(stats.totalCost),
      icon: DollarSign,
    },
    {
      title: '총 토큰',
      value: formatNumber(stats.totalTokens),
      icon: Layers,
    },
    {
      title: '세션 수',
      value: formatNumber(stats.sessionCount),
      icon: Hash,
    },
    {
      title: '캐시 효율',
      value: formatPercentage(cacheEfficiency),
      icon: Zap,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MetricsSummary } from '@claude-code-monitor/shared';
import {
  DollarSign,
  Hash,
  Users,
  TrendingUp,
} from 'lucide-react';

interface SummaryCardsProps {
  readonly summary: MetricsSummary;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const avgSessionCost = summary.totalSessions > 0
    ? summary.totalCost / summary.totalSessions
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 비용</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(summary.totalCost)}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatNumber(summary.totalTokens)} 토큰 사용
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">세션</CardTitle>
          <Hash className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatNumber(summary.totalSessions)}
          </div>
          <p className="text-xs text-muted-foreground">
            커밋 {formatNumber(summary.totalCommits)} / PR{' '}
            {formatNumber(summary.totalPullRequests)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">사용자</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.uniqueUsers}</div>
          <p className="text-xs text-muted-foreground">활성 사용자</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">평균 세션 비용</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(avgSessionCost)}
          </div>
          <p className="text-xs text-muted-foreground">세션당 평균</p>
        </CardContent>
      </Card>
    </div>
  );
}

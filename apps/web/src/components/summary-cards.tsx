'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MetricsSummary } from '@claude-code-monitor/shared';
import {
  DollarSign,
  Coins,
  Hash,
  GitCommitHorizontal,
  GitPullRequest,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

/** 증감률 계산: 이전 값이 0이면 현재 값 있으면 100%, 둘 다 0이면 null */
function calcChangePercent(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return ((current - previous) / previous) * 100;
}

interface TrendBadgeProps {
  readonly changePercent: number | null;
  /** true이면 증가가 부정적(빨간), 감소가 긍정적(초록) -- 비용 카드에 사용 */
  readonly invertColor?: boolean;
}

function TrendBadge({ changePercent, invertColor = false }: TrendBadgeProps) {
  if (changePercent === null) {
    return null;
  }

  const isPositive = changePercent > 0;
  const isNeutral = changePercent === 0;
  const absPercent = Math.abs(changePercent);
  const displayPercent = absPercent > 999 ? '999+' : absPercent.toFixed(1);

  if (isNeutral) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        0%
      </span>
    );
  }

  // 비용의 경우 증가는 부정적(빨간), 감소는 긍정적(초록)
  const isGreen = invertColor ? !isPositive : isPositive;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        isGreen ? 'text-emerald-600' : 'text-red-500',
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? '+' : '-'}{displayPercent}%
    </span>
  );
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const avgSessionCost = summary.totalSessions > 0
    ? summary.totalCost / summary.totalSessions
    : 0;

  const prev = summary.previousPeriod;

  const costChange = prev
    ? calcChangePercent(summary.totalCost, prev.totalCost)
    : null;
  const tokenChange = prev
    ? calcChangePercent(summary.totalTokens, prev.totalTokens)
    : null;
  const sessionsChange = prev
    ? calcChangePercent(summary.totalSessions, prev.totalSessions)
    : null;

  return (
    <div className="space-y-4">
      {/* 상단: 핵심 지표 - 히어로 카드 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">총 비용</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div
                className="text-4xl font-bold tracking-tight"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatCurrency(summary.totalCost)}
              </div>
              <TrendBadge changePercent={costChange} invertColor />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              세션당 평균 {formatCurrency(avgSessionCost)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">총 토큰</CardTitle>
            <Coins className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div
                className="text-4xl font-bold tracking-tight"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatNumber(summary.totalTokens)}
              </div>
              <TrendBadge changePercent={tokenChange} invertColor />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {summary.uniqueUsers}명의 사용자가 사용
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 하단: 보조 지표 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">세션</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div
                className="text-2xl font-bold"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatNumber(summary.totalSessions)}
              </div>
              <TrendBadge changePercent={sessionsChange} />
            </div>
            <p className="text-xs text-muted-foreground">
              총 세션 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">커밋</CardTitle>
            <GitCommitHorizontal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatNumber(summary.totalCommits)}
            </div>
            <p className="text-xs text-muted-foreground">
              총 커밋 수
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PR</CardTitle>
            <GitPullRequest className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatNumber(summary.totalPullRequests)}
            </div>
            <p className="text-xs text-muted-foreground">
              총 풀 리퀘스트 수
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

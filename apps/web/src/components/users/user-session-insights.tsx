'use client';

import { AlertTriangle, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatNumber, truncateUuid } from '@/lib/format';
import { useUserSessions } from '@/hooks/use-users';
import type { UserSession } from '@claude-code-monitor/shared';

interface UserSessionInsightsProps {
  readonly userId: string;
  readonly from: number;
  readonly to: number;
}

interface SessionStats {
  readonly min: number;
  readonly max: number;
  readonly avg: number;
  readonly median: number;
  readonly anomalySessions: readonly UserSession[];
}

function calculateSessionStats(
  sessions: readonly UserSession[],
): SessionStats | null {
  if (sessions.length === 0) {
    return null;
  }

  const costs = sessions.map((s) => s.cost);
  const sorted = [...costs].sort((a, b) => a - b);

  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const avg = costs.reduce((sum, c) => sum + c, 0) / costs.length;
  const median =
    sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

  const anomalyThreshold = avg * 3;
  const anomalySessions = sessions
    .filter((s) => s.cost >= anomalyThreshold)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  return { min, max, avg, median, anomalySessions };
}

function StatItem({
  label,
  value,
  icon,
}: {
  readonly label: string;
  readonly value: string;
  readonly icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-mono text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}

export function UserSessionInsights({
  userId,
  from,
  to,
}: UserSessionInsightsProps) {
  const { data, isLoading, isError, error } = useUserSessions(userId, {
    from,
    to,
    page: 1,
    pageSize: 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>세션 인사이트</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>세션 인사이트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-destructive">
            데이터 로드 실패: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sessions = data?.sessions ?? [];
  const stats = calculateSessionStats(sessions);

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>세션 인사이트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            세션 데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>세션 인사이트</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">비용 분포</h4>
          <div className="divide-y">
            <StatItem
              label="최소"
              value={formatCurrency(stats.min)}
              icon={<TrendingDown className="h-4 w-4 text-green-500" />}
            />
            <StatItem
              label="최대"
              value={formatCurrency(stats.max)}
              icon={<TrendingUp className="h-4 w-4 text-red-500" />}
            />
            <StatItem
              label="평균"
              value={formatCurrency(stats.avg)}
              icon={<Minus className="h-4 w-4 text-blue-500" />}
            />
            <StatItem
              label="중앙값"
              value={formatCurrency(stats.median)}
              icon={<Minus className="h-4 w-4 text-purple-500" />}
            />
          </div>
        </div>

        {stats.anomalySessions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <h4 className="text-sm font-medium">
                이상 세션 ({formatNumber(stats.anomalySessions.length)}개)
              </h4>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              평균의 3배 이상 ({formatCurrency(stats.avg * 3)} 초과)
            </p>
            <div className="space-y-1">
              {stats.anomalySessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between rounded-md bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm"
                >
                  <span className="font-mono text-muted-foreground">
                    {truncateUuid(session.sessionId)}
                  </span>
                  <span className="font-medium text-amber-700 dark:text-amber-400">
                    {formatCurrency(session.cost)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.anomalySessions.length === 0 && (
          <div className="rounded-md bg-green-50 dark:bg-green-950/30 px-3 py-2">
            <p className="text-sm text-green-700 dark:text-green-400">
              이상 세션 없음 - 모든 세션이 정상 범위 내에 있습니다
            </p>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            전체 {formatNumber(sessions.length)}개 세션 분석됨
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserDailyStats } from '@/hooks/use-users';
import { formatNumber, formatCurrency, formatCompactNumber } from '@/lib/format';
import type { StatsGroupBy, DailyStatsRow } from '@claude-code-monitor/shared';

interface UserDailyStatsTableProps {
  readonly userId: string;
  readonly from: number;
  readonly to: number;
}

function exportToCsv(
  stats: readonly DailyStatsRow[],
  summary: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCacheCreateTokens: number;
    totalCacheReadTokens: number;
    totalTokens: number;
    totalCost: number;
  },
  filename: string,
): void {
  const headers = [
    'Date',
    'Models',
    'Input Tokens',
    'Output Tokens',
    'Cache Create',
    'Cache Read',
    'Total Tokens',
    'Cost (USD)',
  ];

  const rows = stats.map((row) => [
    row.dateLabel,
    row.models.join('; '),
    row.inputTokens,
    row.outputTokens,
    row.cacheCreateTokens,
    row.cacheReadTokens,
    row.totalTokens,
    row.totalCost.toFixed(4),
  ]);

  rows.push([
    'Total',
    '',
    summary.totalInputTokens,
    summary.totalOutputTokens,
    summary.totalCacheCreateTokens,
    summary.totalCacheReadTokens,
    summary.totalTokens,
    summary.totalCost.toFixed(4),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) =>
          typeof cell === 'string' && cell.includes(',')
            ? `"${cell}"`
            : cell,
        )
        .join(','),
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function UserDailyStatsTable({
  userId,
  from,
  to,
}: UserDailyStatsTableProps) {
  const [groupBy, setGroupBy] = useState<StatsGroupBy>('day');

  const { data, isLoading, isError, error } = useUserDailyStats(userId, {
    from,
    to,
    groupBy,
  });

  const handleExport = () => {
    if (!data) return;
    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(data.stats, data.summary, `token-stats-${userId}-${dateStr}.csv`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>사용량 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>사용량 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            데이터를 불러오는 중 오류가 발생했습니다: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.stats.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>사용량 통계</CardTitle>
          <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as StatsGroupBy)}>
            <TabsList>
              <TabsTrigger value="day">일별</TabsTrigger>
              <TabsTrigger value="month">월별</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            해당 기간에 데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  const { stats, summary } = data;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>사용량 통계</CardTitle>
        <div className="flex items-center gap-4">
          <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as StatsGroupBy)}>
            <TabsList>
              <TabsTrigger value="day">일별</TabsTrigger>
              <TabsTrigger value="month">월별</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={handleExport}>
            CSV Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Models</TableHead>
              <TableHead className="text-right">Input</TableHead>
              <TableHead className="text-right">Output</TableHead>
              <TableHead className="text-right">Cache+</TableHead>
              <TableHead className="text-right">Cache-</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.map((row) => (
              <TableRow key={row.date}>
                <TableCell className="font-mono text-sm">
                  {row.dateLabel}
                </TableCell>
                <TableCell className="text-sm">
                  {row.models.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                      {row.models.map((model) => (
                        <span key={model} className="text-muted-foreground">
                          {model}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCompactNumber(row.inputTokens)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCompactNumber(row.outputTokens)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCompactNumber(row.cacheCreateTokens)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCompactNumber(row.cacheReadTokens)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-medium">
                  {formatCompactNumber(row.totalTokens)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(row.totalCost)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell />
              <TableCell className="text-right font-mono text-sm font-medium">
                {formatNumber(summary.totalInputTokens)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-medium">
                {formatNumber(summary.totalOutputTokens)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-medium">
                {formatNumber(summary.totalCacheCreateTokens)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-medium">
                {formatNumber(summary.totalCacheReadTokens)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-medium">
                {formatNumber(summary.totalTokens)}
              </TableCell>
              <TableCell className="text-right font-mono text-sm font-medium">
                {formatCurrency(summary.totalCost)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

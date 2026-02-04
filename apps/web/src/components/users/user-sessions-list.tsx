'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate, formatNumber, truncateUuid } from '@/lib/format';
import { useUserSessions } from '@/hooks/use-users';

interface UserSessionsListProps {
  readonly userId: string;
  readonly from: number;
  readonly to: number;
}

const PAGE_SIZE = 10;

export function UserSessionsList({ userId, from, to }: UserSessionsListProps) {
  const [dateRange, setDateRange] = useState({ from, to });
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useUserSessions(userId, {
    from: dateRange.from,
    to: dateRange.to,
    page,
    pageSize: PAGE_SIZE,
  });

  const handleDateRangeChange = useCallback(
    (range: { from: number; to: number }) => {
      setDateRange(range);
      setPage(1);
    },
    [],
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>세션 히스토리</CardTitle>
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
          <CardTitle>세션 히스토리</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            데이터를 불러오는 중 오류가 발생했습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  const sessions = data?.sessions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>세션 히스토리</CardTitle>
        <DateRangeFilter
          from={dateRange.from}
          to={dateRange.to}
          onChange={handleDateRangeChange}
        />
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            세션 데이터가 없습니다
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>세션 ID</TableHead>
                  <TableHead>시작 시간</TableHead>
                  <TableHead className="text-right">Input</TableHead>
                  <TableHead className="text-right">Output</TableHead>
                  <TableHead className="text-right">Cache Read</TableHead>
                  <TableHead className="text-right">Cache Create</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.sessionId}>
                    <TableCell className="font-mono text-sm">
                      {truncateUuid(session.sessionId)}
                    </TableCell>
                    <TableCell>{formatDate(session.startTime)}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(session.inputTokens)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(session.outputTokens)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(session.cacheReadTokens)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(session.cacheCreationTokens)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(session.totalTokens)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(session.cost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}

            <div className="mt-2 text-center text-sm text-muted-foreground">
              전체 {formatNumber(total)}개 세션
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

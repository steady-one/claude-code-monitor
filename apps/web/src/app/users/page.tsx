'use client';

import { useState, useMemo } from 'react';
import { useUsers } from '@/hooks/use-users';
import { UsersTable } from '@/components/users-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TimeRangePresetButtons,
  getTimeRangeFromPreset,
  type TimeRangePreset,
} from '@/components/ui/time-range-preset';

export default function UsersPage() {
  const [timeRange, setTimeRange] = useState<TimeRangePreset>('30d');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { from, to } = useMemo(
    () => getTimeRangeFromPreset(timeRange),
    [timeRange],
  );

  const { data, isLoading, isError, error } = useUsers({
    from,
    to,
    page,
    pageSize,
  });

  const handleTimeRangeChange = (value: TimeRangePreset) => {
    setTimeRange(value);
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <TimeRangePresetButtons value={timeRange} onChange={handleTimeRangeChange} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>사용자 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-8 text-destructive">
              데이터를 불러오는 중 오류가 발생했습니다: {error.message}
            </div>
          ) : data ? (
            <UsersTable
              data={data}
              showPagination
              onPageChange={setPage}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

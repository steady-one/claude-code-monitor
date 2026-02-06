'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import type { UsersResponse, UserStats } from '@claude-code-monitor/shared';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  truncateUuid,
} from '@/lib/format';
import { generateCsv, downloadCsv } from '@/lib/csv-export';

const CSV_COLUMNS: readonly {
  readonly key: keyof UserStats;
  readonly header: string;
}[] = [
  { key: 'accountUuid', header: '사용자 ID' },
  { key: 'organizationId', header: '조직' },
  { key: 'totalCost', header: '비용 (USD)' },
  { key: 'totalTokens', header: '토큰' },
  { key: 'sessionCount', header: '세션' },
  { key: 'lastSeen', header: '마지막 활동' },
  { key: 'firstSeen', header: '최초 활동' },
] as const;

interface UsersTableProps {
  readonly data: UsersResponse;
  readonly onPageChange?: (page: number) => void;
  readonly showPagination?: boolean;
}

export function UsersTable({
  data,
  onPageChange,
  showPagination = false,
}: UsersTableProps) {
  const router = useRouter();

  const handleExportCsv = useCallback(() => {
    // 타임스탬프를 날짜 문자열로 변환한 데이터 생성
    const exportData = data.users.map((user) => ({
      ...user,
      lastSeen: new Date(user.lastSeen).toISOString(),
      firstSeen: new Date(user.firstSeen).toISOString(),
    }));

    const csv = generateCsv(
      exportData as unknown as readonly Record<string, unknown>[],
      CSV_COLUMNS as unknown as readonly { key: string; header: string }[],
    );
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadCsv(csv, `users-${timestamp}.csv`);
  }, [data.users]);

  if (data.users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        사용자 데이터가 없습니다
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / data.pageSize);

  const handleRowClick = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          CSV 내보내기
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>사용자 ID</TableHead>
            <TableHead>조직</TableHead>
            <TableHead className="text-right">비용</TableHead>
            <TableHead className="text-right">토큰</TableHead>
            <TableHead className="text-right">세션</TableHead>
            <TableHead>마지막 활동</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.users.map((user) => (
            <TableRow
              key={user.accountUuid}
              className="cursor-pointer"
              onClick={() => handleRowClick(user.accountUuid)}
            >
              <TableCell className="font-mono text-sm">
                {truncateUuid(user.accountUuid)}
              </TableCell>
              <TableCell>{user.organizationId ?? '-'}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(user.totalCost)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(user.totalTokens)}
              </TableCell>
              <TableCell className="text-right">{user.sessionCount}</TableCell>
              <TableCell>{formatDate(user.lastSeen)}</TableCell>
              <TableCell>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {showPagination && totalPages > 1 && onPageChange && (
        <Pagination
          currentPage={data.page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

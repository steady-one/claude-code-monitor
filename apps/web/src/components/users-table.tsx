'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import type { UsersResponse } from '@claude-code-monitor/shared';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  truncateUuid,
} from '@/lib/format';

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

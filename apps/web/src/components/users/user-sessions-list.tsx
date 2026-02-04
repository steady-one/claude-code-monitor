'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate, truncateUuid } from '@/lib/format';
import type { UserDetail } from '@claude-code-monitor/shared';

interface UserSessionsListProps {
  readonly user: UserDetail;
}

export function UserSessionsList({ user }: UserSessionsListProps) {
  const { recentSessions } = user;

  if (recentSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>최근 세션</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            세션 데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 세션</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>세션 ID</TableHead>
              <TableHead>시작 시간</TableHead>
              <TableHead className="text-right">비용</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentSessions.map((session) => (
              <TableRow key={session.sessionId}>
                <TableCell className="font-mono text-sm">
                  {truncateUuid(session.sessionId)}
                </TableCell>
                <TableCell>{formatDate(session.startTime)}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(session.cost)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

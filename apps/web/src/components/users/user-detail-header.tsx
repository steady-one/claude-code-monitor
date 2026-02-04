'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate, truncateUuid } from '@/lib/format';
import type { UserDetail } from '@claude-code-monitor/shared';

interface UserDetailHeaderProps {
  readonly user: UserDetail;
}

export function UserDetailHeader({ user }: UserDetailHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono">
              {truncateUuid(user.userId)}
            </h1>
            {user.organizationId && (
              <Badge variant="secondary">{user.organizationId}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            첫 활동: {formatDate(user.firstSeen)} | 최근 활동: {formatDate(user.lastSeen)}
          </p>
        </div>
      </div>
    </div>
  );
}

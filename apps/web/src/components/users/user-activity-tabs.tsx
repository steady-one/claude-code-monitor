'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserSessionsList } from './user-sessions-list';
import { UserDailyStatsTable } from './user-daily-stats-table';
import type { UserDetail } from '@claude-code-monitor/shared';

interface UserActivityTabsProps {
  readonly user: UserDetail;
  readonly from: number;
  readonly to: number;
}

export function UserActivityTabs({ user, from, to }: UserActivityTabsProps) {
  return (
    <Tabs defaultValue="sessions" className="w-full">
      <TabsList>
        <TabsTrigger value="sessions">세션 히스토리</TabsTrigger>
        <TabsTrigger value="stats">사용량 통계</TabsTrigger>
      </TabsList>
      <TabsContent value="sessions">
        <UserSessionsList user={user} />
      </TabsContent>
      <TabsContent value="stats">
        <UserDailyStatsTable userId={user.userId} from={from} to={to} />
      </TabsContent>
    </Tabs>
  );
}

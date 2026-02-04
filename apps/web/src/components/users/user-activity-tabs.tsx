'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserSessionsList } from './user-sessions-list';
import { UserDailyStatsTable } from './user-daily-stats-table';

interface UserActivityTabsProps {
  readonly userId: string;
  readonly from: number;
  readonly to: number;
}

export function UserActivityTabs({ userId, from, to }: UserActivityTabsProps) {
  return (
    <Tabs defaultValue="stats" className="w-full">
      <TabsList>
        <TabsTrigger value="sessions">세션 히스토리</TabsTrigger>
        <TabsTrigger value="stats">사용량 통계</TabsTrigger>
      </TabsList>
      <TabsContent value="sessions">
        <UserSessionsList userId={userId} from={from} to={to} />
      </TabsContent>
      <TabsContent value="stats">
        <UserDailyStatsTable userId={userId} from={from} to={to} />
      </TabsContent>
    </Tabs>
  );
}

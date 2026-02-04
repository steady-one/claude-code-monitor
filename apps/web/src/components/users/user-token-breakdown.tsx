'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TokenBreakdownChart } from '@/components/charts/token-breakdown-chart';
import { CacheEfficiencyChart } from '@/components/charts/cache-efficiency-chart';
import type { UserDetail } from '@claude-code-monitor/shared';

interface UserTokenBreakdownProps {
  readonly user: UserDetail;
}

export function UserTokenBreakdown({ user }: UserTokenBreakdownProps) {
  const { stats } = user;

  const tokenData = {
    input: stats.inputTokens,
    output: stats.outputTokens,
    cacheRead: stats.cacheReadTokens,
    cacheCreation: stats.cacheCreationTokens,
    total: stats.totalTokens,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>토큰 분석</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="breakdown" className="space-y-4">
          <TabsList>
            <TabsTrigger value="breakdown">분류별 비율</TabsTrigger>
            <TabsTrigger value="cache">캐시 효율성</TabsTrigger>
          </TabsList>
          <TabsContent value="breakdown">
            <TokenBreakdownChart data={tokenData} />
          </TabsContent>
          <TabsContent value="cache">
            <CacheEfficiencyChart data={tokenData} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

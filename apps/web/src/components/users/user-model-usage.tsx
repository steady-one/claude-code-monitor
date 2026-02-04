'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModelUsageChart } from '@/components/charts/model-usage-chart';
import type { UserDetail } from '@claude-code-monitor/shared';

interface UserModelUsageProps {
  readonly user: UserDetail;
}

export function UserModelUsage({ user }: UserModelUsageProps) {
  const { stats } = user;

  const modelData = Object.entries(stats.modelUsage).map(([model, data]) => ({
    model,
    cost: data.cost,
    tokens: data.tokens,
  }));

  if (modelData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>모델별 사용량</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            모델 사용 데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>모델별 사용량</CardTitle>
      </CardHeader>
      <CardContent>
        <ModelUsageChart data={modelData} />
      </CardContent>
    </Card>
  );
}

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';
import type { UserCostTimeSeriesResponse } from '@claude-code-monitor/shared';
import { formatTimestamp, formatCurrency, truncateUuid } from '@/lib/format';
import { USER_COLORS } from '@/lib/chart-colors';
import { EmptyState } from '@/components/ui/empty-state';

interface MultiUserCostChartProps {
  readonly data: UserCostTimeSeriesResponse;
}

export function MultiUserCostChart({ data }: MultiUserCostChartProps) {
  if (data.data.length === 0) {
    return (
      <EmptyState
        icon={LineChartIcon}
        title="비용 데이터 없음"
        description="선택한 기간에 비용 데이터가 없습니다"
        className="h-[300px]"
      />
    );
  }

  const allTimestamps = new Set<number>();
  const userIds = data.data.map((user) => user.userId);

  for (const user of data.data) {
    for (const point of user.data) {
      allTimestamps.add(point.timestamp);
    }
  }

  const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

  const chartData = sortedTimestamps.map((timestamp) => {
    const point: Record<string, number | string> = {
      timestamp,
      label: formatTimestamp(timestamp, data.interval),
    };

    for (const user of data.data) {
      const dataPoint = user.data.find((d) => d.timestamp === timestamp);
      point[user.userId] = dataPoint?.value ?? 0;
    }

    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          tickFormatter={(value) => `$${value.toFixed(2)}`}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatCurrency(value),
            truncateUuid(name),
          ]}
          labelFormatter={(label) => `시간: ${label}`}
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.5rem',
          }}
        />
        <Legend
          formatter={(value: string) => truncateUuid(value)}
        />
        {userIds.map((userId, index) => (
          <Line
            key={userId}
            type="monotone"
            dataKey={userId}
            name={userId}
            stroke={USER_COLORS[index % USER_COLORS.length]}
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

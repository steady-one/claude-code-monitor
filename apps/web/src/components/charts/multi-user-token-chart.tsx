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
import type { UserTokenTimeSeriesResponse } from '@claude-code-monitor/shared';
import { formatTimestamp, formatCompactNumber, truncateUuid } from '@/lib/format';

interface MultiUserTokenChartProps {
  readonly data: UserTokenTimeSeriesResponse;
}

const USER_COLORS = [
  'oklch(0.65 0.2 250)',
  'oklch(0.6 0.18 165)',
  'oklch(0.75 0.15 85)',
  'oklch(0.6 0.2 300)',
  'oklch(0.55 0.15 45)',
  'oklch(0.7 0.18 200)',
  'oklch(0.65 0.15 130)',
  'oklch(0.58 0.2 350)',
];

export function MultiUserTokenChart({ data }: MultiUserTokenChartProps) {
  if (data.data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        토큰 데이터가 없습니다
      </div>
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
          tickFormatter={formatCompactNumber}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatCompactNumber(value),
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

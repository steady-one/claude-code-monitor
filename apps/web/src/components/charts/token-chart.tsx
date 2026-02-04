'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TokenTimeSeriesResponse } from '@claude-code-monitor/shared';

interface TokenChartProps {
  readonly data: TokenTimeSeriesResponse;
}

function formatTimestamp(timestamp: number, interval: 'hour' | 'day'): string {
  const date = new Date(timestamp);
  if (interval === 'day') {
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleTimeString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
  });
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

export function TokenChart({ data }: TokenChartProps) {
  const chartData = data.data.map((point) => ({
    timestamp: point.timestamp,
    value: point.value,
    label: formatTimestamp(point.timestamp, data.interval),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
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
          tickFormatter={formatNumber}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <Tooltip
          formatter={(value: number) => [
            value.toLocaleString('ko-KR'),
            '토큰',
          ]}
          labelFormatter={(label) => `시간: ${label}`}
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.5rem',
          }}
        />
        <Bar dataKey="value" fill="oklch(0.6 0.18 165)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

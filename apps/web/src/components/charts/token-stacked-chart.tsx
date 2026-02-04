'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DetailedTokenDataPoint } from '@claude-code-monitor/shared';
import { formatTimestamp, formatCompactNumber } from '@/lib/format';

interface TokenStackedChartProps {
  readonly data: readonly DetailedTokenDataPoint[];
  readonly interval: 'hour' | 'day';
}

const COLORS = {
  input: 'oklch(0.65 0.2 250)',
  output: 'oklch(0.6 0.18 165)',
  cacheRead: 'oklch(0.75 0.15 85)',
  cacheCreation: 'oklch(0.6 0.2 300)',
};

export function TokenStackedChart({ data, interval }: TokenStackedChartProps) {
  const chartData = data.map((point) => ({
    timestamp: point.timestamp,
    label: formatTimestamp(point.timestamp, interval),
    input: point.input,
    output: point.output,
    cacheRead: point.cacheRead,
    cacheCreation: point.cacheCreation,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        토큰 데이터가 없습니다
      </div>
    );
  }

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
          tickFormatter={formatCompactNumber}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            const labels: Record<string, string> = {
              input: 'Input',
              output: 'Output',
              cacheRead: 'Cache Read',
              cacheCreation: 'Cache Creation',
            };
            return [formatCompactNumber(value), labels[name] || name];
          }}
          labelFormatter={(label) => `시간: ${label}`}
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.5rem',
          }}
        />
        <Legend />
        <Bar
          dataKey="input"
          stackId="tokens"
          fill={COLORS.input}
          name="Input"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="output"
          stackId="tokens"
          fill={COLORS.output}
          name="Output"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="cacheRead"
          stackId="tokens"
          fill={COLORS.cacheRead}
          name="Cache Read"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="cacheCreation"
          stackId="tokens"
          fill={COLORS.cacheCreation}
          name="Cache Creation"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

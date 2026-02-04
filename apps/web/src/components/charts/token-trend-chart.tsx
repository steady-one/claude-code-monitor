'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DetailedTokenDataPoint } from '@claude-code-monitor/shared';
import { formatTimestamp, formatCompactNumber } from '@/lib/format';

interface TokenTrendChartProps {
  readonly data: readonly DetailedTokenDataPoint[];
  readonly interval: 'hour' | 'day';
}

const COLORS = {
  input: 'oklch(0.65 0.2 250)',
  output: 'oklch(0.6 0.18 165)',
  cacheRead: 'oklch(0.75 0.15 85)',
  cacheCreation: 'oklch(0.6 0.2 300)',
};

export function TokenTrendChart({ data, interval }: TokenTrendChartProps) {
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
        토큰 추이 데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorInput" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.input} stopOpacity={0.8} />
              <stop offset="95%" stopColor={COLORS.input} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.output} stopOpacity={0.8} />
              <stop offset="95%" stopColor={COLORS.output} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorCacheRead" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.cacheRead} stopOpacity={0.8} />
              <stop offset="95%" stopColor={COLORS.cacheRead} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorCacheCreation" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.cacheCreation} stopOpacity={0.8} />
              <stop offset="95%" stopColor={COLORS.cacheCreation} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            tickFormatter={(value) => formatCompactNumber(value)}
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
          <Area
            type="monotone"
            dataKey="input"
            stackId="1"
            stroke={COLORS.input}
            fill="url(#colorInput)"
            name="Input"
          />
          <Area
            type="monotone"
            dataKey="output"
            stackId="1"
            stroke={COLORS.output}
            fill="url(#colorOutput)"
            name="Output"
          />
          <Area
            type="monotone"
            dataKey="cacheRead"
            stackId="1"
            stroke={COLORS.cacheRead}
            fill="url(#colorCacheRead)"
            name="Cache Read"
          />
          <Area
            type="monotone"
            dataKey="cacheCreation"
            stackId="1"
            stroke={COLORS.cacheCreation}
            fill="url(#colorCacheCreation)"
            name="Cache Creation"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

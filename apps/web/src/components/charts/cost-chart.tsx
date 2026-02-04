'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { CostTimeSeriesResponse } from '@claude-code-monitor/shared';

interface CostChartProps {
  readonly data: CostTimeSeriesResponse;
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

export function CostChart({ data }: CostChartProps) {
  const chartData = data.data.map((point) => ({
    timestamp: point.timestamp,
    value: point.value,
    label: formatTimestamp(point.timestamp, data.interval),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="oklch(0.65 0.2 250)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="oklch(0.65 0.2 250)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          formatter={(value: number) => [formatCurrency(value), '비용']}
          labelFormatter={(label) => `시간: ${label}`}
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.5rem',
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="oklch(0.65 0.2 250)"
          fillOpacity={1}
          fill="url(#colorCost)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

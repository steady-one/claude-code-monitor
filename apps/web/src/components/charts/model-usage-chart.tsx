'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrency, formatCompactNumber } from '@/lib/format';

interface ModelUsageData {
  readonly model: string;
  readonly cost: number;
  readonly tokens: number;
}

interface ModelUsageChartProps {
  readonly data: readonly ModelUsageData[];
}

const COLORS = [
  'oklch(0.65 0.2 250)',
  'oklch(0.6 0.18 165)',
  'oklch(0.75 0.15 85)',
  'oklch(0.6 0.2 300)',
  'oklch(0.55 0.15 45)',
];

export function ModelUsageChart({ data }: ModelUsageChartProps) {
  const sortedData = [...data].sort((a, b) => b.cost - a.cost);

  if (sortedData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        모델 사용 데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 100, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(value) => `$${value.toFixed(2)}`}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            type="category"
            dataKey="model"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            width={90}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'cost') {
                return [formatCurrency(value), '비용'];
              }
              return [formatCompactNumber(value), '토큰'];
            }}
            contentStyle={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.5rem',
            }}
          />
          <Bar dataKey="cost" name="cost" radius={[0, 4, 4, 0]}>
            {sortedData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

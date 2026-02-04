'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCompactNumber, formatPercentage } from '@/lib/format';

interface TokenBreakdownData {
  readonly input: number;
  readonly output: number;
  readonly cacheRead: number;
  readonly cacheCreation: number;
  readonly total: number;
}

interface TokenBreakdownChartProps {
  readonly data: TokenBreakdownData;
}

const COLORS = {
  input: 'oklch(0.65 0.2 250)',
  output: 'oklch(0.6 0.18 165)',
  cacheRead: 'oklch(0.75 0.15 85)',
  cacheCreation: 'oklch(0.6 0.2 300)',
};

const LABELS = {
  input: 'Input',
  output: 'Output',
  cacheRead: 'Cache Read',
  cacheCreation: 'Cache Creation',
};

export function TokenBreakdownChart({ data }: TokenBreakdownChartProps) {
  const chartData = [
    { name: LABELS.input, value: data.input, key: 'input' },
    { name: LABELS.output, value: data.output, key: 'output' },
    { name: LABELS.cacheRead, value: data.cacheRead, key: 'cacheRead' },
    { name: LABELS.cacheCreation, value: data.cacheCreation, key: 'cacheCreation' },
  ].filter((item) => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        토큰 데이터가 없습니다
      </div>
    );
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${formatPercentage(percent * 100, 0)}`}
            labelLine={false}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.key}
                fill={COLORS[entry.key as keyof typeof COLORS]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [formatCompactNumber(value), '토큰']}
            contentStyle={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: '0.5rem',
            }}
          />
          <Legend
            formatter={(value) => <span className="text-sm">{value}</span>}
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-lg font-semibold"
          >
            {formatCompactNumber(data.total)}
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

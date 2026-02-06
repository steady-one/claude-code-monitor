'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { formatCurrency, formatCompactNumber } from '@/lib/format';
import { MODEL_COLORS } from '@/lib/chart-colors';
import { EmptyState } from '@/components/ui/empty-state';

interface ModelUsageData {
  readonly model: string;
  readonly cost: number;
  readonly tokens: number;
}

interface ModelUsageChartProps {
  readonly data: readonly ModelUsageData[];
}

/** 각 모델의 비용/토큰 비율(%)을 계산 */
function calcPercentages(
  data: readonly ModelUsageData[],
): readonly { readonly costPct: number; readonly tokenPct: number }[] {
  const totalCost = data.reduce((sum, d) => sum + d.cost, 0);
  const totalTokens = data.reduce((sum, d) => sum + d.tokens, 0);

  return data.map((d) => ({
    costPct: totalCost > 0 ? (d.cost / totalCost) * 100 : 0,
    tokenPct: totalTokens > 0 ? (d.tokens / totalTokens) * 100 : 0,
  }));
}

type CustomTooltipProps = TooltipProps<number, string> & {
  readonly percentages: readonly { readonly costPct: number; readonly tokenPct: number }[];
  readonly sortedData: readonly ModelUsageData[];
};

function CustomTooltip({ active, payload, label, percentages, sortedData }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const idx = sortedData.findIndex((d) => d.model === label);
  const pct = idx >= 0 ? percentages[idx] : null;

  return (
    <div
      className="rounded-lg border bg-card p-3 shadow-md"
      style={{ minWidth: 180 }}
    >
      <p className="mb-2 text-sm font-medium">{label}</p>
      {payload.map((entry) => {
        const isCost = entry.dataKey === 'cost';
        const value = entry.value ?? 0;
        const pctValue = pct ? (isCost ? pct.costPct : pct.tokenPct) : 0;

        return (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              {isCost ? '비용' : '토큰'}
            </span>
            <span className="font-mono">
              {isCost ? formatCurrency(value) : formatCompactNumber(value)}
              <span className="ml-1 text-muted-foreground">
                ({pctValue.toFixed(1)}%)
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** 토큰용 보조 색상 (비용 색상의 더 밝은 변형) */
const TOKEN_COLORS: readonly string[] = [
  'oklch(0.78 0.12 250)',
  'oklch(0.75 0.11 165)',
  'oklch(0.85 0.09 85)',
  'oklch(0.75 0.12 300)',
  'oklch(0.72 0.09 45)',
] as const;

export function ModelUsageChart({ data }: ModelUsageChartProps) {
  const sortedData = useMemo(() => [...data].sort((a, b) => b.cost - a.cost), [data]);
  const percentages = useMemo(() => calcPercentages(sortedData), [sortedData]);

  if (sortedData.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="모델 사용 데이터 없음"
        description="선택한 기간에 모델 사용 데이터가 없습니다"
        className="h-[300px]"
      />
    );
  }

  return (
    <div className="h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(value) => `$${value.toFixed(2)}`}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            xAxisId="cost"
          />
          <XAxis
            type="number"
            tickFormatter={(value) => formatCompactNumber(value)}
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            xAxisId="tokens"
            orientation="top"
            hide
          />
          <YAxis
            type="category"
            dataKey="model"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            width={90}
          />
          <Tooltip
            content={
              <CustomTooltip
                percentages={percentages}
                sortedData={sortedData}
              />
            }
          />
          <Legend
            formatter={(value: string) => (value === 'cost' ? '비용' : '토큰')}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="cost" name="cost" xAxisId="cost" radius={[0, 4, 4, 0]} barSize={12}>
            {sortedData.map((_, index) => (
              <Cell key={`cost-${index}`} fill={MODEL_COLORS[index % MODEL_COLORS.length]} />
            ))}
          </Bar>
          <Bar dataKey="tokens" name="tokens" xAxisId="tokens" radius={[0, 4, 4, 0]} barSize={12}>
            {sortedData.map((_, index) => (
              <Cell key={`token-${index}`} fill={TOKEN_COLORS[index % TOKEN_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

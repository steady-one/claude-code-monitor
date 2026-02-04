'use client';

import { formatPercentage, formatCompactNumber } from '@/lib/format';

interface CacheEfficiencyData {
  readonly input: number;
  readonly output: number;
  readonly cacheRead: number;
  readonly cacheCreation: number;
  readonly total: number;
}

interface CacheEfficiencyChartProps {
  readonly data: CacheEfficiencyData;
}

function getEfficiencyGrade(percentage: number): {
  label: string;
  color: string;
} {
  if (percentage >= 70) {
    return { label: '매우 좋음', color: 'text-emerald-600' };
  }
  if (percentage >= 50) {
    return { label: '좋음', color: 'text-green-600' };
  }
  if (percentage >= 30) {
    return { label: '보통', color: 'text-amber-600' };
  }
  return { label: '개선 필요', color: 'text-red-600' };
}

export function CacheEfficiencyChart({ data }: CacheEfficiencyChartProps) {
  const cacheHitRate =
    data.total > 0 ? (data.cacheRead / data.total) * 100 : 0;

  const cacheCreationRate =
    data.total > 0 ? (data.cacheCreation / data.total) * 100 : 0;

  const grade = getEfficiencyGrade(cacheHitRate);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">캐시 히트율</span>
          <span className={`text-sm font-semibold ${grade.color}`}>
            {grade.label}
          </span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${Math.min(cacheHitRate, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatPercentage(cacheHitRate)}</span>
          <span>{formatCompactNumber(data.cacheRead)} / {formatCompactNumber(data.total)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">캐시 생성 비율</span>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-purple-500 transition-all duration-500"
            style={{ width: `${Math.min(cacheCreationRate, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatPercentage(cacheCreationRate)}</span>
          <span>{formatCompactNumber(data.cacheCreation)} / {formatCompactNumber(data.total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Input 토큰</p>
          <p className="text-lg font-semibold">{formatCompactNumber(data.input)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Output 토큰</p>
          <p className="text-lg font-semibold">{formatCompactNumber(data.output)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Cache Read</p>
          <p className="text-lg font-semibold">{formatCompactNumber(data.cacheRead)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Cache Creation</p>
          <p className="text-lg font-semibold">{formatCompactNumber(data.cacheCreation)}</p>
        </div>
      </div>
    </div>
  );
}

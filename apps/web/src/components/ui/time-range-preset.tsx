'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { CalendarDays } from 'lucide-react';

export type TimeRangePreset = 'today' | '7d' | '30d' | '90d' | 'custom';

/** 커스텀 날짜 범위 (밀리초 단위) */
export interface CustomRange {
  readonly from: number;
  readonly to: number;
}

interface TimeRangePresetOption {
  readonly value: TimeRangePreset;
  readonly label: string;
}

const presetOptions: readonly TimeRangePresetOption[] = [
  { value: 'today', label: '오늘' },
  { value: '7d', label: '7일' },
  { value: '30d', label: '30일' },
  { value: '90d', label: '90일' },
];

interface TimeRangePresetButtonsProps {
  readonly value: TimeRangePreset;
  readonly onChange: (value: TimeRangePreset) => void;
  readonly customRange?: CustomRange | null;
  readonly onCustomRangeChange?: (range: CustomRange) => void;
  readonly className?: string;
}

/** 날짜 문자열(YYYY-MM-DD)을 해당 날짜 자정(로컬)의 밀리초로 변환 */
function dateStringToMs(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).getTime();
}

/** 밀리초를 YYYY-MM-DD 문자열로 변환 */
function msToDateString(ms: number): string {
  const d = new Date(ms);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function TimeRangePresetButtons({
  value,
  onChange,
  customRange,
  onCustomRangeChange,
  className,
}: TimeRangePresetButtonsProps) {
  const [showPicker, setShowPicker] = React.useState(false);
  const pickerRef = React.useRef<HTMLDivElement>(null);

  // 현재 커스텀 범위의 기본값
  const defaultFrom = customRange?.from ?? Date.now() - 7 * 24 * 60 * 60 * 1000;
  const defaultTo = customRange?.to ?? Date.now();

  const [fromDate, setFromDate] = React.useState(msToDateString(defaultFrom));
  const [toDate, setToDate] = React.useState(msToDateString(defaultTo));

  // 외부 클릭 시 picker 닫기
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  const handleCustomApply = () => {
    const fromMs = dateStringToMs(fromDate);
    // to 날짜는 해당 날짜의 끝(23:59:59.999)으로 설정
    const toMs = dateStringToMs(toDate) + 24 * 60 * 60 * 1000 - 1;

    if (fromMs > toMs) return;

    onCustomRangeChange?.({ from: fromMs, to: toMs });
    onChange('custom');
    setShowPicker(false);
  };

  const todayStr = msToDateString(Date.now());

  // 커스텀 선택 시 표시할 라벨
  const customLabel = value === 'custom' && customRange
    ? `${msToDateString(customRange.from)} ~ ${msToDateString(customRange.to)}`
    : null;

  return (
    <div className={cn('inline-flex items-center gap-1 rounded-lg bg-muted p-1', className)}>
      {presetOptions.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange(option.value)}
          className={cn(
            'h-7 px-3',
            value === option.value && 'shadow-sm',
          )}
        >
          {option.label}
        </Button>
      ))}

      {/* 커스텀 날짜 범위 버튼 */}
      <div className="relative" ref={pickerRef}>
        <Button
          variant={value === 'custom' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setShowPicker((prev) => !prev)}
          className={cn(
            'h-7 px-3 gap-1',
            value === 'custom' && 'shadow-sm',
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {customLabel ? (
            <span className="text-xs">{customLabel}</span>
          ) : (
            '직접 선택'
          )}
        </Button>

        {showPicker && (
          <div className="absolute right-0 top-full z-50 mt-2 rounded-lg border bg-popover p-4 shadow-md">
            <div className="flex flex-col gap-3">
              <div className="text-sm font-medium">날짜 범위 선택</div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">시작일</label>
                  <input
                    type="date"
                    value={fromDate}
                    max={toDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="h-8 rounded-md border bg-background px-2 text-sm"
                  />
                </div>
                <span className="mt-5 text-muted-foreground">~</span>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">종료일</label>
                  <input
                    type="date"
                    value={toDate}
                    min={fromDate}
                    max={todayStr}
                    onChange={(e) => setToDate(e.target.value)}
                    className="h-8 rounded-md border bg-background px-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPicker(false)}
                >
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={handleCustomApply}
                  disabled={!fromDate || !toDate}
                >
                  적용
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function getTimeRangeFromPreset(
  preset: TimeRangePreset,
  customRange?: CustomRange | null,
): { from: number; to: number } {
  if (preset === 'custom' && customRange) {
    return { from: customRange.from, to: customRange.to };
  }

  const now = Date.now();
  const to = now;

  switch (preset) {
    case 'today': {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      return { from: startOfDay.getTime(), to };
    }
    case '7d':
      return { from: now - 7 * 24 * 60 * 60 * 1000, to };
    case '30d':
      return { from: now - 30 * 24 * 60 * 60 * 1000, to };
    case '90d':
      return { from: now - 90 * 24 * 60 * 60 * 1000, to };
    case 'custom':
      // customRange가 없으면 7일로 폴백
      return { from: now - 7 * 24 * 60 * 60 * 1000, to };
  }
}

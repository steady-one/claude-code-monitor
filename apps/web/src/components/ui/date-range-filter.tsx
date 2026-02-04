'use client';

import { useCallback } from 'react';
import { Button } from './button';
import { Input } from './input';

interface DateRangeFilterProps {
  readonly from: number;
  readonly to: number;
  readonly onChange: (range: { from: number; to: number }) => void;
  readonly className?: string;
}

function timestampToDateString(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
}

function dateStringToTimestamp(dateString: string, endOfDay: boolean): number {
  const date = new Date(dateString);
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date.getTime();
}

export function DateRangeFilter({
  from,
  to,
  onChange,
  className,
}: DateRangeFilterProps) {
  const handleFromChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFrom = dateStringToTimestamp(e.target.value, false);
      if (newFrom <= to) {
        onChange({ from: newFrom, to });
      }
    },
    [to, onChange],
  );

  const handleToChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTo = dateStringToTimestamp(e.target.value, true);
      if (newTo >= from) {
        onChange({ from, to: newTo });
      }
    },
    [from, onChange],
  );

  const handleReset = useCallback(() => {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    onChange({ from: sevenDaysAgo, to: now });
  }, [onChange]);

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <Input
        type="date"
        value={timestampToDateString(from)}
        onChange={handleFromChange}
        className="w-36"
      />
      <span className="text-muted-foreground">~</span>
      <Input
        type="date"
        value={timestampToDateString(to)}
        onChange={handleToChange}
        className="w-36"
      />
      <Button variant="outline" size="sm" onClick={handleReset}>
        초기화
      </Button>
    </div>
  );
}

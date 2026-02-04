'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export type TimeRangePreset = 'today' | '7d' | '30d' | '90d';

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
  readonly className?: string;
}

export function TimeRangePresetButtons({
  value,
  onChange,
  className,
}: TimeRangePresetButtonsProps) {
  return (
    <div className={cn('inline-flex gap-1 rounded-lg bg-muted p-1', className)}>
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
    </div>
  );
}

export function getTimeRangeFromPreset(preset: TimeRangePreset): {
  from: number;
  to: number;
} {
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
  }
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDetailedTokens, fetchModelStats } from '@/lib/api';

interface UseDetailedTokensParams {
  from?: number;
  to?: number;
  interval?: 'hour' | 'day';
  userId?: string;
}

export function useDetailedTokens(params: UseDetailedTokensParams = {}) {
  return useQuery({
    queryKey: ['detailed-tokens', params],
    queryFn: () => fetchDetailedTokens(params),
  });
}

interface UseModelStatsParams {
  from?: number;
  to?: number;
  userId?: string;
}

export function useModelStats(params: UseModelStatsParams = {}) {
  return useQuery({
    queryKey: ['model-stats', params],
    queryFn: () => fetchModelStats(params),
  });
}

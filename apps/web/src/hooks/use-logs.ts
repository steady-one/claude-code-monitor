'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchLogs, fetchLogsSummary } from '@/lib/api';

interface UseLogsParams {
  from?: number;
  to?: number;
  page?: number;
  pageSize?: number;
  status?: string;
  endpoint?: string;
}

export function useLogs(params: UseLogsParams = {}) {
  return useQuery({
    queryKey: ['logs', params],
    queryFn: () => fetchLogs(params),
  });
}

interface UseLogsSummaryParams {
  from?: number;
  to?: number;
}

export function useLogsSummary(params: UseLogsSummaryParams = {}) {
  return useQuery({
    queryKey: ['logs-summary', params],
    queryFn: () => fetchLogsSummary(params),
  });
}

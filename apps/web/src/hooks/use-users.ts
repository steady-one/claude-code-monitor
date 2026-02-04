'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchUsers, fetchUserDetail, fetchUserDailyStats } from '@/lib/api';
import type { StatsGroupBy } from '@claude-code-monitor/shared';

interface UseUsersParams {
  from?: number;
  to?: number;
  page?: number;
  pageSize?: number;
}

export function useUsers(params: UseUsersParams = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => fetchUsers(params),
  });
}

interface UseUserDetailParams {
  from?: number;
  to?: number;
}

export function useUserDetail(userId: string, params: UseUserDetailParams = {}) {
  return useQuery({
    queryKey: ['user', userId, params],
    queryFn: () => fetchUserDetail(userId, params),
    enabled: !!userId,
  });
}

interface UseUserDailyStatsParams {
  from?: number;
  to?: number;
  groupBy?: StatsGroupBy;
}

export function useUserDailyStats(
  userId: string,
  params: UseUserDailyStatsParams = {},
) {
  return useQuery({
    queryKey: ['user-daily-stats', userId, params],
    queryFn: () => fetchUserDailyStats(userId, params),
    enabled: !!userId,
  });
}

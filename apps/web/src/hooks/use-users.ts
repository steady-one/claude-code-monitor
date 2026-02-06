'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchUsers,
  fetchUserDetail,
  fetchUserDailyStats,
  fetchUserSessions,
  fetchCostTimeSeries,
  fetchDetailedTokens,
} from '@/lib/api';
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

interface UseUserSessionsParams {
  from?: number;
  to?: number;
  page?: number;
  pageSize?: number;
}

export function useUserSessions(
  userId: string,
  params: UseUserSessionsParams = {},
) {
  return useQuery({
    queryKey: ['user-sessions', userId, params],
    queryFn: () => fetchUserSessions(userId, params),
    enabled: !!userId,
  });
}

interface UseUserTimeSeriesParams {
  from?: number;
  to?: number;
  interval?: 'hour' | 'day';
}

export function useUserCostTimeSeries(
  userId: string,
  params: UseUserTimeSeriesParams = {},
) {
  return useQuery({
    queryKey: ['user-cost-timeseries', userId, params],
    queryFn: () => fetchCostTimeSeries({ ...params, userId }),
    enabled: !!userId,
  });
}

export function useUserDetailedTokens(
  userId: string,
  params: UseUserTimeSeriesParams = {},
) {
  return useQuery({
    queryKey: ['user-detailed-tokens', userId, params],
    queryFn: () => fetchDetailedTokens({ ...params, userId }),
    enabled: !!userId,
  });
}

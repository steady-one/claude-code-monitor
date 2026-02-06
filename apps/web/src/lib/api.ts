import type {
  MetricsSummary,
  CostTimeSeriesResponse,
  TokenTimeSeriesResponse,
  UsersResponse,
  UserDetail,
  DetailedTokensResponse,
  ModelsStatsResponse,
  RequestLogsResponse,
  RequestLogsSummary,
  UserDailyStatsResponse,
  UserSessionsResponse,
  StatsGroupBy,
  UserCostTimeSeriesResponse,
  UserTokenTimeSeriesResponse,
} from '@claude-code-monitor/shared';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4317';

const API_AUTH_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN ?? '';

type QueryParams = Record<string, string | number | undefined>;

async function fetchApi<T>(
  endpoint: string,
  params?: QueryParams,
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (API_AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${API_AUTH_TOKEN}`;
  }

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

interface TimeRangeParams {
  from?: number;
  to?: number;
  interval?: 'hour' | 'day';
}

interface PaginatedTimeRangeParams extends TimeRangeParams {
  page?: number;
  pageSize?: number;
}

interface LogsParams extends PaginatedTimeRangeParams {
  status?: string;
  endpoint?: string;
}

interface SummaryParams extends TimeRangeParams {
  comparePreviousPeriod?: boolean;
}

export async function fetchSummary(
  params?: SummaryParams,
): Promise<MetricsSummary> {
  return fetchApi<MetricsSummary>('/api/metrics/summary', params as QueryParams);
}

export async function fetchCostTimeSeries(
  params?: TimeRangeParams & { userId?: string },
): Promise<CostTimeSeriesResponse> {
  return fetchApi<CostTimeSeriesResponse>('/api/metrics/cost', params as QueryParams);
}

export async function fetchTokenTimeSeries(
  params?: TimeRangeParams & { userId?: string },
): Promise<TokenTimeSeriesResponse> {
  return fetchApi<TokenTimeSeriesResponse>('/api/metrics/tokens', params as QueryParams);
}

export async function fetchUsers(
  params?: PaginatedTimeRangeParams,
): Promise<UsersResponse> {
  return fetchApi<UsersResponse>('/api/metrics/users', params as QueryParams);
}

export async function fetchUserDetail(
  userId: string,
  params?: TimeRangeParams,
): Promise<UserDetail> {
  return fetchApi<UserDetail>(`/api/users/${userId}`, params as QueryParams);
}

export async function fetchDetailedTokens(
  params?: TimeRangeParams & { userId?: string },
): Promise<DetailedTokensResponse> {
  return fetchApi<DetailedTokensResponse>('/api/metrics/tokens/detailed', params as QueryParams);
}

export async function fetchModelStats(
  params?: TimeRangeParams & { userId?: string },
): Promise<ModelsStatsResponse> {
  return fetchApi<ModelsStatsResponse>('/api/metrics/models', params as QueryParams);
}

export async function fetchLogs(
  params?: LogsParams,
): Promise<RequestLogsResponse> {
  return fetchApi<RequestLogsResponse>('/api/logs', params as QueryParams);
}

export async function fetchLogsSummary(
  params?: TimeRangeParams,
): Promise<RequestLogsSummary> {
  return fetchApi<RequestLogsSummary>('/api/logs/summary', params as QueryParams);
}

interface DailyStatsParams {
  from?: number;
  to?: number;
  groupBy?: StatsGroupBy;
}

export async function fetchUserDailyStats(
  userId: string,
  params?: DailyStatsParams,
): Promise<UserDailyStatsResponse> {
  return fetchApi<UserDailyStatsResponse>(
    `/api/users/${userId}/daily-stats`,
    params as QueryParams,
  );
}

interface UserSessionsParams {
  from?: number;
  to?: number;
  page?: number;
  pageSize?: number;
}

export async function fetchUserSessions(
  userId: string,
  params?: UserSessionsParams,
): Promise<UserSessionsResponse> {
  return fetchApi<UserSessionsResponse>(
    `/api/users/${userId}/sessions`,
    params as QueryParams,
  );
}

export async function fetchUsersCostTimeSeries(
  params?: TimeRangeParams,
): Promise<UserCostTimeSeriesResponse> {
  return fetchApi<UserCostTimeSeriesResponse>(
    '/api/metrics/cost/by-user',
    params as QueryParams,
  );
}

export async function fetchUsersTokenTimeSeries(
  params?: TimeRangeParams,
): Promise<UserTokenTimeSeriesResponse> {
  return fetchApi<UserTokenTimeSeriesResponse>(
    '/api/metrics/tokens/by-user',
    params as QueryParams,
  );
}

/**
 * 대시보드 API 응답 타입
 */

/**
 * 시간 범위 쿼리 파라미터
 */
export interface TimeRangeQuery {
  readonly from?: number;
  readonly to?: number;
  readonly interval?: 'hour' | 'day';
}

/**
 * 요약 통계
 */
export interface MetricsSummary {
  readonly totalCost: number;
  readonly totalTokens: number;
  readonly totalSessions: number;
  readonly uniqueUsers: number;
  readonly totalCommits: number;
  readonly totalPullRequests: number;
  readonly periodStart: number;
  readonly periodEnd: number;
}

/**
 * 시계열 데이터 포인트
 */
export interface TimeSeriesDataPoint {
  readonly timestamp: number;
  readonly value: number;
}

/**
 * 비용 시계열 응답
 */
export interface CostTimeSeriesResponse {
  readonly data: readonly TimeSeriesDataPoint[];
  readonly total: number;
  readonly interval: 'hour' | 'day';
}

/**
 * 토큰 사용량 시계열 응답
 */
export interface TokenTimeSeriesResponse {
  readonly data: readonly TimeSeriesDataPoint[];
  readonly total: number;
  readonly interval: 'hour' | 'day';
}

/**
 * 사용자별 통계
 */
export interface UserStats {
  readonly accountUuid: string;
  readonly organizationId: string | null;
  readonly totalCost: number;
  readonly totalTokens: number;
  readonly sessionCount: number;
  readonly lastSeen: number;
  readonly firstSeen: number;
}

/**
 * 사용자 목록 응답
 */
export interface UsersResponse {
  readonly users: readonly UserStats[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/**
 * API 에러 응답
 */
export interface ApiError {
  readonly statusCode: number;
  readonly message: string;
  readonly error?: string;
}

/**
 * 상세 토큰 데이터 포인트
 */
export interface DetailedTokenDataPoint {
  readonly timestamp: number;
  readonly input: number;
  readonly output: number;
  readonly cacheRead: number;
  readonly cacheCreation: number;
  readonly total: number;
  readonly model: string | null;
}

/**
 * 상세 토큰 요약
 */
export interface DetailedTokenSummary {
  readonly totalInput: number;
  readonly totalOutput: number;
  readonly totalCacheRead: number;
  readonly totalCacheCreation: number;
  readonly total: number;
}

/**
 * 상세 토큰 응답
 */
export interface DetailedTokensResponse {
  readonly data: readonly DetailedTokenDataPoint[];
  readonly summary: DetailedTokenSummary;
}

/**
 * 모델별 통계
 */
export interface ModelStats {
  readonly model: string;
  readonly totalCost: number;
  readonly totalTokens: number;
  readonly requestCount: number;
  readonly avgTokensPerRequest: number;
}

/**
 * 모델 통계 응답
 */
export interface ModelsStatsResponse {
  readonly models: readonly ModelStats[];
}

/**
 * 일별/월별 통계 그룹화 타입
 */
export type StatsGroupBy = 'day' | 'month';

/**
 * 일별/월별 통계 행
 */
export interface DailyStatsRow {
  readonly date: number;
  readonly dateLabel: string;
  readonly models: readonly string[];
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheCreateTokens: number;
  readonly cacheReadTokens: number;
  readonly totalTokens: number;
  readonly totalCost: number;
}

/**
 * 사용자 일별/월별 통계 응답
 */
export interface UserDailyStatsResponse {
  readonly stats: readonly DailyStatsRow[];
  readonly summary: {
    readonly totalInputTokens: number;
    readonly totalOutputTokens: number;
    readonly totalCacheCreateTokens: number;
    readonly totalCacheReadTokens: number;
    readonly totalTokens: number;
    readonly totalCost: number;
  };
}

/**
 * 유저 상세 정보
 */
export interface UserDetail {
  readonly userId: string;
  readonly email?: string;
  readonly organizationId: string | null;
  readonly firstSeen: number;
  readonly lastSeen: number;
  readonly stats: {
    readonly totalCost: number;
    readonly totalTokens: number;
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly cacheReadTokens: number;
    readonly cacheCreationTokens: number;
    readonly sessionCount: number;
    readonly modelUsage: Record<string, { cost: number; tokens: number }>;
  };
}

/**
 * 사용자 세션 정보
 */
export interface UserSession {
  readonly sessionId: string;
  readonly startTime: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly cacheReadTokens: number;
  readonly cacheCreationTokens: number;
  readonly totalTokens: number;
  readonly cost: number;
}

/**
 * 사용자 세션 목록 응답
 */
export interface UserSessionsResponse {
  readonly sessions: readonly UserSession[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/**
 * Claude Code 메트릭 이름 상수
 */
export const METRIC_NAMES = {
  SESSION_COUNT: 'claude_code.session.count',
  TOKEN_USAGE: 'claude_code.token.usage',
  COST_USAGE: 'claude_code.cost.usage',
  LINES_OF_CODE: 'claude_code.lines_of_code.count',
  COMMIT_COUNT: 'claude_code.commit.count',
  PULL_REQUEST_COUNT: 'claude_code.pull_request.count',
} as const;

export type MetricName = (typeof METRIC_NAMES)[keyof typeof METRIC_NAMES];

/**
 * 원시 메트릭 레코드
 */
export interface RawMetric {
  readonly id: number;
  readonly metricName: string;
  readonly metricValue: number;
  readonly timestamp: number;
  readonly sessionId: string | null;
  readonly userAccountUuid: string | null;
  readonly organizationId: string | null;
  readonly attributes: Record<string, unknown> | null;
  readonly createdAt: number;
}

/**
 * 시간별 집계 레코드
 */
export interface HourlyAggregate {
  readonly id: number;
  readonly metricName: string;
  readonly hourTimestamp: number;
  readonly userAccountUuid: string | null;
  readonly sumValue: number;
  readonly countValue: number;
  readonly attributesHash: string | null;
  readonly attributes: Record<string, unknown> | null;
}

/**
 * 사용자 캐시 레코드
 */
export interface User {
  readonly accountUuid: string;
  readonly organizationId: string | null;
  readonly firstSeen: number;
  readonly lastSeen: number;
  readonly totalCost: number;
  readonly totalTokens: number;
}

/**
 * 메트릭 삽입용 DTO
 */
export interface InsertMetricDto {
  readonly metricName: string;
  readonly metricValue: number;
  readonly timestamp: number;
  readonly sessionId?: string;
  readonly userAccountUuid?: string;
  readonly organizationId?: string;
  readonly attributes?: Record<string, unknown>;
}

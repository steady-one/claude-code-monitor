/**
 * 요청 로그 관련 타입 정의
 */

/**
 * 요청 처리 상태
 */
export type RequestLogStatus = 'success' | 'partial' | 'error' | 'auth_failed';

/**
 * 요청 로그 레코드
 */
export interface RequestLog {
  readonly id: number;
  readonly endpoint: string;
  readonly method: string;
  readonly clientIp: string | null;
  readonly userAgent: string | null;
  readonly requestSize: number;
  readonly dataPointsReceived: number;
  readonly dataPointsProcessed: number;
  readonly dataPointsRejected: number;
  readonly processingTimeMs: number;
  readonly status: RequestLogStatus;
  readonly errorMessage: string | null;
  readonly timestamp: number;
}

/**
 * 요청 로그 삽입용 DTO
 */
export interface InsertRequestLogDto {
  readonly endpoint: string;
  readonly method: string;
  readonly clientIp?: string;
  readonly userAgent?: string;
  readonly requestSize: number;
  readonly dataPointsReceived: number;
  readonly dataPointsProcessed: number;
  readonly dataPointsRejected: number;
  readonly processingTimeMs: number;
  readonly status: RequestLogStatus;
  readonly errorMessage?: string;
  readonly timestamp: number;
}

/**
 * 요청 로그 목록 응답
 */
export interface RequestLogsResponse {
  readonly logs: readonly RequestLog[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/**
 * 요청 로그 요약 통계
 */
export interface RequestLogsSummary {
  readonly totalRequests: number;
  readonly successCount: number;
  readonly partialCount: number;
  readonly errorCount: number;
  readonly authFailedCount: number;
  readonly totalDataPointsReceived: number;
  readonly totalDataPointsProcessed: number;
  readonly avgProcessingTimeMs: number;
}

/**
 * 요청 메타데이터 (컨트롤러에서 추출)
 */
export interface RequestMetadata {
  readonly clientIp?: string;
  readonly userAgent?: string;
  readonly requestSize: number;
  readonly endpoint: string;
  readonly method: string;
}

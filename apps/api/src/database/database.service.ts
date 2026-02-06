import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import type {
  InsertMetricDto,
  InsertRequestLogDto,
  RequestLog,
  RequestLogsSummary,
} from '@claude-code-monitor/shared';

const SCHEMA_SQL = `
-- Claude Code Monitor SQLite Schema

-- 원시 메트릭 테이블
CREATE TABLE IF NOT EXISTS raw_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    timestamp INTEGER NOT NULL,
    session_id TEXT,
    user_account_uuid TEXT,
    organization_id TEXT,
    attributes TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now')*1000)
);

-- 시간별 집계 테이블
CREATE TABLE IF NOT EXISTS hourly_aggregates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name TEXT NOT NULL,
    hour_timestamp INTEGER NOT NULL,
    user_account_uuid TEXT,
    sum_value REAL DEFAULT 0,
    count_value INTEGER DEFAULT 0,
    attributes_hash TEXT,
    attributes TEXT,
    UNIQUE(metric_name, hour_timestamp, user_account_uuid, attributes_hash)
);

-- 사용자 캐시 테이블
CREATE TABLE IF NOT EXISTS users (
    account_uuid TEXT PRIMARY KEY,
    organization_id TEXT,
    first_seen INTEGER NOT NULL,
    last_seen INTEGER NOT NULL,
    total_cost REAL DEFAULT 0,
    total_tokens INTEGER DEFAULT 0
);

-- 요청 로그 테이블
CREATE TABLE IF NOT EXISTS request_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    client_ip TEXT,
    user_agent TEXT,
    request_size INTEGER,
    data_points_received INTEGER,
    data_points_processed INTEGER,
    data_points_rejected INTEGER,
    processing_time_ms INTEGER,
    status TEXT NOT NULL,
    error_message TEXT,
    timestamp INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s','now')*1000)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_raw_timestamp ON raw_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_raw_name_time ON raw_metrics(metric_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_raw_user ON raw_metrics(user_account_uuid, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_hourly_name_time ON hourly_aggregates(metric_name, hour_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_hourly_user ON hourly_aggregates(user_account_uuid, hour_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_request_logs_timestamp ON request_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_request_logs_status ON request_logs(status, timestamp DESC);
`;

interface RawMetricRow {
  id: number;
  metric_name: string;
  metric_value: number;
  timestamp: number;
  session_id: string | null;
  user_account_uuid: string | null;
  organization_id: string | null;
  attributes: string | null;
  created_at: number;
}

interface HourlyAggregateRow {
  id: number;
  metric_name: string;
  hour_timestamp: number;
  user_account_uuid: string | null;
  sum_value: number;
  count_value: number;
  attributes_hash: string | null;
  attributes: string | null;
}

interface UserRow {
  account_uuid: string;
  organization_id: string | null;
  first_seen: number;
  last_seen: number;
  total_cost: number;
  total_tokens: number;
}

interface AggregateResult {
  metric_name: string;
  hour_timestamp: number;
  user_account_uuid: string | null;
  sum_value: number;
  count_value: number;
  attributes_hash: string | null;
  attributes: string | null;
}

interface SummaryResult {
  total: number;
}

interface TimeSeriesRow {
  timestamp: number;
  value: number;
}

interface UserStatsRow {
  account_uuid: string;
  organization_id: string | null;
  total_cost: number;
  total_tokens: number;
  session_count: number;
  last_seen: number;
  first_seen: number;
}

interface RequestLogRow {
  id: number;
  endpoint: string;
  method: string;
  client_ip: string | null;
  user_agent: string | null;
  request_size: number;
  data_points_received: number;
  data_points_processed: number;
  data_points_rejected: number;
  processing_time_ms: number;
  status: string;
  error_message: string | null;
  timestamp: number;
}

interface DetailedTokenRow {
  timestamp: number;
  input: number;
  output: number;
  cache_read: number;
  cache_creation: number;
  total: number;
  model: string | null;
}

interface ModelStatsRow {
  model: string;
  total_cost: number;
  total_tokens: number;
  request_count: number;
}

interface UserDetailRow {
  account_uuid: string;
  organization_id: string | null;
  first_seen: number;
  last_seen: number;
  total_cost: number;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_creation_tokens: number;
  session_count: number;
}

interface UserSessionRow {
  session_id: string;
  start_time: number;
  cost: number;
}

interface DetailedUserSessionRow {
  session_id: string;
  start_time: number;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_creation_tokens: number;
  total_tokens: number;
  cost: number;
}

interface DailyStatsRow {
  date_timestamp: number;
  models: string;
  input_tokens: number;
  output_tokens: number;
  cache_create_tokens: number;
  cache_read_tokens: number;
  total_tokens: number;
  total_cost: number;
}

interface UserTimeSeriesRow {
  user_account_uuid: string;
  timestamp: number;
  value: number;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db!: Database.Database;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const dbPath = this.configService.get<string>(
      'DATABASE_PATH',
      './data/metrics.db',
    );
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000');
    this.db.pragma('temp_store = MEMORY');

    this.initializeSchema();
  }

  onModuleDestroy(): void {
    this.db.close();
  }

  private initializeSchema(): void {
    this.db.exec(SCHEMA_SQL);
  }

  insertMetrics(metrics: readonly InsertMetricDto[]): void {
    const insert = this.db.prepare(`
      INSERT INTO raw_metrics (
        metric_name, metric_value, timestamp, session_id,
        user_account_uuid, organization_id, attributes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction(
      (items: readonly InsertMetricDto[]) => {
        for (const metric of items) {
          insert.run(
            metric.metricName,
            metric.metricValue,
            metric.timestamp,
            metric.sessionId ?? null,
            metric.userAccountUuid ?? null,
            metric.organizationId ?? null,
            metric.attributes ? JSON.stringify(metric.attributes) : null,
          );
        }
      },
    );

    insertMany(metrics);
  }

  upsertUser(
    accountUuid: string,
    organizationId: string | null,
    timestamp: number,
  ): void {
    const upsert = this.db.prepare(`
      INSERT INTO users (account_uuid, organization_id, first_seen, last_seen, total_cost, total_tokens)
      VALUES (?, ?, ?, ?, 0, 0)
      ON CONFLICT(account_uuid) DO UPDATE SET
        organization_id = COALESCE(excluded.organization_id, organization_id),
        last_seen = MAX(last_seen, excluded.last_seen)
    `);

    upsert.run(accountUuid, organizationId, timestamp, timestamp);
  }

  getMetricsForAggregation(
    fromTimestamp: number,
    toTimestamp: number,
  ): readonly AggregateResult[] {
    // 토큰 메트릭은 타입별로 분리하여 집계
    const query = this.db.prepare<
      [number, number],
      {
        metric_name: string;
        hour_timestamp: number;
        user_account_uuid: string | null;
        sum_value: number;
        count_value: number;
        attributes_hash: string | null;
        attributes: string | null;
      }
    >(`
      SELECT
        metric_name,
        (timestamp / 3600000) * 3600000 as hour_timestamp,
        user_account_uuid,
        SUM(metric_value) as sum_value,
        COUNT(*) as count_value,
        CASE
          WHEN metric_name = 'claude_code.token.usage'
          THEN COALESCE(user_account_uuid, 'global') || ':' || COALESCE(json_extract(attributes, '$.type'), 'unknown') || ':' || COALESCE(json_extract(attributes, '$.model'), 'unknown')
          ELSE COALESCE(user_account_uuid, 'global')
        END as attributes_hash,
        CASE
          WHEN metric_name = 'claude_code.token.usage'
          THEN json_object('type', json_extract(attributes, '$.type'), 'model', json_extract(attributes, '$.model'))
          ELSE NULL
        END as attributes
      FROM raw_metrics
      WHERE timestamp >= ? AND timestamp < ?
      GROUP BY
        metric_name,
        hour_timestamp,
        user_account_uuid,
        CASE WHEN metric_name = 'claude_code.token.usage' THEN json_extract(attributes, '$.type') END,
        CASE WHEN metric_name = 'claude_code.token.usage' THEN json_extract(attributes, '$.model') END
    `);

    return query.all(fromTimestamp, toTimestamp);
  }

  upsertHourlyAggregate(
    metricName: string,
    hourTimestamp: number,
    userAccountUuid: string | null,
    sumValue: number,
    countValue: number,
    attributesHash?: string | null,
    attributes?: string | null,
  ): void {
    const hash = attributesHash ?? userAccountUuid ?? 'global';

    const upsert = this.db.prepare(`
      INSERT INTO hourly_aggregates (
        metric_name, hour_timestamp, user_account_uuid,
        sum_value, count_value, attributes_hash, attributes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(metric_name, hour_timestamp, user_account_uuid, attributes_hash) DO UPDATE SET
        sum_value = sum_value + excluded.sum_value,
        count_value = count_value + excluded.count_value
    `);

    upsert.run(
      metricName,
      hourTimestamp,
      userAccountUuid,
      sumValue,
      countValue,
      hash,
      attributes ?? null,
    );
  }

  deleteOldRawMetrics(beforeTimestamp: number): number {
    const result = this.db
      .prepare('DELETE FROM raw_metrics WHERE timestamp < ?')
      .run(beforeTimestamp);
    return result.changes;
  }

  getSummary(fromTimestamp: number, toTimestamp: number): {
    totalCost: number;
    totalTokens: number;
    totalSessions: number;
    uniqueUsers: number;
    totalCommits: number;
    totalPullRequests: number;
  } {
    // 현재 시간의 시작 (아직 집계되지 않은 시간대)
    const HOUR_MS = 3600000;
    const currentHourStart = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;

    // hourly_aggregates에서 집계된 데이터 조회
    const getAggregatedQuery = this.db.prepare<[string, number, number], SummaryResult>(`
      SELECT COALESCE(SUM(sum_value), 0) as total
      FROM hourly_aggregates
      WHERE metric_name = ? AND hour_timestamp >= ? AND hour_timestamp < ?
    `);

    // raw_metrics에서 미집계 데이터만 조회 (현재 시간대만)
    const getRawQuery = this.db.prepare<[string, number, number], SummaryResult>(`
      SELECT COALESCE(SUM(metric_value), 0) as total
      FROM raw_metrics
      WHERE metric_name = ? AND timestamp >= ? AND timestamp < ?
    `);

    const getMetricTotal = (metricName: string): number => {
      // 집계된 시간대: hourly_aggregates에서 조회
      const aggregatedEnd = Math.min(toTimestamp, currentHourStart);
      const aggregated = fromTimestamp < aggregatedEnd
        ? getAggregatedQuery.get(metricName, fromTimestamp, aggregatedEnd)
        : null;

      // 미집계 시간대(현재 시간): raw_metrics에서 조회
      const rawStart = Math.max(fromTimestamp, currentHourStart);
      const raw = rawStart < toTimestamp
        ? getRawQuery.get(metricName, rawStart, toTimestamp)
        : null;

      return (aggregated?.total ?? 0) + (raw?.total ?? 0);
    };

    // 중복 제거를 위한 실제 고유 사용자 수 계산
    const aggregatedEnd = Math.min(toTimestamp, currentHourStart);
    const rawStart = Math.max(fromTimestamp, currentHourStart);

    const getActualUniqueUsers = this.db.prepare<[number, number, number, number], { count: number }>(`
      SELECT COUNT(DISTINCT user_account_uuid) as count FROM (
        SELECT user_account_uuid FROM hourly_aggregates
        WHERE hour_timestamp >= ? AND hour_timestamp < ? AND user_account_uuid IS NOT NULL
        UNION
        SELECT user_account_uuid FROM raw_metrics
        WHERE timestamp >= ? AND timestamp < ? AND user_account_uuid IS NOT NULL
      )
    `);
    const uniqueUsersResult = getActualUniqueUsers.get(
      fromTimestamp, aggregatedEnd,
      rawStart, toTimestamp
    );

    // 세션 수는 raw_metrics에서 고유 session_id 개수로 계산
    // (hourly_aggregates에는 session_id가 없음)
    const getActualSessionCount = this.db.prepare<[number, number], { count: number }>(`
      SELECT COUNT(DISTINCT session_id) as count
      FROM raw_metrics
      WHERE timestamp >= ? AND timestamp < ? AND session_id IS NOT NULL
    `);
    const sessionCountResult = getActualSessionCount.get(fromTimestamp, toTimestamp);

    return {
      totalCost: getMetricTotal('claude_code.cost.usage'),
      totalTokens: getMetricTotal('claude_code.token.usage'),
      totalSessions: sessionCountResult?.count ?? 0,
      uniqueUsers: uniqueUsersResult?.count ?? 0,
      totalCommits: getMetricTotal('claude_code.commit.count'),
      totalPullRequests: getMetricTotal('claude_code.pull_request.count'),
    };
  }

  getTimeSeries(
    metricName: string,
    fromTimestamp: number,
    toTimestamp: number,
    intervalMs: number,
    userId?: string,
  ): readonly TimeSeriesRow[] {
    // 현재 시간의 시작 (아직 집계되지 않은 시간대)
    const HOUR_MS = 3600000;
    const currentHourStart = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;

    // 집계된 시간대와 미집계 시간대를 분리하여 조회
    const aggregatedEnd = Math.min(toTimestamp, currentHourStart);
    const rawStart = Math.max(fromTimestamp, currentHourStart);

    // SQLite에서 정수 나눗셈을 보장하기 위해 (ts - ts % interval) 패턴 사용
    if (userId) {
      const query = this.db.prepare<
        [number, string, number, number, string, number, string, number, number, string],
        TimeSeriesRow
      >(`
        SELECT timestamp, SUM(value) as value FROM (
          SELECT
            hour_timestamp - (hour_timestamp % ?) as timestamp,
            sum_value as value
          FROM hourly_aggregates
          WHERE metric_name = ? AND hour_timestamp >= ? AND hour_timestamp < ?
            AND user_account_uuid = ?
          UNION ALL
          SELECT
            timestamp - (timestamp % ?) as timestamp,
            metric_value as value
          FROM raw_metrics
          WHERE metric_name = ? AND timestamp >= ? AND timestamp < ?
            AND user_account_uuid = ?
        )
        GROUP BY timestamp
        ORDER BY timestamp ASC
      `);

      return query.all(
        intervalMs, metricName, fromTimestamp, aggregatedEnd, userId,
        intervalMs, metricName, rawStart, toTimestamp, userId,
      );
    }

    const query = this.db.prepare<
      [number, string, number, number, number, string, number, number],
      TimeSeriesRow
    >(`
      SELECT timestamp, SUM(value) as value FROM (
        SELECT
          hour_timestamp - (hour_timestamp % ?) as timestamp,
          sum_value as value
        FROM hourly_aggregates
        WHERE metric_name = ? AND hour_timestamp >= ? AND hour_timestamp < ?
        UNION ALL
        SELECT
          timestamp - (timestamp % ?) as timestamp,
          metric_value as value
        FROM raw_metrics
        WHERE metric_name = ? AND timestamp >= ? AND timestamp < ?
      )
      GROUP BY timestamp
      ORDER BY timestamp ASC
    `);

    return query.all(
      intervalMs, metricName, fromTimestamp, aggregatedEnd,
      intervalMs, metricName, rawStart, toTimestamp,
    );
  }

  getUserStats(
    fromTimestamp: number,
    toTimestamp: number,
    page: number,
    pageSize: number,
  ): { users: readonly UserStatsRow[]; total: number } {
    // 현재 시간의 시작 (아직 집계되지 않은 시간대)
    const HOUR_MS = 3600000;
    const currentHourStart = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;

    // 집계된 시간대와 미집계 시간대를 분리
    const aggregatedEnd = Math.min(toTimestamp, currentHourStart);
    const rawStart = Math.max(fromTimestamp, currentHourStart);

    // hourly_aggregates와 raw_metrics 모두에서 고유 사용자 수 계산 (중복 제거)
    const countQuery = this.db.prepare<[number, number, number, number], { count: number }>(`
      SELECT COUNT(DISTINCT user_account_uuid) as count FROM (
        SELECT user_account_uuid FROM hourly_aggregates
        WHERE hour_timestamp >= ? AND hour_timestamp < ? AND user_account_uuid IS NOT NULL
        UNION
        SELECT user_account_uuid FROM raw_metrics
        WHERE timestamp >= ? AND timestamp < ? AND user_account_uuid IS NOT NULL
      )
    `);

    // hourly_aggregates(집계된 시간)와 raw_metrics(현재 시간)를 분리하여 조회
    // session_count는 raw_metrics에서 고유 session_id 개수로 계산 (상세 페이지와 일관성)
    const usersQuery = this.db.prepare<
      [number, number, number, number, number, number, number, number],
      UserStatsRow
    >(`
      SELECT
        combined.user_account_uuid as account_uuid,
        u.organization_id,
        COALESCE(SUM(combined.cost), 0) as total_cost,
        COALESCE(SUM(combined.tokens), 0) as total_tokens,
        COALESCE(sessions.session_count, 0) as session_count,
        COALESCE(u.last_seen, MAX(combined.ts)) as last_seen,
        COALESCE(u.first_seen, MIN(combined.ts)) as first_seen
      FROM (
        SELECT
          user_account_uuid,
          hour_timestamp as ts,
          CASE WHEN metric_name = 'claude_code.cost.usage' THEN sum_value ELSE 0 END as cost,
          CASE WHEN metric_name = 'claude_code.token.usage' THEN sum_value ELSE 0 END as tokens
        FROM hourly_aggregates
        WHERE hour_timestamp >= ? AND hour_timestamp < ? AND user_account_uuid IS NOT NULL
        UNION ALL
        SELECT
          user_account_uuid,
          timestamp as ts,
          CASE WHEN metric_name = 'claude_code.cost.usage' THEN metric_value ELSE 0 END as cost,
          CASE WHEN metric_name = 'claude_code.token.usage' THEN metric_value ELSE 0 END as tokens
        FROM raw_metrics
        WHERE timestamp >= ? AND timestamp < ? AND user_account_uuid IS NOT NULL
      ) combined
      LEFT JOIN users u ON combined.user_account_uuid = u.account_uuid
      LEFT JOIN (
        SELECT user_account_uuid, COUNT(DISTINCT session_id) as session_count
        FROM raw_metrics
        WHERE timestamp >= ? AND timestamp < ? AND session_id IS NOT NULL
        GROUP BY user_account_uuid
      ) sessions ON combined.user_account_uuid = sessions.user_account_uuid
      GROUP BY combined.user_account_uuid
      ORDER BY total_cost DESC
      LIMIT ? OFFSET ?
    `);

    const countResult = countQuery.get(fromTimestamp, aggregatedEnd, rawStart, toTimestamp);
    const offset = (page - 1) * pageSize;
    const users = usersQuery.all(
      fromTimestamp,
      aggregatedEnd,
      rawStart,
      toTimestamp,
      fromTimestamp,
      toTimestamp,
      pageSize,
      offset,
    );

    return {
      users,
      total: countResult?.count ?? 0,
    };
  }

  updateUserTotals(
    accountUuid: string,
    costDelta: number,
    tokensDelta: number,
  ): void {
    const update = this.db.prepare(`
      UPDATE users
      SET total_cost = total_cost + ?,
          total_tokens = total_tokens + ?
      WHERE account_uuid = ?
    `);

    update.run(costDelta, tokensDelta, accountUuid);
  }

  insertRequestLog(log: InsertRequestLogDto): void {
    const insert = this.db.prepare(`
      INSERT INTO request_logs (
        endpoint, method, client_ip, user_agent, request_size,
        data_points_received, data_points_processed, data_points_rejected,
        processing_time_ms, status, error_message, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      log.endpoint,
      log.method,
      log.clientIp ?? null,
      log.userAgent ?? null,
      log.requestSize,
      log.dataPointsReceived,
      log.dataPointsProcessed,
      log.dataPointsRejected,
      log.processingTimeMs,
      log.status,
      log.errorMessage ?? null,
      log.timestamp,
    );
  }

  getRequestLogs(
    fromTimestamp: number,
    toTimestamp: number,
    page: number,
    pageSize: number,
    filters?: {
      status?: string;
      endpoint?: string;
    },
  ): { logs: readonly RequestLog[]; total: number } {
    let whereClause = 'WHERE timestamp >= ? AND timestamp < ?';
    const params: (string | number)[] = [fromTimestamp, toTimestamp];

    if (filters?.status) {
      whereClause += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.endpoint) {
      whereClause += ' AND endpoint LIKE ?';
      params.push(`%${filters.endpoint}%`);
    }

    const countQuery = this.db.prepare<(string | number)[], { count: number }>(`
      SELECT COUNT(*) as count FROM request_logs
      ${whereClause}
    `);

    const logsQuery = this.db.prepare<(string | number)[], RequestLogRow>(`
      SELECT
        id, endpoint, method, client_ip, user_agent, request_size,
        data_points_received, data_points_processed, data_points_rejected,
        processing_time_ms, status, error_message, timestamp
      FROM request_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `);

    const countResult = countQuery.get(...params);
    const offset = (page - 1) * pageSize;
    const rows = logsQuery.all(...params, pageSize, offset);

    const logs: RequestLog[] = rows.map((row) => ({
      id: row.id,
      endpoint: row.endpoint,
      method: row.method,
      clientIp: row.client_ip,
      userAgent: row.user_agent,
      requestSize: row.request_size,
      dataPointsReceived: row.data_points_received,
      dataPointsProcessed: row.data_points_processed,
      dataPointsRejected: row.data_points_rejected,
      processingTimeMs: row.processing_time_ms,
      status: row.status as RequestLog['status'],
      errorMessage: row.error_message,
      timestamp: row.timestamp,
    }));

    return {
      logs,
      total: countResult?.count ?? 0,
    };
  }

  getRequestLogsSummary(
    fromTimestamp: number,
    toTimestamp: number,
  ): RequestLogsSummary {
    const query = this.db.prepare<
      [number, number],
      {
        total_requests: number;
        success_count: number;
        partial_count: number;
        error_count: number;
        auth_failed_count: number;
        total_received: number;
        total_processed: number;
        avg_processing_time: number;
      }
    >(`
      SELECT
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial_count,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count,
        SUM(CASE WHEN status = 'auth_failed' THEN 1 ELSE 0 END) as auth_failed_count,
        COALESCE(SUM(data_points_received), 0) as total_received,
        COALESCE(SUM(data_points_processed), 0) as total_processed,
        COALESCE(AVG(processing_time_ms), 0) as avg_processing_time
      FROM request_logs
      WHERE timestamp >= ? AND timestamp < ?
    `);

    const result = query.get(fromTimestamp, toTimestamp);

    return {
      totalRequests: result?.total_requests ?? 0,
      successCount: result?.success_count ?? 0,
      partialCount: result?.partial_count ?? 0,
      errorCount: result?.error_count ?? 0,
      authFailedCount: result?.auth_failed_count ?? 0,
      totalDataPointsReceived: result?.total_received ?? 0,
      totalDataPointsProcessed: result?.total_processed ?? 0,
      avgProcessingTimeMs: Math.round(result?.avg_processing_time ?? 0),
    };
  }

  getDetailedTokenStats(
    fromTimestamp: number,
    toTimestamp: number,
    intervalMs: number,
    filters?: {
      model?: string;
      userId?: string;
      sessionId?: string;
    },
  ): readonly DetailedTokenRow[] {
    const HOUR_MS = 3600000;
    const currentHourStart = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;
    const aggregatedEnd = Math.min(toTimestamp, currentHourStart);
    const rawStart = Math.max(fromTimestamp, currentHourStart);

    // 필터 조건 빌드
    let aggregateWhere = '';
    let rawWhere = '';
    const aggregateParams: (string | number)[] = [];
    const rawParams: (string | number)[] = [];

    if (filters?.userId) {
      aggregateWhere += ' AND user_account_uuid = ?';
      rawWhere += ' AND user_account_uuid = ?';
      aggregateParams.push(filters.userId);
      rawParams.push(filters.userId);
    }

    if (filters?.model) {
      aggregateWhere += " AND json_extract(attributes, '$.model') = ?";
      rawWhere += " AND json_extract(attributes, '$.model') = ?";
      aggregateParams.push(filters.model);
      rawParams.push(filters.model);
    }

    if (filters?.sessionId) {
      // sessionId 필터는 raw_metrics에서만 적용 가능 (hourly_aggregates에는 session_id가 없음)
      rawWhere += ' AND session_id = ?';
      rawParams.push(filters.sessionId);
    }

    // sessionId 필터가 있으면 raw_metrics만 사용
    // SQLite에서 정수 나눗셈을 보장하기 위해 (ts - ts % interval) 패턴 사용
    if (filters?.sessionId) {
      const query = this.db.prepare<(string | number)[], DetailedTokenRow>(`
        SELECT
          timestamp - (timestamp % ?) as timestamp,
          SUM(CASE WHEN json_extract(attributes, '$.type') = 'input' THEN metric_value ELSE 0 END) as input,
          SUM(CASE WHEN json_extract(attributes, '$.type') = 'output' THEN metric_value ELSE 0 END) as output,
          SUM(CASE WHEN json_extract(attributes, '$.type') = 'cacheRead' THEN metric_value ELSE 0 END) as cache_read,
          SUM(CASE WHEN json_extract(attributes, '$.type') = 'cacheCreation' THEN metric_value ELSE 0 END) as cache_creation,
          SUM(metric_value) as total,
          NULL as model
        FROM raw_metrics
        WHERE timestamp >= ? AND timestamp < ?
          AND metric_name = 'claude_code.token.usage'
          ${rawWhere}
        GROUP BY timestamp - (timestamp % ?)
        ORDER BY timestamp ASC
      `);

      return query.all(
        intervalMs,
        fromTimestamp,
        toTimestamp,
        ...rawParams,
        intervalMs,
      );
    }

    // hourly_aggregates + raw_metrics 조회
    // SQLite에서 정수 나눗셈을 보장하기 위해 (ts - ts % interval) 패턴 사용
    const query = this.db.prepare<(string | number)[], DetailedTokenRow>(`
      SELECT
        ts - (ts % ?) as timestamp,
        SUM(input) as input,
        SUM(output) as output,
        SUM(cache_read) as cache_read,
        SUM(cache_creation) as cache_creation,
        SUM(input) + SUM(output) + SUM(cache_read) + SUM(cache_creation) as total,
        NULL as model
      FROM (
        -- hourly_aggregates (집계된 과거 데이터)
        SELECT
          hour_timestamp as ts,
          CASE WHEN json_extract(attributes, '$.type') = 'input' THEN sum_value ELSE 0 END as input,
          CASE WHEN json_extract(attributes, '$.type') = 'output' THEN sum_value ELSE 0 END as output,
          CASE WHEN json_extract(attributes, '$.type') = 'cacheRead' THEN sum_value ELSE 0 END as cache_read,
          CASE WHEN json_extract(attributes, '$.type') = 'cacheCreation' THEN sum_value ELSE 0 END as cache_creation
        FROM hourly_aggregates
        WHERE metric_name = 'claude_code.token.usage'
          AND hour_timestamp >= ? AND hour_timestamp < ?
          ${aggregateWhere}
        UNION ALL
        -- raw_metrics (현재 시간대 미집계 데이터)
        SELECT
          timestamp as ts,
          CASE WHEN json_extract(attributes, '$.type') = 'input' THEN metric_value ELSE 0 END as input,
          CASE WHEN json_extract(attributes, '$.type') = 'output' THEN metric_value ELSE 0 END as output,
          CASE WHEN json_extract(attributes, '$.type') = 'cacheRead' THEN metric_value ELSE 0 END as cache_read,
          CASE WHEN json_extract(attributes, '$.type') = 'cacheCreation' THEN metric_value ELSE 0 END as cache_creation
        FROM raw_metrics
        WHERE metric_name = 'claude_code.token.usage'
          AND timestamp >= ? AND timestamp < ?
          ${rawWhere}
      )
      GROUP BY ts - (ts % ?)
      ORDER BY timestamp ASC
    `);

    return query.all(
      intervalMs,
      fromTimestamp,
      aggregatedEnd,
      ...aggregateParams,
      rawStart,
      toTimestamp,
      ...rawParams,
      intervalMs,
    );
  }

  getModelStats(
    fromTimestamp: number,
    toTimestamp: number,
  ): readonly ModelStatsRow[] {
    const query = this.db.prepare<[number, number], ModelStatsRow>(`
      SELECT
        COALESCE(json_extract(attributes, '$.model'), 'unknown') as model,
        SUM(CASE WHEN metric_name = 'claude_code.cost.usage' THEN metric_value ELSE 0 END) as total_cost,
        SUM(CASE WHEN metric_name = 'claude_code.token.usage' THEN metric_value ELSE 0 END) as total_tokens,
        COUNT(CASE WHEN metric_name = 'claude_code.cost.usage' THEN 1 END) as request_count
      FROM raw_metrics
      WHERE timestamp >= ? AND timestamp < ?
        AND metric_name IN ('claude_code.cost.usage', 'claude_code.token.usage')
      GROUP BY json_extract(attributes, '$.model')
      ORDER BY total_cost DESC
    `);

    return query.all(fromTimestamp, toTimestamp);
  }

  getUserDetail(
    userId: string,
    fromTimestamp: number,
    toTimestamp: number,
  ): UserDetailRow | null {
    // 세션 수는 고유한 session_id 개수로 계산 (raw_metrics 기준)
    const sessionCountQuery = this.db.prepare<[string, number, number], { count: number }>(`
      SELECT COUNT(DISTINCT session_id) as count
      FROM raw_metrics
      WHERE user_account_uuid = ?
        AND timestamp >= ? AND timestamp < ?
        AND session_id IS NOT NULL
    `);
    const sessionCountResult = sessionCountQuery.get(userId, fromTimestamp, toTimestamp);
    const actualSessionCount = sessionCountResult?.count ?? 0;

    // 현재 시간의 시작 (아직 집계되지 않은 시간대)
    const HOUR_MS = 3600000;
    const currentHourStart = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;

    // 집계된 시간대와 미집계 시간대를 분리
    const aggregatedEnd = Math.min(toTimestamp, currentHourStart);
    const rawStart = Math.max(fromTimestamp, currentHourStart);

    // hourly_aggregates(집계된 시간)와 raw_metrics(현재 시간)를 분리하여 조회
    const query = this.db.prepare<
      [string, number, number, string, number, number, string],
      Omit<UserDetailRow, 'session_count'>
    >(`
      SELECT
        u.account_uuid,
        u.organization_id,
        u.first_seen,
        u.last_seen,
        COALESCE(SUM(combined.cost), 0) as total_cost,
        COALESCE(SUM(combined.tokens), 0) as total_tokens,
        COALESCE(SUM(combined.input_tokens), 0) as input_tokens,
        COALESCE(SUM(combined.output_tokens), 0) as output_tokens,
        COALESCE(SUM(combined.cache_read_tokens), 0) as cache_read_tokens,
        COALESCE(SUM(combined.cache_creation_tokens), 0) as cache_creation_tokens
      FROM users u
      LEFT JOIN (
        -- hourly_aggregates에서 집계된 데이터 (집계 완료된 시간대만)
        SELECT
          user_account_uuid,
          CASE WHEN metric_name = 'claude_code.cost.usage' THEN sum_value ELSE 0 END as cost,
          CASE WHEN metric_name = 'claude_code.token.usage' THEN sum_value ELSE 0 END as tokens,
          CASE WHEN metric_name = 'claude_code.token.usage' AND json_extract(attributes, '$.type') = 'input' THEN sum_value ELSE 0 END as input_tokens,
          CASE WHEN metric_name = 'claude_code.token.usage' AND json_extract(attributes, '$.type') = 'output' THEN sum_value ELSE 0 END as output_tokens,
          CASE WHEN metric_name = 'claude_code.token.usage' AND json_extract(attributes, '$.type') = 'cacheRead' THEN sum_value ELSE 0 END as cache_read_tokens,
          CASE WHEN metric_name = 'claude_code.token.usage' AND json_extract(attributes, '$.type') = 'cacheCreation' THEN sum_value ELSE 0 END as cache_creation_tokens
        FROM hourly_aggregates
        WHERE user_account_uuid = ?
          AND hour_timestamp >= ? AND hour_timestamp < ?
        UNION ALL
        -- raw_metrics에서 원시 데이터 (현재 시간대만, 미집계 데이터)
        SELECT
          user_account_uuid,
          CASE WHEN metric_name = 'claude_code.cost.usage' THEN metric_value ELSE 0 END as cost,
          CASE WHEN metric_name = 'claude_code.token.usage' THEN metric_value ELSE 0 END as tokens,
          CASE WHEN metric_name = 'claude_code.token.usage' AND json_extract(attributes, '$.type') = 'input' THEN metric_value ELSE 0 END as input_tokens,
          CASE WHEN metric_name = 'claude_code.token.usage' AND json_extract(attributes, '$.type') = 'output' THEN metric_value ELSE 0 END as output_tokens,
          CASE WHEN metric_name = 'claude_code.token.usage' AND json_extract(attributes, '$.type') = 'cacheRead' THEN metric_value ELSE 0 END as cache_read_tokens,
          CASE WHEN metric_name = 'claude_code.token.usage' AND json_extract(attributes, '$.type') = 'cacheCreation' THEN metric_value ELSE 0 END as cache_creation_tokens
        FROM raw_metrics
        WHERE user_account_uuid = ?
          AND timestamp >= ? AND timestamp < ?
      ) combined ON u.account_uuid = combined.user_account_uuid
      WHERE u.account_uuid = ?
      GROUP BY u.account_uuid
    `);

    const result = query.get(userId, fromTimestamp, aggregatedEnd, userId, rawStart, toTimestamp, userId);
    if (!result) return null;

    return {
      ...result,
      session_count: actualSessionCount,
    };
  }

  getUserSessions(
    userId: string,
    limit: number,
  ): readonly UserSessionRow[] {
    const query = this.db.prepare<[string, number], UserSessionRow>(`
      SELECT
        session_id,
        MIN(timestamp) as start_time,
        SUM(CASE WHEN metric_name = 'claude_code.cost.usage' THEN metric_value ELSE 0 END) as cost
      FROM raw_metrics
      WHERE user_account_uuid = ? AND session_id IS NOT NULL
      GROUP BY session_id
      ORDER BY start_time DESC
      LIMIT ?
    `);

    return query.all(userId, limit);
  }

  getUserSessionsPaginated(
    userId: string,
    fromTimestamp: number,
    toTimestamp: number,
    page: number,
    pageSize: number,
  ): { sessions: readonly DetailedUserSessionRow[]; total: number } {
    const countQuery = this.db.prepare<[string, number, number], { count: number }>(`
      SELECT COUNT(DISTINCT session_id) as count
      FROM raw_metrics
      WHERE user_account_uuid = ?
        AND session_id IS NOT NULL
        AND timestamp >= ? AND timestamp < ?
    `);

    const sessionsQuery = this.db.prepare<
      [string, number, number, number, number],
      DetailedUserSessionRow
    >(`
      SELECT
        session_id,
        MIN(timestamp) as start_time,
        SUM(CASE
          WHEN metric_name = 'claude_code.token.usage' AND json_extract(attributes, '$.type') = 'input'
          THEN metric_value ELSE 0 END) as input_tokens,
        SUM(CASE
          WHEN metric_name = 'claude_code.token.usage' AND json_extract(attributes, '$.type') = 'output'
          THEN metric_value ELSE 0 END) as output_tokens,
        SUM(CASE
          WHEN metric_name = 'claude_code.token.usage' AND json_extract(attributes, '$.type') = 'cacheRead'
          THEN metric_value ELSE 0 END) as cache_read_tokens,
        SUM(CASE
          WHEN metric_name = 'claude_code.token.usage' AND json_extract(attributes, '$.type') = 'cacheCreation'
          THEN metric_value ELSE 0 END) as cache_creation_tokens,
        SUM(CASE
          WHEN metric_name = 'claude_code.token.usage'
          THEN metric_value ELSE 0 END) as total_tokens,
        SUM(CASE
          WHEN metric_name = 'claude_code.cost.usage'
          THEN metric_value ELSE 0 END) as cost
      FROM raw_metrics
      WHERE user_account_uuid = ?
        AND session_id IS NOT NULL
        AND timestamp >= ? AND timestamp < ?
      GROUP BY session_id
      ORDER BY start_time DESC
      LIMIT ? OFFSET ?
    `);

    const countResult = countQuery.get(userId, fromTimestamp, toTimestamp);
    const offset = (page - 1) * pageSize;
    const sessions = sessionsQuery.all(userId, fromTimestamp, toTimestamp, pageSize, offset);

    return {
      sessions,
      total: countResult?.count ?? 0,
    };
  }

  getUserModelUsage(
    userId: string,
    fromTimestamp: number,
    toTimestamp: number,
  ): readonly { model: string; cost: number; tokens: number }[] {
    const query = this.db.prepare<
      [string, number, number],
      { model: string; cost: number; tokens: number }
    >(`
      SELECT
        COALESCE(json_extract(attributes, '$.model'), 'unknown') as model,
        SUM(CASE WHEN metric_name = 'claude_code.cost.usage' THEN metric_value ELSE 0 END) as cost,
        SUM(CASE WHEN metric_name = 'claude_code.token.usage' THEN metric_value ELSE 0 END) as tokens
      FROM raw_metrics
      WHERE user_account_uuid = ?
        AND timestamp >= ? AND timestamp < ?
        AND metric_name IN ('claude_code.cost.usage', 'claude_code.token.usage')
      GROUP BY json_extract(attributes, '$.model')
      ORDER BY cost DESC
    `);

    return query.all(userId, fromTimestamp, toTimestamp);
  }

  getUserDailyStats(
    userId: string,
    fromTimestamp: number,
    toTimestamp: number,
    groupBy: 'day' | 'month',
  ): readonly DailyStatsRow[] {
    const DAY_MS = 86400000;

    if (groupBy === 'day') {
      const query = this.db.prepare<[string, number, number], DailyStatsRow>(`
        SELECT
          (timestamp / ${DAY_MS}) * ${DAY_MS} as date_timestamp,
          GROUP_CONCAT(DISTINCT json_extract(attributes, '$.model')) as models,
          SUM(CASE WHEN json_extract(attributes, '$.type') = 'input' THEN metric_value ELSE 0 END) as input_tokens,
          SUM(CASE WHEN json_extract(attributes, '$.type') = 'output' THEN metric_value ELSE 0 END) as output_tokens,
          SUM(CASE WHEN json_extract(attributes, '$.type') = 'cacheCreation' THEN metric_value ELSE 0 END) as cache_create_tokens,
          SUM(CASE WHEN json_extract(attributes, '$.type') = 'cacheRead' THEN metric_value ELSE 0 END) as cache_read_tokens,
          SUM(metric_value) as total_tokens,
          COALESCE((
            SELECT SUM(m2.metric_value)
            FROM raw_metrics m2
            WHERE m2.user_account_uuid = raw_metrics.user_account_uuid
              AND m2.metric_name = 'claude_code.cost.usage'
              AND (m2.timestamp / ${DAY_MS}) = (raw_metrics.timestamp / ${DAY_MS})
          ), 0) as total_cost
        FROM raw_metrics
        WHERE user_account_uuid = ?
          AND metric_name = 'claude_code.token.usage'
          AND timestamp >= ? AND timestamp < ?
        GROUP BY date_timestamp
        ORDER BY date_timestamp DESC
      `);

      return query.all(userId, fromTimestamp, toTimestamp);
    } else {
      // 월별 집계
      const query = this.db.prepare<[string, number, number], DailyStatsRow>(`
        SELECT
          strftime('%Y-%m-01', datetime(timestamp/1000, 'unixepoch')) as date_label,
          (strftime('%s', strftime('%Y-%m-01', datetime(timestamp/1000, 'unixepoch'))) * 1000) as date_timestamp,
          GROUP_CONCAT(DISTINCT json_extract(attributes, '$.model')) as models,
          SUM(CASE WHEN json_extract(attributes, '$.type') = 'input' THEN metric_value ELSE 0 END) as input_tokens,
          SUM(CASE WHEN json_extract(attributes, '$.type') = 'output' THEN metric_value ELSE 0 END) as output_tokens,
          SUM(CASE WHEN json_extract(attributes, '$.type') = 'cacheCreation' THEN metric_value ELSE 0 END) as cache_create_tokens,
          SUM(CASE WHEN json_extract(attributes, '$.type') = 'cacheRead' THEN metric_value ELSE 0 END) as cache_read_tokens,
          SUM(metric_value) as total_tokens,
          COALESCE((
            SELECT SUM(m2.metric_value)
            FROM raw_metrics m2
            WHERE m2.user_account_uuid = raw_metrics.user_account_uuid
              AND m2.metric_name = 'claude_code.cost.usage'
              AND strftime('%Y-%m', datetime(m2.timestamp/1000, 'unixepoch')) = strftime('%Y-%m', datetime(raw_metrics.timestamp/1000, 'unixepoch'))
          ), 0) as total_cost
        FROM raw_metrics
        WHERE user_account_uuid = ?
          AND metric_name = 'claude_code.token.usage'
          AND timestamp >= ? AND timestamp < ?
        GROUP BY strftime('%Y-%m', datetime(timestamp/1000, 'unixepoch'))
        ORDER BY date_timestamp DESC
      `);

      return query.all(userId, fromTimestamp, toTimestamp);
    }
  }

  getAllUsers(
    fromTimestamp: number,
    toTimestamp: number,
    page: number,
    pageSize: number,
    filters?: {
      organizationId?: string;
      terminalType?: string;
    },
    sortBy: 'cost' | 'tokens' | 'lastSeen' = 'cost',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): { users: readonly UserStatsRow[]; total: number } {
    let whereClause = 'WHERE timestamp >= ? AND timestamp < ? AND user_account_uuid IS NOT NULL';
    const params: (string | number)[] = [fromTimestamp, toTimestamp];

    if (filters?.organizationId) {
      whereClause += " AND json_extract(attributes, '$.\"organization.id\"') = ?";
      params.push(filters.organizationId);
    }

    if (filters?.terminalType) {
      whereClause += " AND json_extract(attributes, '$.\"terminal.type\"') = ?";
      params.push(filters.terminalType);
    }

    const orderColumn = sortBy === 'cost' ? 'total_cost' : sortBy === 'tokens' ? 'total_tokens' : 'last_seen';
    const orderDir = sortOrder.toUpperCase();

    const countQuery = this.db.prepare<(string | number)[], { count: number }>(`
      SELECT COUNT(DISTINCT user_account_uuid) as count
      FROM raw_metrics
      ${whereClause}
    `);

    const usersQuery = this.db.prepare<(string | number)[], UserStatsRow>(`
      SELECT
        user_account_uuid as account_uuid,
        json_extract(attributes, '$.\"organization.id\"') as organization_id,
        SUM(CASE WHEN metric_name = 'claude_code.cost.usage' THEN metric_value ELSE 0 END) as total_cost,
        SUM(CASE WHEN metric_name = 'claude_code.token.usage' THEN metric_value ELSE 0 END) as total_tokens,
        COUNT(DISTINCT session_id) as session_count,
        MAX(timestamp) as last_seen,
        MIN(timestamp) as first_seen
      FROM raw_metrics
      ${whereClause}
      GROUP BY user_account_uuid
      ORDER BY ${orderColumn} ${orderDir}
      LIMIT ? OFFSET ?
    `);

    const countResult = countQuery.get(...params);
    const offset = (page - 1) * pageSize;

    const usersParams = [...params, pageSize, offset];
    const users = usersQuery.all(...usersParams);

    return {
      users,
      total: countResult?.count ?? 0,
    };
  }

  getUsersTimeSeries(
    metricName: string,
    fromTimestamp: number,
    toTimestamp: number,
    intervalMs: number,
  ): readonly UserTimeSeriesRow[] {
    const HOUR_MS = 3600000;
    const currentHourStart = Math.floor(Date.now() / HOUR_MS) * HOUR_MS;

    const aggregatedEnd = Math.min(toTimestamp, currentHourStart);
    const rawStart = Math.max(fromTimestamp, currentHourStart);

    // SQLite에서 정수 나눗셈을 보장하기 위해 (ts - ts % interval) 패턴 사용
    const query = this.db.prepare<
      [number, string, number, number, number, string, number, number],
      UserTimeSeriesRow
    >(`
      SELECT
        user_account_uuid,
        timestamp,
        SUM(value) as value
      FROM (
        SELECT
          user_account_uuid,
          hour_timestamp - (hour_timestamp % ?) as timestamp,
          sum_value as value
        FROM hourly_aggregates
        WHERE metric_name = ?
          AND hour_timestamp >= ? AND hour_timestamp < ?
          AND user_account_uuid IS NOT NULL
        UNION ALL
        SELECT
          user_account_uuid,
          timestamp - (timestamp % ?) as timestamp,
          metric_value as value
        FROM raw_metrics
        WHERE metric_name = ?
          AND timestamp >= ? AND timestamp < ?
          AND user_account_uuid IS NOT NULL
      )
      GROUP BY user_account_uuid, timestamp
      ORDER BY user_account_uuid, timestamp ASC
    `);

    return query.all(
      intervalMs, metricName, fromTimestamp, aggregatedEnd,
      intervalMs, metricName, rawStart, toTimestamp,
    );
  }
}

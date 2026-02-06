import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type {
  TimeRangeDto,
  PaginatedTimeRangeDto,
  DetailedTokensQueryDto,
  UserTimeRangeDto,
} from './dto/time-range.dto';
import type {
  MetricsSummary,
  CostTimeSeriesResponse,
  TokenTimeSeriesResponse,
  UsersResponse,
  DetailedTokensResponse,
  ModelsStatsResponse,
  UserCostTimeSeriesResponse,
  UserTokenTimeSeriesResponse,
  UserTimeSeries,
} from '@claude-code-monitor/shared';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const DEFAULT_RANGE_DAYS = 7;

@Injectable()
export class MetricsService {
  constructor(private readonly databaseService: DatabaseService) {}

  private getTimeRange(query: TimeRangeDto): {
    from: number;
    to: number;
    intervalMs: number;
  } {
    const now = Date.now();
    const to = query.to ?? now;
    const from = query.from ?? to - DEFAULT_RANGE_DAYS * DAY_MS;
    const intervalMs = query.interval === 'day' ? DAY_MS : HOUR_MS;

    return { from, to, intervalMs };
  }

  getSummary(query: TimeRangeDto): MetricsSummary {
    const { from, to } = this.getTimeRange(query);

    const summary = this.databaseService.getSummary(from, to);

    return {
      totalCost: summary.totalCost,
      totalTokens: summary.totalTokens,
      totalSessions: summary.totalSessions,
      uniqueUsers: summary.uniqueUsers,
      totalCommits: summary.totalCommits,
      totalPullRequests: summary.totalPullRequests,
      periodStart: from,
      periodEnd: to,
    };
  }

  getCostTimeSeries(query: UserTimeRangeDto): CostTimeSeriesResponse {
    const { from, to, intervalMs } = this.getTimeRange(query);

    const data = this.databaseService.getTimeSeries(
      'claude_code.cost.usage',
      from,
      to,
      intervalMs,
      query.userId,
    );

    const total = data.reduce((sum, point) => sum + point.value, 0);

    return {
      data,
      total,
      interval: query.interval === 'day' ? 'day' : 'hour',
    };
  }

  getTokenTimeSeries(query: UserTimeRangeDto): TokenTimeSeriesResponse {
    const { from, to, intervalMs } = this.getTimeRange(query);

    const data = this.databaseService.getTimeSeries(
      'claude_code.token.usage',
      from,
      to,
      intervalMs,
      query.userId,
    );

    const total = data.reduce((sum, point) => sum + point.value, 0);

    return {
      data,
      total,
      interval: query.interval === 'day' ? 'day' : 'hour',
    };
  }

  getUsers(query: PaginatedTimeRangeDto): UsersResponse {
    const { from, to } = this.getTimeRange(query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const { users, total } = this.databaseService.getUserStats(
      from,
      to,
      page,
      pageSize,
    );

    return {
      users: users.map((user) => ({
        accountUuid: user.account_uuid,
        organizationId: user.organization_id,
        totalCost: user.total_cost,
        totalTokens: user.total_tokens,
        sessionCount: user.session_count,
        lastSeen: user.last_seen,
        firstSeen: user.first_seen,
      })),
      total,
      page,
      pageSize,
    };
  }

  getDetailedTokens(query: DetailedTokensQueryDto): DetailedTokensResponse {
    const { from, to, intervalMs } = this.getTimeRange(query);

    const filters: {
      model?: string;
      userId?: string;
      sessionId?: string;
    } = {};

    if (query.model) {
      filters.model = query.model;
    }
    if (query.userId) {
      filters.userId = query.userId;
    }
    if (query.sessionId) {
      filters.sessionId = query.sessionId;
    }

    const data = this.databaseService.getDetailedTokenStats(
      from,
      to,
      intervalMs,
      Object.keys(filters).length > 0 ? filters : undefined,
    );

    const summary = {
      totalInput: 0,
      totalOutput: 0,
      totalCacheRead: 0,
      totalCacheCreation: 0,
      total: 0,
    };

    const mappedData = data.map((row) => {
      summary.totalInput += row.input;
      summary.totalOutput += row.output;
      summary.totalCacheRead += row.cache_read;
      summary.totalCacheCreation += row.cache_creation;
      summary.total += row.total;

      return {
        timestamp: row.timestamp,
        input: row.input,
        output: row.output,
        cacheRead: row.cache_read,
        cacheCreation: row.cache_creation,
        total: row.total,
        model: row.model,
      };
    });

    return {
      data: mappedData,
      summary,
    };
  }

  getModelStats(query: TimeRangeDto): ModelsStatsResponse {
    const { from, to } = this.getTimeRange(query);

    const data = this.databaseService.getModelStats(from, to);

    return {
      models: data.map((row) => ({
        model: row.model,
        totalCost: row.total_cost,
        totalTokens: row.total_tokens,
        requestCount: row.request_count,
        avgTokensPerRequest:
          row.request_count > 0
            ? Math.round(row.total_tokens / row.request_count)
            : 0,
      })),
    };
  }

  getUsersCostTimeSeries(query: TimeRangeDto): UserCostTimeSeriesResponse {
    const { from, to, intervalMs } = this.getTimeRange(query);

    const rawData = this.databaseService.getUsersTimeSeries(
      'claude_code.cost.usage',
      from,
      to,
      intervalMs,
    );

    const userDataMap = new Map<string, UserTimeSeries>();

    for (const row of rawData) {
      const existing = userDataMap.get(row.user_account_uuid);
      if (existing) {
        (existing.data as { timestamp: number; value: number }[]).push({
          timestamp: row.timestamp,
          value: row.value,
        });
      } else {
        userDataMap.set(row.user_account_uuid, {
          userId: row.user_account_uuid,
          data: [{ timestamp: row.timestamp, value: row.value }],
        });
      }
    }

    return {
      data: Array.from(userDataMap.values()),
      interval: query.interval === 'day' ? 'day' : 'hour',
    };
  }

  getUsersTokenTimeSeries(query: TimeRangeDto): UserTokenTimeSeriesResponse {
    const { from, to, intervalMs } = this.getTimeRange(query);

    const rawData = this.databaseService.getUsersTimeSeries(
      'claude_code.token.usage',
      from,
      to,
      intervalMs,
    );

    const userDataMap = new Map<string, UserTimeSeries>();

    for (const row of rawData) {
      const existing = userDataMap.get(row.user_account_uuid);
      if (existing) {
        (existing.data as { timestamp: number; value: number }[]).push({
          timestamp: row.timestamp,
          value: row.value,
        });
      } else {
        userDataMap.set(row.user_account_uuid, {
          userId: row.user_account_uuid,
          data: [{ timestamp: row.timestamp, value: row.value }],
        });
      }
    }

    return {
      data: Array.from(userDataMap.values()),
      interval: query.interval === 'day' ? 'day' : 'hour',
    };
  }
}

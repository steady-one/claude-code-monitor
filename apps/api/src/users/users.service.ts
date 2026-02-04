import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type { UsersQueryDto, UserDetailQueryDto } from './dto/users-query.dto';
import type { DailyStatsQueryDto } from './dto/daily-stats-query.dto';
import type {
  UsersResponse,
  UserDetail,
  UserDailyStatsResponse,
  DailyStatsRow,
} from '@claude-code-monitor/shared';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_RANGE_DAYS = 7;

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  private getTimeRange(query: { from?: number; to?: number }): {
    from: number;
    to: number;
  } {
    const now = Date.now();
    const to = query.to ?? now;
    const from = query.from ?? to - DEFAULT_RANGE_DAYS * DAY_MS;
    return { from, to };
  }

  getUsers(query: UsersQueryDto): UsersResponse {
    const { from, to } = this.getTimeRange(query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const filters: { organizationId?: string; terminalType?: string } = {};
    if (query.organizationId) {
      filters.organizationId = query.organizationId;
    }
    if (query.terminalType) {
      filters.terminalType = query.terminalType;
    }

    const { users, total } = this.databaseService.getAllUsers(
      from,
      to,
      page,
      pageSize,
      Object.keys(filters).length > 0 ? filters : undefined,
      query.sortBy ?? 'cost',
      query.sortOrder ?? 'desc',
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

  getUserDetail(userId: string, query: UserDetailQueryDto): UserDetail {
    const { from, to } = this.getTimeRange(query);

    const user = this.databaseService.getUserDetail(userId, from, to);

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    const sessions = this.databaseService.getUserSessions(userId, 10);
    const modelUsage = this.databaseService.getUserModelUsage(userId, from, to);

    const modelUsageMap: Record<string, { cost: number; tokens: number }> = {};
    for (const model of modelUsage) {
      modelUsageMap[model.model] = {
        cost: model.cost,
        tokens: model.tokens,
      };
    }

    return {
      userId: user.account_uuid,
      organizationId: user.organization_id,
      firstSeen: user.first_seen,
      lastSeen: user.last_seen,
      stats: {
        totalCost: user.total_cost,
        totalTokens: user.total_tokens,
        inputTokens: user.input_tokens,
        outputTokens: user.output_tokens,
        cacheReadTokens: user.cache_read_tokens,
        cacheCreationTokens: user.cache_creation_tokens,
        sessionCount: user.session_count,
        modelUsage: modelUsageMap,
      },
      recentSessions: sessions.map((s) => ({
        sessionId: s.session_id,
        startTime: s.start_time,
        cost: s.cost,
      })),
    };
  }

  getUserDailyStats(
    userId: string,
    query: DailyStatsQueryDto,
  ): UserDailyStatsResponse {
    const { from, to } = this.getTimeRange(query);
    const groupBy = query.groupBy ?? 'day';

    const rawStats = this.databaseService.getUserDailyStats(
      userId,
      from,
      to,
      groupBy,
    );

    const stats: DailyStatsRow[] = rawStats.map((row) => {
      const date = new Date(row.date_timestamp);
      const dateLabel =
        groupBy === 'day'
          ? date.toISOString().split('T')[0]
          : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const models = row.models
        ? row.models
            .split(',')
            .filter((m): m is string => m !== null && m !== 'null')
        : [];

      return {
        date: row.date_timestamp,
        dateLabel,
        models,
        inputTokens: row.input_tokens,
        outputTokens: row.output_tokens,
        cacheCreateTokens: row.cache_create_tokens,
        cacheReadTokens: row.cache_read_tokens,
        totalTokens: row.total_tokens,
        totalCost: row.total_cost,
      };
    });

    const summary = stats.reduce(
      (acc, row) => ({
        totalInputTokens: acc.totalInputTokens + row.inputTokens,
        totalOutputTokens: acc.totalOutputTokens + row.outputTokens,
        totalCacheCreateTokens: acc.totalCacheCreateTokens + row.cacheCreateTokens,
        totalCacheReadTokens: acc.totalCacheReadTokens + row.cacheReadTokens,
        totalTokens: acc.totalTokens + row.totalTokens,
        totalCost: acc.totalCost + row.totalCost,
      }),
      {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCacheCreateTokens: 0,
        totalCacheReadTokens: 0,
        totalTokens: 0,
        totalCost: 0,
      },
    );

    return { stats, summary };
  }
}

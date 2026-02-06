import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { AuthGuard } from '../otlp/guards/auth.guard';
import {
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
} from '@claude-code-monitor/shared';

@Controller('api/metrics')
@UseGuards(AuthGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('summary')
  getSummary(@Query() query: TimeRangeDto): MetricsSummary {
    return this.metricsService.getSummary(query);
  }

  @Get('cost')
  getCostTimeSeries(@Query() query: UserTimeRangeDto): CostTimeSeriesResponse {
    return this.metricsService.getCostTimeSeries(query);
  }

  @Get('tokens')
  getTokenTimeSeries(@Query() query: UserTimeRangeDto): TokenTimeSeriesResponse {
    return this.metricsService.getTokenTimeSeries(query);
  }

  @Get('tokens/detailed')
  getDetailedTokens(
    @Query() query: DetailedTokensQueryDto,
  ): DetailedTokensResponse {
    return this.metricsService.getDetailedTokens(query);
  }

  @Get('models')
  getModelStats(@Query() query: TimeRangeDto): ModelsStatsResponse {
    return this.metricsService.getModelStats(query);
  }

  @Get('users')
  getUsers(@Query() query: PaginatedTimeRangeDto): UsersResponse {
    return this.metricsService.getUsers(query);
  }

  @Get('cost/by-user')
  getUsersCostTimeSeries(
    @Query() query: TimeRangeDto,
  ): UserCostTimeSeriesResponse {
    return this.metricsService.getUsersCostTimeSeries(query);
  }

  @Get('tokens/by-user')
  getUsersTokenTimeSeries(
    @Query() query: TimeRangeDto,
  ): UserTokenTimeSeriesResponse {
    return this.metricsService.getUsersTokenTimeSeries(query);
  }
}

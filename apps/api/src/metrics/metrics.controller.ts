import { Controller, Get, Query } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import {
  TimeRangeDto,
  PaginatedTimeRangeDto,
  DetailedTokensQueryDto,
} from './dto/time-range.dto';
import type {
  MetricsSummary,
  CostTimeSeriesResponse,
  TokenTimeSeriesResponse,
  UsersResponse,
  DetailedTokensResponse,
  ModelsStatsResponse,
} from '@claude-code-monitor/shared';

@Controller('api/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('summary')
  getSummary(@Query() query: TimeRangeDto): MetricsSummary {
    return this.metricsService.getSummary(query);
  }

  @Get('cost')
  getCostTimeSeries(@Query() query: TimeRangeDto): CostTimeSeriesResponse {
    return this.metricsService.getCostTimeSeries(query);
  }

  @Get('tokens')
  getTokenTimeSeries(@Query() query: TimeRangeDto): TokenTimeSeriesResponse {
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
}

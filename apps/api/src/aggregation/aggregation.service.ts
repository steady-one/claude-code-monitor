import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const RETENTION_DAYS = 90;

@Injectable()
export class AggregationService implements OnModuleInit {
  private readonly logger = new Logger(AggregationService.name);
  private lastAggregatedHour: number = 0;

  constructor(private readonly databaseService: DatabaseService) {}

  onModuleInit(): void {
    const now = Date.now();
    this.lastAggregatedHour = Math.floor(now / HOUR_MS) * HOUR_MS - HOUR_MS;
    this.logger.log(
      `Initialized with last aggregated hour: ${new Date(this.lastAggregatedHour).toISOString()}`,
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async aggregateHourlyMetrics(): Promise<void> {
    const now = Date.now();
    const currentHour = Math.floor(now / HOUR_MS) * HOUR_MS;
    const previousHour = currentHour - HOUR_MS;

    if (previousHour <= this.lastAggregatedHour) {
      this.logger.debug('Hour already aggregated, skipping');
      return;
    }

    this.logger.log(
      `Starting hourly aggregation for ${new Date(previousHour).toISOString()}`,
    );

    try {
      const metrics = this.databaseService.getMetricsForAggregation(
        previousHour,
        currentHour,
      );

      let aggregatedCount = 0;
      for (const metric of metrics) {
        this.databaseService.upsertHourlyAggregate(
          metric.metric_name,
          metric.hour_timestamp,
          metric.user_account_uuid,
          metric.sum_value,
          metric.count_value,
          metric.attributes_hash,
          metric.attributes,
        );
        aggregatedCount++;
      }

      this.lastAggregatedHour = previousHour;
      this.logger.log(
        `Aggregated ${aggregatedCount} metric groups for hour ${new Date(previousHour).toISOString()}`,
      );
    } catch (error) {
      this.logger.error('Hourly aggregation failed', error);
    }
  }

  @Cron('0 2 * * *')
  async cleanupOldRawMetrics(): Promise<void> {
    const retentionThreshold = Date.now() - RETENTION_DAYS * DAY_MS;

    this.logger.log(
      `Starting cleanup of raw metrics older than ${new Date(retentionThreshold).toISOString()}`,
    );

    try {
      const deletedCount =
        this.databaseService.deleteOldRawMetrics(retentionThreshold);
      this.logger.log(`Deleted ${deletedCount} old raw metric records`);
    } catch (error) {
      this.logger.error('Raw metrics cleanup failed', error);
    }
  }

  async runManualAggregation(
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<{ aggregatedGroups: number }> {
    this.logger.log(
      `Running manual aggregation from ${new Date(fromTimestamp).toISOString()} to ${new Date(toTimestamp).toISOString()}`,
    );

    const metrics = this.databaseService.getMetricsForAggregation(
      fromTimestamp,
      toTimestamp,
    );

    let aggregatedCount = 0;
    for (const metric of metrics) {
      this.databaseService.upsertHourlyAggregate(
        metric.metric_name,
        metric.hour_timestamp,
        metric.user_account_uuid,
        metric.sum_value,
        metric.count_value,
        metric.attributes_hash,
        metric.attributes,
      );
      aggregatedCount++;
    }

    return { aggregatedGroups: aggregatedCount };
  }
}

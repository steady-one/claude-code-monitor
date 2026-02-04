import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type {
  ExportMetricsServiceRequest,
  ExportMetricsServiceResponse,
  KeyValue,
  AnyValue,
  NumberDataPoint,
  Metric,
  InsertMetricDto,
  RequestMetadata,
  RequestLogStatus,
} from '@claude-code-monitor/shared';

const CLAUDE_CODE_RESOURCE_ATTRIBUTES = {
  SESSION_ID: 'claude_code.session_id',
  USER_ACCOUNT_UUID: 'claude_code.user_account_uuid',
  ORGANIZATION_ID: 'claude_code.organization_id',
} as const;

@Injectable()
export class OtlpService implements OnModuleDestroy {
  private readonly logger = new Logger(OtlpService.name);
  private readonly metricsBuffer: InsertMetricDto[] = [];
  private readonly bufferFlushInterval = 5000;
  private readonly maxBufferSize = 1000;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(private readonly databaseService: DatabaseService) {
    this.startFlushTimer();
  }

  onModuleDestroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushBuffer();
    this.logger.log('OtlpService destroyed, buffer flushed');
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushBuffer();
    }, this.bufferFlushInterval);
  }

  private flushBuffer(): void {
    if (this.metricsBuffer.length === 0) {
      return;
    }

    const metricsToInsert = [...this.metricsBuffer];
    this.metricsBuffer.length = 0;

    try {
      this.databaseService.insertMetrics(metricsToInsert);
      this.logger.log(`Flushed ${metricsToInsert.length} metrics to database`);

      const usersToUpdate = new Map<
        string,
        { organizationId: string | null; timestamp: number }
      >();

      for (const metric of metricsToInsert) {
        if (metric.userAccountUuid) {
          const existing = usersToUpdate.get(metric.userAccountUuid);
          if (!existing || metric.timestamp > existing.timestamp) {
            usersToUpdate.set(metric.userAccountUuid, {
              organizationId: metric.organizationId ?? null,
              timestamp: metric.timestamp,
            });
          }
        }
      }

      for (const [uuid, data] of usersToUpdate) {
        this.databaseService.upsertUser(uuid, data.organizationId, data.timestamp);
      }
    } catch (error) {
      this.logger.error('Failed to flush metrics buffer', error);
      this.metricsBuffer.unshift(...metricsToInsert);
    }
  }

  async processMetrics(
    request: ExportMetricsServiceRequest,
    metadata?: RequestMetadata,
  ): Promise<ExportMetricsServiceResponse> {
    const startTime = Date.now();
    let processedCount = 0;
    let rejectedCount = 0;
    let receivedCount = 0;
    let errorMessage: string | undefined;
    let status: RequestLogStatus = 'success';

    try {
      for (const resourceMetrics of request.resourceMetrics) {
        const resourceAttributes = this.parseResourceAttributes(
          resourceMetrics.resource?.attributes ?? [],
        );

        for (const scopeMetrics of resourceMetrics.scopeMetrics) {
          for (const metric of scopeMetrics.metrics) {
            const dataPoints = this.extractDataPoints(metric);
            receivedCount += dataPoints.length;

            try {
              const parsed = this.parseMetric(metric, resourceAttributes);
              this.metricsBuffer.push(...parsed);
              processedCount += parsed.length;

              if (this.metricsBuffer.length >= this.maxBufferSize) {
                this.flushBuffer();
              }
            } catch (error) {
              this.logger.warn(`Failed to parse metric ${metric.name}`, error);
              rejectedCount++;
            }
          }
        }
      }

      if (rejectedCount > 0) {
        status = 'partial';
      }
    } catch (error) {
      status = 'error';
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to process metrics', error);
    } finally {
      if (metadata) {
        const processingTime = Date.now() - startTime;
        this.databaseService.insertRequestLog({
          endpoint: metadata.endpoint,
          method: metadata.method,
          clientIp: metadata.clientIp,
          userAgent: metadata.userAgent,
          requestSize: metadata.requestSize,
          dataPointsReceived: receivedCount,
          dataPointsProcessed: processedCount,
          dataPointsRejected: rejectedCount,
          processingTimeMs: processingTime,
          status,
          errorMessage,
          timestamp: startTime,
        });
      }
    }

    this.logger.log(
      `Processed ${processedCount} data points, rejected ${rejectedCount}`,
    );

    return rejectedCount > 0
      ? { partialSuccess: { rejectedDataPoints: rejectedCount } }
      : {};
  }

  private parseResourceAttributes(attributes: readonly KeyValue[]): {
    sessionId?: string;
    userAccountUuid?: string;
    organizationId?: string;
  } {
    const result: {
      sessionId?: string;
      userAccountUuid?: string;
      organizationId?: string;
    } = {};

    for (const attr of attributes) {
      const value = this.extractStringValue(attr.value);
      if (!value) continue;

      switch (attr.key) {
        case CLAUDE_CODE_RESOURCE_ATTRIBUTES.SESSION_ID:
          result.sessionId = value;
          break;
        case CLAUDE_CODE_RESOURCE_ATTRIBUTES.USER_ACCOUNT_UUID:
          result.userAccountUuid = value;
          break;
        case CLAUDE_CODE_RESOURCE_ATTRIBUTES.ORGANIZATION_ID:
          result.organizationId = value;
          break;
      }
    }

    return result;
  }

  private parseMetric(
    metric: Metric,
    resourceAttributes: {
      sessionId?: string;
      userAccountUuid?: string;
      organizationId?: string;
    },
  ): InsertMetricDto[] {
    const dataPoints = this.extractDataPoints(metric);
    const results: InsertMetricDto[] = [];

    for (const point of dataPoints) {
      const timestamp = this.parseNanoTimestamp(point.timeUnixNano);
      const value = this.extractNumericValue(point);
      const attributes = this.parseAttributes(point.attributes ?? []);

      const sessionId =
        resourceAttributes.sessionId ??
        (attributes['session.id'] as string | undefined);
      const userAccountUuid =
        resourceAttributes.userAccountUuid ??
        (attributes['user.account_uuid'] as string | undefined);
      const organizationId =
        resourceAttributes.organizationId ??
        (attributes['organization.id'] as string | undefined);

      results.push({
        metricName: metric.name,
        metricValue: value,
        timestamp,
        sessionId,
        userAccountUuid,
        organizationId,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      });
    }

    return results;
  }

  private extractDataPoints(metric: Metric): readonly NumberDataPoint[] {
    if (metric.sum) {
      return metric.sum.dataPoints;
    }
    if (metric.gauge) {
      return metric.gauge.dataPoints;
    }
    return [];
  }

  private parseNanoTimestamp(nanoStr: string): number {
    const nanos = BigInt(nanoStr);
    return Number(nanos / BigInt(1_000_000));
  }

  private extractNumericValue(point: NumberDataPoint): number {
    if (point.asDouble !== undefined) {
      return point.asDouble;
    }
    if (point.asInt !== undefined) {
      return typeof point.asInt === 'string'
        ? parseInt(point.asInt, 10)
        : point.asInt;
    }
    return 0;
  }

  private extractStringValue(value: AnyValue): string | undefined {
    if (value.stringValue !== undefined) {
      return value.stringValue;
    }
    if (value.intValue !== undefined) {
      return String(value.intValue);
    }
    if (value.doubleValue !== undefined) {
      return String(value.doubleValue);
    }
    if (value.boolValue !== undefined) {
      return String(value.boolValue);
    }
    return undefined;
  }

  private parseAttributes(
    attributes: readonly KeyValue[],
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const attr of attributes) {
      result[attr.key] = this.extractAnyValue(attr.value);
    }

    return result;
  }

  private extractAnyValue(value: AnyValue): unknown {
    if (value.stringValue !== undefined) return value.stringValue;
    if (value.intValue !== undefined) return value.intValue;
    if (value.doubleValue !== undefined) return value.doubleValue;
    if (value.boolValue !== undefined) return value.boolValue;
    if (value.arrayValue) {
      return value.arrayValue.values.map((v) => this.extractAnyValue(v));
    }
    if (value.kvlistValue) {
      return this.parseAttributes(value.kvlistValue.values);
    }
    if (value.bytesValue !== undefined) return value.bytesValue;
    return null;
  }
}

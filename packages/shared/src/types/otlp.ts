/**
 * OTLP (OpenTelemetry Protocol) HTTP/JSON 형식 타입 정의
 * 참고: https://opentelemetry.io/docs/specs/otlp/#otlphttp
 */

/**
 * 키-값 속성
 */
export interface KeyValue {
  readonly key: string;
  readonly value: AnyValue;
}

/**
 * 다양한 타입의 값
 */
export interface AnyValue {
  readonly stringValue?: string;
  readonly boolValue?: boolean;
  readonly intValue?: string | number;
  readonly doubleValue?: number;
  readonly arrayValue?: ArrayValue;
  readonly kvlistValue?: KeyValueList;
  readonly bytesValue?: string;
}

export interface ArrayValue {
  readonly values: readonly AnyValue[];
}

export interface KeyValueList {
  readonly values: readonly KeyValue[];
}

/**
 * 리소스 정보
 */
export interface Resource {
  readonly attributes: readonly KeyValue[];
  readonly droppedAttributesCount?: number;
}

/**
 * Instrumentation Scope
 */
export interface InstrumentationScope {
  readonly name: string;
  readonly version?: string;
  readonly attributes?: readonly KeyValue[];
  readonly droppedAttributesCount?: number;
}

/**
 * 데이터 포인트 - 숫자 타입
 */
export interface NumberDataPoint {
  readonly attributes?: readonly KeyValue[];
  readonly startTimeUnixNano?: string;
  readonly timeUnixNano: string;
  readonly asDouble?: number;
  readonly asInt?: string | number;
  readonly exemplars?: readonly Exemplar[];
  readonly flags?: number;
}

/**
 * Exemplar
 */
export interface Exemplar {
  readonly filteredAttributes?: readonly KeyValue[];
  readonly timeUnixNano: string;
  readonly asDouble?: number;
  readonly asInt?: string | number;
  readonly spanId?: string;
  readonly traceId?: string;
}

/**
 * Sum 메트릭
 */
export interface Sum {
  readonly dataPoints: readonly NumberDataPoint[];
  readonly aggregationTemporality: AggregationTemporality;
  readonly isMonotonic?: boolean;
}

/**
 * Gauge 메트릭
 */
export interface Gauge {
  readonly dataPoints: readonly NumberDataPoint[];
}

/**
 * Histogram 데이터 포인트
 */
export interface HistogramDataPoint {
  readonly attributes?: readonly KeyValue[];
  readonly startTimeUnixNano?: string;
  readonly timeUnixNano: string;
  readonly count: string | number;
  readonly sum?: number;
  readonly bucketCounts?: readonly (string | number)[];
  readonly explicitBounds?: readonly number[];
  readonly exemplars?: readonly Exemplar[];
  readonly flags?: number;
  readonly min?: number;
  readonly max?: number;
}

/**
 * Histogram 메트릭
 */
export interface Histogram {
  readonly dataPoints: readonly HistogramDataPoint[];
  readonly aggregationTemporality: AggregationTemporality;
}

/**
 * 집계 시간성
 */
export enum AggregationTemporality {
  UNSPECIFIED = 0,
  DELTA = 1,
  CUMULATIVE = 2,
}

/**
 * 메트릭 데이터
 */
export interface Metric {
  readonly name: string;
  readonly description?: string;
  readonly unit?: string;
  readonly sum?: Sum;
  readonly gauge?: Gauge;
  readonly histogram?: Histogram;
}

/**
 * Scope 메트릭
 */
export interface ScopeMetrics {
  readonly scope?: InstrumentationScope;
  readonly metrics: readonly Metric[];
  readonly schemaUrl?: string;
}

/**
 * 리소스 메트릭
 */
export interface ResourceMetrics {
  readonly resource?: Resource;
  readonly scopeMetrics: readonly ScopeMetrics[];
  readonly schemaUrl?: string;
}

/**
 * OTLP 메트릭 내보내기 요청
 */
export interface ExportMetricsServiceRequest {
  readonly resourceMetrics: readonly ResourceMetrics[];
}

/**
 * OTLP 메트릭 내보내기 응답
 */
export interface ExportMetricsServiceResponse {
  readonly partialSuccess?: {
    readonly rejectedDataPoints?: number;
    readonly errorMessage?: string;
  };
}

# Claude Code 모니터링 가이드

Claude Code에 대한 OpenTelemetry를 활성화하고 구성하는 방법입니다.

Claude Code는 모니터링 및 관찰성을 위해 OpenTelemetry(OTel) 메트릭 및 이벤트를 지원합니다.

모든 메트릭은 OpenTelemetry의 표준 메트릭 프로토콜을 통해 내보내지는 시계열 데이터이며, 이벤트는 OpenTelemetry의 로그/이벤트 프로토콜을 통해 내보내집니다.

---

## 빠른 시작

환경 변수를 사용하여 OpenTelemetry를 구성합니다:

```bash
# 1. 원격 측정 활성화
export CLAUDE_CODE_ENABLE_TELEMETRY=1

# 2. 내보내기 선택 (둘 다 선택 사항 - 필요한 것만 구성)
export OTEL_METRICS_EXPORTER=otlp       # 옵션: otlp, prometheus, console
export OTEL_LOGS_EXPORTER=otlp          # 옵션: otlp, console

# 3. OTLP 엔드포인트 구성 (OTLP 내보내기용)
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# 4. 인증 설정 (필요한 경우)
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer your-token"

# 5. 디버깅용: 내보내기 간격 단축
export OTEL_METRIC_EXPORT_INTERVAL=10000  # 10초 (기본값: 60000ms)
export OTEL_LOGS_EXPORT_INTERVAL=5000     # 5초 (기본값: 5000ms)

# 6. Claude Code 실행
claude
```

> **참고**: 기본 내보내기 간격은 메트릭의 경우 60초, 로그의 경우 5초입니다.

---

## 관리자 구성

관리자는 관리 설정 파일을 통해 모든 사용자에 대한 OpenTelemetry 설정을 구성할 수 있습니다.

```json
{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_METRICS_EXPORTER": "otlp",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "grpc",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "http://collector.company.com:4317",
    "OTEL_EXPORTER_OTLP_HEADERS": "Authorization=Bearer company-token"
  }
}
```

> 관리 설정은 MDM 또는 기타 장치 관리 솔루션을 통해 배포할 수 있습니다.

---

## 구성 세부 정보

### 일반적인 구성 변수

| 환경 변수 | 설명 | 예제 값 |
|---------|------|--------|
| `CLAUDE_CODE_ENABLE_TELEMETRY` | 원격 측정 수집 활성화 (필수) | `1` |
| `OTEL_METRICS_EXPORTER` | 메트릭 내보내기 유형 | `console`, `otlp`, `prometheus` |
| `OTEL_LOGS_EXPORTER` | 로그/이벤트 내보내기 유형 | `console`, `otlp` |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | OTLP 내보내기 프로토콜 | `grpc`, `http/json`, `http/protobuf` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTLP 수집기 엔드포인트 | `http://localhost:4317` |
| `OTEL_EXPORTER_OTLP_METRICS_PROTOCOL` | 메트릭 프로토콜 (일반 설정 재정의) | `grpc`, `http/json`, `http/protobuf` |
| `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` | OTLP 메트릭 엔드포인트 | `http://localhost:4318/v1/metrics` |
| `OTEL_EXPORTER_OTLP_LOGS_PROTOCOL` | 로그 프로토콜 (일반 설정 재정의) | `grpc`, `http/json`, `http/protobuf` |
| `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | OTLP 로그 엔드포인트 | `http://localhost:4318/v1/logs` |
| `OTEL_EXPORTER_OTLP_HEADERS` | OTLP용 인증 헤더 | `Authorization=Bearer token` |
| `OTEL_EXPORTER_OTLP_METRICS_CLIENT_KEY` | mTLS 인증용 클라이언트 키 | 클라이언트 키 파일 경로 |
| `OTEL_EXPORTER_OTLP_METRICS_CLIENT_CERTIFICATE` | mTLS 인증용 클라이언트 인증서 | 클라이언트 인증서 파일 경로 |
| `OTEL_METRIC_EXPORT_INTERVAL` | 내보내기 간격 (기본값: 60000ms) | `5000`, `60000` |
| `OTEL_LOGS_EXPORT_INTERVAL` | 로그 내보내기 간격 (기본값: 5000ms) | `1000`, `10000` |
| `OTEL_LOG_USER_PROMPTS` | 사용자 프롬프트 콘텐츠 로깅 활성화 | `1`로 활성화 |
| `CLAUDE_CODE_OTEL_HEADERS_HELPER_DEBOUNCE_MS` | 동적 헤더 새로 고침 간격 (기본값: 29분) | `900000` |

### 메트릭 카디널리티 제어

| 환경 변수 | 설명 | 기본값 |
|---------|------|--------|
| `OTEL_METRICS_INCLUDE_SESSION_ID` | 메트릭에 session.id 속성 포함 | `true` |
| `OTEL_METRICS_INCLUDE_VERSION` | 메트릭에 app.version 속성 포함 | `false` |
| `OTEL_METRICS_INCLUDE_ACCOUNT_UUID` | 메트릭에 user.account_uuid 속성 포함 | `true` |

---

## 동적 헤더

동적 인증이 필요한 엔터프라이즈 환경의 경우 스크립트를 구성하여 헤더를 동적으로 생성할 수 있습니다.

### 설정 구성

`.claude/settings.json`에 추가:

```json
{
  "otelHeadersHelper": "/bin/generate_opentelemetry_headers.sh"
}
```

### 스크립트 요구 사항

스크립트는 HTTP 헤더를 나타내는 문자열 키-값 쌍이 있는 유효한 JSON을 출력해야 합니다:

```bash
#!/bin/bash
echo "{\"Authorization\": \"Bearer $(get-token.sh)\", \"X-API-Key\": \"$(get-api-key.sh)\"}"
```

---

## 다중 팀 조직 지원

여러 팀 또는 부서가 있는 조직은 `OTEL_RESOURCE_ATTRIBUTES` 환경 변수를 사용하여 사용자 정의 속성을 추가할 수 있습니다:

```bash
export OTEL_RESOURCE_ATTRIBUTES="department=engineering,team.id=platform,cost_center=eng-123"
```

> **주의**: `OTEL_RESOURCE_ATTRIBUTES`는 W3C Baggage 사양을 따르며 값에 공백을 포함할 수 없습니다.

---

## 예제 구성

```bash
# 콘솔 디버깅 (1초 간격)
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=console
export OTEL_METRIC_EXPORT_INTERVAL=1000

# OTLP/gRPC
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# Prometheus
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=prometheus

# 여러 내보내기
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=console,otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=http/json

# 메트릭 및 로그에 대한 다양한 엔드포인트
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_LOGS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_METRICS_PROTOCOL=http/protobuf
export OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://metrics.company.com:4318
export OTEL_EXPORTER_OTLP_LOGS_PROTOCOL=grpc
export OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://logs.company.com:4317
```

---

## 사용 가능한 메트릭 및 이벤트

### 표준 속성

모든 메트릭 및 이벤트에 포함되는 속성:

| 속성 | 설명 | 제어 대상 |
|-----|------|---------|
| `session.id` | 고유 세션 식별자 | `OTEL_METRICS_INCLUDE_SESSION_ID` (기본값: true) |
| `app.version` | 현재 Claude Code 버전 | `OTEL_METRICS_INCLUDE_VERSION` (기본값: false) |
| `organization.id` | 조직 UUID (인증된 경우) | 항상 포함됨 |
| `user.account_uuid` | 계정 UUID (인증된 경우) | `OTEL_METRICS_INCLUDE_ACCOUNT_UUID` (기본값: true) |
| `terminal.type` | 터미널 유형 | 감지될 때 항상 포함됨 |

### 메트릭

| 메트릭 이름 | 설명 | 단위 |
|-----------|------|-----|
| `claude_code.session.count` | 시작된 CLI 세션 수 | count |
| `claude_code.lines_of_code.count` | 수정된 코드 라인 수 | count |
| `claude_code.pull_request.count` | 생성된 풀 요청 수 | count |
| `claude_code.commit.count` | 생성된 git 커밋 수 | count |
| `claude_code.cost.usage` | Claude Code 세션의 비용 | USD |
| `claude_code.token.usage` | 사용된 토큰 수 | tokens |
| `claude_code.code_edit_tool.decision` | 코드 편집 도구 권한 결정 수 | count |
| `claude_code.active_time.total` | 총 활성 시간 | s |

### 메트릭 세부 정보

#### 세션 카운터
각 세션 시작 시 증가합니다.

#### 코드 라인 카운터
코드가 추가되거나 제거될 때 증가합니다.
- **속성**: `type` (`"added"`, `"removed"`)

#### 비용 카운터
각 API 요청 후 증가합니다.
- **속성**: `model` (예: "claude-sonnet-4-5-20250929")

#### 토큰 카운터
각 API 요청 후 증가합니다.
- **속성**:
  - `type` (`"input"`, `"output"`, `"cacheRead"`, `"cacheCreation"`)
  - `model` (예: "claude-sonnet-4-5-20250929")

#### 코드 편집 도구 결정 카운터
사용자가 Edit, Write 또는 NotebookEdit 도구 사용을 수락하거나 거부할 때 증가합니다.
- **속성**:
  - `tool` (`"Edit"`, `"Write"`, `"NotebookEdit"`)
  - `decision` (`"accept"`, `"reject"`)
  - `language` (예: `"TypeScript"`, `"Python"`)

#### 활성 시간 카운터
Claude Code를 적극적으로 사용하는 실제 시간을 추적합니다 (유휴 시간 제외).

---

### 이벤트

Claude Code는 OpenTelemetry 로그/이벤트를 통해 다음 이벤트를 내보냅니다:

#### 사용자 프롬프트 이벤트 (`claude_code.user_prompt`)
- `event.name`: `"user_prompt"`
- `event.timestamp`: ISO 8601 타임스탬프
- `prompt_length`: 프롬프트의 길이
- `prompt`: 프롬프트 콘텐츠 (기본적으로 수정됨, `OTEL_LOG_USER_PROMPTS=1`로 활성화)

#### 도구 결과 이벤트 (`claude_code.tool_result`)
- `tool_name`: 도구의 이름
- `success`: `"true"` 또는 `"false"`
- `duration_ms`: 실행 시간 (밀리초)
- `error`: 오류 메시지 (실패한 경우)
- `decision`: `"accept"` 또는 `"reject"`
- `source`: 결정 출처 (`"config"`, `"user_permanent"`, `"user_temporary"`, `"user_abort"`, `"user_reject"`)

#### API 요청 이벤트 (`claude_code.api_request`)
- `model`: 사용된 모델
- `cost_usd`: USD 단위의 예상 비용
- `duration_ms`: 요청 지속 시간
- `input_tokens`: 입력 토큰 수
- `output_tokens`: 출력 토큰 수
- `cache_read_tokens`: 캐시에서 읽은 토큰 수
- `cache_creation_tokens`: 캐시 생성에 사용된 토큰 수

#### API 오류 이벤트 (`claude_code.api_error`)
- `model`: 사용된 모델
- `error`: 오류 메시지
- `status_code`: HTTP 상태 코드
- `duration_ms`: 요청 지속 시간
- `attempt`: 시도 번호 (재시도된 요청의 경우)

#### 도구 결정 이벤트 (`claude_code.tool_decision`)
- `tool_name`: 도구의 이름
- `decision`: `"accept"` 또는 `"reject"`
- `source`: 결정 출처

---

## 메트릭 및 이벤트 데이터 해석

### 사용 모니터링

| 메트릭 | 분석 기회 |
|-------|---------|
| `claude_code.token.usage` | type (입력/출력), 사용자, 팀 또는 모델별로 분류 |
| `claude_code.session.count` | 시간 경과에 따른 채택 및 참여 추적 |
| `claude_code.lines_of_code.count` | 코드 추가/제거를 추적하여 생산성 측정 |
| `claude_code.commit.count` & `claude_code.pull_request.count` | 개발 워크플로우에 미치는 영향 이해 |

### 비용 모니터링

`claude_code.cost.usage` 메트릭은 다음에 도움이 됩니다:
- 팀 또는 개인 전체의 사용 추세 추적
- 최적화를 위한 높은 사용 세션 식별

> **참고**: 비용 메트릭은 근사값입니다. 공식 청구 데이터는 API 제공자를 참조하세요.

### 경고 및 세분화

고려할 일반적인 경고:
- 비용 급증
- 비정상적인 토큰 소비
- 특정 사용자의 높은 세션 볼륨

모든 메트릭은 `user.account_uuid`, `organization.id`, `session.id`, `model`, `app.version`으로 세분화할 수 있습니다.

---

## 백엔드 고려 사항

### 메트릭의 경우
- **시계열 데이터베이스 (예: Prometheus)**: 비율 계산, 집계된 메트릭
- **컬럼형 저장소 (예: ClickHouse)**: 복잡한 쿼리, 고유 사용자 분석
- **관찰성 플랫폼 (예: Honeycomb, Datadog)**: 고급 쿼리, 시각화, 경고

### 이벤트/로그의 경우
- **로그 집계 시스템 (예: Elasticsearch, Loki)**: 전체 텍스트 검색, 로그 분석
- **컬럼형 저장소 (예: ClickHouse)**: 구조화된 이벤트 분석
- **관찰성 플랫폼 (예: Honeycomb, Datadog)**: 메트릭과 이벤트 간의 상관 관계

---

## 서비스 정보

모든 메트릭 및 이벤트는 다음 리소스 속성과 함께 내보내집니다:

| 속성 | 설명 |
|-----|------|
| `service.name` | `claude-code` |
| `service.version` | 현재 Claude Code 버전 |
| `os.type` | 운영 체제 유형 (예: `linux`, `darwin`, `windows`) |
| `os.version` | 운영 체제 버전 문자열 |
| `host.arch` | 호스트 아키텍처 (예: `amd64`, `arm64`) |
| `wsl.version` | WSL 버전 번호 (WSL에서 실행할 때만) |

미터 이름: `com.anthropic.claude_code`

---

## 보안/개인 정보 보호 고려 사항

- 원격 측정은 선택 사항이며 명시적 구성이 필요합니다
- API 키 또는 파일 콘텐츠와 같은 민감한 정보는 메트릭 또는 이벤트에 포함되지 않습니다
- 사용자 프롬프트 콘텐츠는 기본적으로 수정됩니다 - 프롬프트 길이만 기록됩니다
- 사용자 프롬프트 로깅을 활성화하려면 `OTEL_LOG_USER_PROMPTS=1`을 설정하세요

---

## 참고 자료

- [OpenTelemetry 사양](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/protocol/exporter.md#configuration-options)
- [Claude Code ROI 측정 가이드](https://github.com/anthropics/claude-code-monitoring-guide)
- [Claude Code 모니터링 구현 (Bedrock)](https://github.com/aws-solutions-library-samples/guidance-for-claude-code-with-amazon-bedrock/blob/main/assets/docs/MONITORING.md)

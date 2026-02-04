# Claude Code Monitor

Claude Code의 OpenTelemetry 메트릭을 수집하고 시각화하는 모니터링 시스템

## 기술 스택

- **Backend**: NestJS 11, better-sqlite3, TypeScript 5.7
- **Frontend**: Next.js 15, React 19, Tailwind CSS 4, Recharts, TanStack Query 5
- **Monorepo**: Yarn 4 Workspaces

## 프로젝트 구조

```
claude-code-monitor/
├── apps/
│   ├── api/          # NestJS 백엔드 (OTLP 수신, REST API)
│   └── web/          # Next.js 프론트엔드 (대시보드)
└── packages/
    └── shared/       # 공유 타입 정의
```

## 시작하기

### 요구사항

- Node.js 22+
- Yarn 4.x

### 설치

```bash
# 의존성 설치
yarn install

# 공유 패키지 빌드
yarn workspace @claude-code-monitor/shared build
```

### 환경 변수 설정

**API 서버** (`apps/api/.env`):
```env
DATABASE_PATH=./data/metrics.db
AUTH_TOKEN=your-bearer-token-here
PORT=4317
```

**Web 클라이언트** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4317
```

### 개발 서버 실행

```bash
# API + Web 동시 실행
yarn dev

# API만 실행
yarn dev:api

# Web만 실행
yarn dev:web
```

- API 서버: http://localhost:4317
- Web 대시보드: http://localhost:3000

## Claude Code 연동

Claude Code에서 메트릭을 전송하려면 다음 환경 변수를 설정하세요:

```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export OTEL_METRICS_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_PROTOCOL=http/json
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer your-bearer-token-here"
```

## API 엔드포인트

### OTLP 수신
- `POST /v1/metrics` - OTLP HTTP/JSON 메트릭 수신 (Bearer 토큰 인증 필요)

### 대시보드 API
- `GET /api/metrics/summary` - 전체 요약 통계
- `GET /api/metrics/cost` - 비용 시계열 데이터
- `GET /api/metrics/tokens` - 토큰 사용량 시계열 데이터
- `GET /api/metrics/users` - 사용자별 통계

쿼리 파라미터:
- `from`: 시작 타임스탬프 (ms)
- `to`: 종료 타임스탬프 (ms)
- `interval`: `hour` 또는 `day`

## 수집 메트릭

| 메트릭 이름 | 설명 |
|------------|------|
| `claude_code.session.count` | 세션 수 |
| `claude_code.token.usage` | 토큰 사용량 |
| `claude_code.cost.usage` | 비용 (USD) |
| `claude_code.lines_of_code.count` | 코드 라인 수 |
| `claude_code.commit.count` | 커밋 수 |
| `claude_code.pull_request.count` | PR 수 |
| `claude_code.active_time.total` | 활성 시간 |

## 데이터 저장

- 원시 메트릭: `raw_metrics` 테이블 (90일 보관)
- 시간별 집계: `hourly_aggregates` 테이블
- 사용자 캐시: `users` 테이블

집계는 매시 정각에 자동 실행됩니다.

## 빌드

```bash
# 전체 빌드
yarn build

# API만 빌드
yarn workspace @claude-code-monitor/api build

# Web만 빌드
yarn workspace @claude-code-monitor/web build
```

## 라이선스

MIT

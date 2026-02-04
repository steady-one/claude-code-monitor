# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Claude Code Monitor는 Claude Code의 OpenTelemetry 메트릭을 수집, 저장, 시각화하는 모니터링 시스템입니다. OTLP(OpenTelemetry Protocol) HTTP/JSON 엔드포인트를 제공하여 Claude Code에서 내보내는 메트릭(비용, 토큰, 세션 등)을 수신합니다.

## 개발 명령어

```bash
# 의존성 설치
yarn install

# 전체 개발 서버 실행 (API + Web 동시)
yarn dev

# 개별 앱 실행
yarn dev:api          # API 서버 (NestJS, 포트 4317)
yarn dev:web          # Web 클라이언트 (Next.js, 포트 3000)

# 빌드
yarn build            # 전체 빌드
yarn workspace @claude-code-monitor/shared build  # shared 패키지만 빌드

# 테스트
yarn test             # 전체 테스트
yarn workspace @claude-code-monitor/api test      # API 테스트만
yarn workspace @claude-code-monitor/api test:watch  # 테스트 watch 모드
yarn workspace @claude-code-monitor/api test:cov    # 커버리지 포함

# 린트
yarn lint
```

## 아키텍처

### 모노레포 구조 (Yarn Workspaces)
```
apps/
  api/     - NestJS 백엔드 (OTLP 수신, SQLite 저장, REST API)
  web/     - Next.js 프론트엔드 (대시보드, 차트, 사용자 관리)
packages/
  shared/  - 공유 타입 정의 (메트릭, OTLP, DTO)
```

### 데이터 흐름
1. Claude Code -> OTLP 메트릭 (`POST /v1/metrics`) -> API 서버
2. API 서버 -> SQLite (raw_metrics) 저장
3. AggregationService -> 시간별 집계 (hourly_aggregates)
4. Web 클라이언트 -> REST API (`/api/metrics/*`) -> 대시보드 시각화

### 주요 모듈 (API)
- **OtlpModule**: OTLP 메트릭 수신 및 파싱 (`/v1/metrics`)
- **MetricsModule**: 집계된 메트릭 조회 API (`/api/metrics/*`)
- **AggregationModule**: 스케줄러 기반 시간별 집계 (Cron)
- **UsersModule**: 사용자별 통계 및 상세 정보
- **LogsModule**: 요청 로그 관리
- **DatabaseModule**: SQLite (better-sqlite3) 데이터 접근

### 데이터베이스 테이블
- `raw_metrics`: 원시 메트릭 데이터
- `hourly_aggregates`: 시간별 집계 데이터 (UPSERT 패턴)
- `users`: 사용자 캐시
- `request_logs`: API 요청 로그

### 환경 변수
API 서버 (`apps/api/.env`):
- `DATABASE_PATH`: SQLite 파일 경로 (기본: `./data/metrics.db`)
- `AUTH_TOKEN`: Bearer 토큰 인증
- `PORT`: 서버 포트 (기본: 4317, OTLP 표준)

Web 클라이언트 (`apps/web/.env.local`):
- `NEXT_PUBLIC_API_URL`: API 서버 URL

## 기술 스택

- **Node.js 22+** (필수)
- **Yarn 4** (패키지 매니저)
- **API**: NestJS 11, better-sqlite3, class-validator
- **Web**: Next.js 15 (Turbopack), React 19, TanStack Query, Recharts, Tailwind CSS 4
- **공유**: TypeScript 5.7

## 코드 컨벤션

- 타입은 `@claude-code-monitor/shared`에서 import
- SQLite 쿼리는 `DatabaseService`에 집중
- API 응답 타입은 `packages/shared/src/types/`에 정의
- Web 컴포넌트는 `src/components/` 아래 기능별 디렉토리 구조

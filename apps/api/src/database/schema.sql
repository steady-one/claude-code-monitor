-- Claude Code Monitor SQLite Schema

-- 원시 메트릭 테이블
CREATE TABLE IF NOT EXISTS raw_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    timestamp INTEGER NOT NULL,
    session_id TEXT,
    user_account_uuid TEXT,
    organization_id TEXT,
    attributes TEXT,
    created_at INTEGER DEFAULT (strftime('%s','now')*1000)
);

-- 시간별 집계 테이블
CREATE TABLE IF NOT EXISTS hourly_aggregates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name TEXT NOT NULL,
    hour_timestamp INTEGER NOT NULL,
    user_account_uuid TEXT,
    sum_value REAL DEFAULT 0,
    count_value INTEGER DEFAULT 0,
    attributes_hash TEXT,
    attributes TEXT,
    UNIQUE(metric_name, hour_timestamp, user_account_uuid, attributes_hash)
);

-- 사용자 캐시 테이블
CREATE TABLE IF NOT EXISTS users (
    account_uuid TEXT PRIMARY KEY,
    organization_id TEXT,
    first_seen INTEGER NOT NULL,
    last_seen INTEGER NOT NULL,
    total_cost REAL DEFAULT 0,
    total_tokens INTEGER DEFAULT 0
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_raw_timestamp ON raw_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_raw_name_time ON raw_metrics(metric_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_raw_user ON raw_metrics(user_account_uuid, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_hourly_name_time ON hourly_aggregates(metric_name, hour_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_hourly_user ON hourly_aggregates(user_account_uuid, hour_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen DESC);

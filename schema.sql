-- ============================================================================
-- PostgreSQL Database Initialization Schema for Zakonoproekti Portal
-- ============================================================================

-- 1. Table for all bills (Законопроекты)
CREATE TABLE IF NOT EXISTS bills (
    id VARCHAR(64) PRIMARY KEY,
    title TEXT NOT NULL,
    target_law TEXT,
    author TEXT NOT NULL,
    author_role VARCHAR(128),
    author_discord_id VARCHAR(64),
    status VARCHAR(64) NOT NULL DEFAULT 'draft',
    status_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_author ON bills(author);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bills_updated_at ON bills(updated_at DESC);

-- 2. Table for state laws (Действующие законы и кодексы)
CREATE TABLE IF NOT EXISTS state_laws (
    id VARCHAR(128) PRIMARY KEY,
    title TEXT NOT NULL,
    category VARCHAR(128),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_state_laws_category ON state_laws(category);
CREATE INDEX IF NOT EXISTS idx_state_laws_updated_at ON state_laws(updated_at DESC);

-- 3. Table for system settings & credentials
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(128) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

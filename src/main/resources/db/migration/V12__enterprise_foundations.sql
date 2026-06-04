-- Enterprise Sprint 1: Assertions Engine, Variables System, Environment Management

-- 1. Assertions Engine: extend test_steps
ALTER TABLE test_steps ADD COLUMN IF NOT EXISTS step_type VARCHAR(20) DEFAULT 'ACTION';
ALTER TABLE test_steps ADD COLUMN IF NOT EXISTS expected_value TEXT;

-- 2. Assertions Engine: extend step_results with actual value captured at runtime
ALTER TABLE step_results ADD COLUMN IF NOT EXISTS actual_value TEXT;
ALTER TABLE step_results ADD COLUMN IF NOT EXISTS step_type VARCHAR(20) DEFAULT 'ACTION';

-- 3. Environments
CREATE TABLE IF NOT EXISTS environments (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Variables (Global + Suite + Environment scoped)
CREATE TABLE IF NOT EXISTS variables (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT,
    scope VARCHAR(20) NOT NULL DEFAULT 'GLOBAL',  -- GLOBAL, SUITE, ENVIRONMENT
    scope_id BIGINT,                               -- suite_id or environment_id if scoped
    key_name VARCHAR(100) NOT NULL,
    value TEXT,
    is_secret BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

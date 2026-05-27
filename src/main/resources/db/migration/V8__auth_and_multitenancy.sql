-- V8: Authentication & Multi-tenancy
-- Adds organisations, users, agent_tokens tables
-- Adds org_id column to all existing data tables

-- ─── Core auth tables ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organisations (
    id         BIGSERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    plan       TEXT NOT NULL DEFAULT 'trial',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_users (
    id            BIGSERIAL PRIMARY KEY,
    org_id        BIGINT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name     TEXT,
    role          TEXT NOT NULL DEFAULT 'admin',
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_tokens (
    id         BIGSERIAL PRIMARY KEY,
    org_id     BIGINT NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
    token      TEXT UNIQUE NOT NULL,
    label      TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Add org_id to all existing tables ───────────────────────────────────────

ALTER TABLE schedulers   ADD COLUMN IF NOT EXISTS org_id BIGINT REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE executions   ADD COLUMN IF NOT EXISTS org_id BIGINT REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE agents       ADD COLUMN IF NOT EXISTS org_id BIGINT REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE groups       ADD COLUMN IF NOT EXISTS org_id BIGINT REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE test_cases   ADD COLUMN IF NOT EXISTS org_id BIGINT REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE test_suites  ADD COLUMN IF NOT EXISTS org_id BIGINT REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE test_case_groups      ADD COLUMN IF NOT EXISTS org_id BIGINT REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE step_results ADD COLUMN IF NOT EXISTS org_id BIGINT REFERENCES organisations(id) ON DELETE CASCADE;
ALTER TABLE screenshots   ADD COLUMN IF NOT EXISTS org_id BIGINT REFERENCES organisations(id) ON DELETE CASCADE;

-- ─── Seed a default "dev" organisation so existing data still works ──────────
INSERT INTO organisations (id, name, plan) VALUES (1, 'Default Org', 'enterprise')
ON CONFLICT (id) DO NOTHING;

-- Assign all existing rows to org 1 (backward-compat for existing dev data)
UPDATE schedulers   SET org_id = 1 WHERE org_id IS NULL;
UPDATE executions   SET org_id = 1 WHERE org_id IS NULL;
UPDATE agents       SET org_id = 1 WHERE org_id IS NULL;
UPDATE groups       SET org_id = 1 WHERE org_id IS NULL;
UPDATE test_cases   SET org_id = 1 WHERE org_id IS NULL;
UPDATE test_suites  SET org_id = 1 WHERE org_id IS NULL;
UPDATE test_case_groups    SET org_id = 1 WHERE org_id IS NULL;
UPDATE step_results SET org_id = 1 WHERE org_id IS NULL;
UPDATE screenshots   SET org_id = 1 WHERE org_id IS NULL;

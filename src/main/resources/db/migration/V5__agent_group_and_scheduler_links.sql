-- Agent-Group mapping
CREATE TABLE IF NOT EXISTS agent_group_mappings (
    id       BIGSERIAL PRIMARY KEY,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    UNIQUE (agent_id, group_id)
);

-- Link schedulers to test suites
ALTER TABLE schedulers ADD COLUMN IF NOT EXISTS test_suite_id BIGINT REFERENCES test_suites(id) ON DELETE SET NULL;

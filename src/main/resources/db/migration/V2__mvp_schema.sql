-- Registered local machines
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  os TEXT,
  agent_version TEXT,
  last_seen_at TIMESTAMP NOT NULL,
  capabilities_json TEXT
);

-- Run requests
CREATE TABLE IF NOT EXISTS executions (
  id BIGSERIAL PRIMARY KEY,
  status TEXT NOT NULL, -- QUEUED, RUNNING, SUCCESS, FAILED
  created_at TIMESTAMP NOT NULL,
  finished_at TIMESTAMP,
  environment_json TEXT
);

-- DB Queue Work Unit
CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  execution_id BIGINT REFERENCES executions(id) ON DELETE CASCADE,
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  status TEXT NOT NULL, -- QUEUED, ASSIGNED, COMPLETED, TIMEOUT
  lease_expires_at TIMESTAMP,
  payload_json TEXT NOT NULL
);

-- Per-step execution outcome
CREATE TABLE IF NOT EXISTS step_results (
  id BIGSERIAL PRIMARY KEY,
  execution_id BIGINT REFERENCES executions(id) ON DELETE CASCADE,
  step_index INT NOT NULL,
  action_name TEXT NOT NULL,
  executed_status INT NOT NULL,
  result_status INT NOT NULL,
  error_json TEXT
);

-- Screenshot artifact metadata
CREATE TABLE IF NOT EXISTS screenshots (
  id BIGSERIAL PRIMARY KEY,
  execution_id BIGINT REFERENCES executions(id) ON DELETE CASCADE,
  step_result_id BIGINT REFERENCES step_results(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  storage_path TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jobs_agent_status ON jobs (agent_id, status);

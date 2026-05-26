-- Initial schema for localagent-cloud on PostgreSQL.
-- This mirrors the JPA entity com.autopropel.localagent_cloud.persistence.JobRecord.

CREATE TABLE IF NOT EXISTS cloud_jobs (
  id BIGSERIAL PRIMARY KEY,
  agent_id TEXT,
  reference_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cloud_jobs_agent_status_created
  ON cloud_jobs (agent_id, status, created_at);


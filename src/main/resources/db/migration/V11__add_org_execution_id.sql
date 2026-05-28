ALTER TABLE executions ADD COLUMN org_execution_id BIGINT;
UPDATE executions SET org_execution_id = id WHERE org_execution_id IS NULL;

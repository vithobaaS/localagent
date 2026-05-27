-- Outlook-style scheduler fields
-- Allows users to set date/time/recurrence without writing raw cron expressions
ALTER TABLE schedulers ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE schedulers ADD COLUMN IF NOT EXISTS scheduled_time TIME;
ALTER TABLE schedulers ADD COLUMN IF NOT EXISTS recurrence_type VARCHAR(20);
-- 'once', 'daily', 'weekly', 'monthly'
ALTER TABLE schedulers ADD COLUMN IF NOT EXISTS recurrence_days VARCHAR(50);
-- comma-separated day abbreviations for weekly: e.g. 'MON,WED,FRI'
ALTER TABLE schedulers ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;

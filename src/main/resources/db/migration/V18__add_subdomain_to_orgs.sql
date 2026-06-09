ALTER TABLE organisations ADD COLUMN subdomain VARCHAR(255);
-- For existing data, set subdomain to a sanitized version of the name or a random UUID to avoid null constraints before making it unique
UPDATE organisations SET subdomain = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || id WHERE subdomain IS NULL;
ALTER TABLE organisations ADD CONSTRAINT uq_org_subdomain UNIQUE (subdomain);

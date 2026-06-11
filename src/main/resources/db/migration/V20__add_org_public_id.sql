ALTER TABLE organisations ADD COLUMN public_id VARCHAR(20);
UPDATE organisations SET public_id = UPPER(SUBSTRING(name, 1, 3)) || '-' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0') WHERE public_id IS NULL;
ALTER TABLE organisations ALTER COLUMN public_id SET NOT NULL;
CREATE UNIQUE INDEX idx_organisations_public_id ON organisations(public_id);

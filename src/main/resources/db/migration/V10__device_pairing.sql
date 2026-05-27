CREATE TABLE device_pairings (
    id BIGSERIAL PRIMARY KEY,
    pairing_code VARCHAR(10) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    agent_token VARCHAR(255),
    org_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL
);

-- Index for quick lookup by pairing code
CREATE INDEX idx_device_pairings_code ON device_pairings(pairing_code);

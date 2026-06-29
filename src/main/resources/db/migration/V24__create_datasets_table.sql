CREATE TABLE datasets (
    id BIGSERIAL PRIMARY KEY,
    org_id BIGINT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    headers TEXT,
    rows TEXT,
    row_count INTEGER,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE
);

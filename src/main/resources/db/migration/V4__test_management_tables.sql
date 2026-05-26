-- Level 1: Test Cases (a named test scenario containing ordered steps)
CREATE TABLE IF NOT EXISTS test_cases (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Level 1a: Test Steps (individual actions within a test case)
CREATE TABLE IF NOT EXISTS test_steps (
    id             BIGSERIAL PRIMARY KEY,
    test_case_id   BIGINT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    step_order     INT NOT NULL,
    action_name    TEXT NOT NULL,
    locator_type   TEXT,
    locator_value  TEXT,
    test_data      TEXT,
    description    TEXT,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_test_steps_case ON test_steps (test_case_id, step_order);

-- Level 2: Test Case Groups (logical grouping of test cases)
CREATE TABLE IF NOT EXISTS test_case_groups (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Level 2a: Mapping test cases to groups (many-to-many with ordering)
CREATE TABLE IF NOT EXISTS test_case_group_mappings (
    id                  BIGSERIAL PRIMARY KEY,
    test_case_group_id  BIGINT NOT NULL REFERENCES test_case_groups(id) ON DELETE CASCADE,
    test_case_id        BIGINT NOT NULL REFERENCES test_cases(id) ON DELETE CASCADE,
    case_order          INT NOT NULL DEFAULT 0,
    UNIQUE (test_case_group_id, test_case_id)
);

-- Level 3: Test Suites (top-level collection of groups)
CREATE TABLE IF NOT EXISTS test_suites (
    id           BIGSERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    description  TEXT,
    browser_type TEXT NOT NULL DEFAULT 'chrome',
    status       TEXT NOT NULL DEFAULT 'active',
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Level 3a: Mapping groups to suites (many-to-many with ordering)
CREATE TABLE IF NOT EXISTS test_suite_group_mappings (
    id                  BIGSERIAL PRIMARY KEY,
    test_suite_id       BIGINT NOT NULL REFERENCES test_suites(id) ON DELETE CASCADE,
    test_case_group_id  BIGINT NOT NULL REFERENCES test_case_groups(id) ON DELETE CASCADE,
    group_order         INT NOT NULL DEFAULT 0,
    UNIQUE (test_suite_id, test_case_group_id)
);

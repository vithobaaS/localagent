-- V9: Fix organisation sequence
-- Because V8 manually inserted id=1, the sequence remained at 1.
-- When Hibernate tries to insert a new row, it uses nextval which returns 1, causing a PK violation.
-- This advances the sequence to the maximum id.

SELECT setval('organisations_id_seq', COALESCE((SELECT MAX(id)+1 FROM organisations), 1), false);

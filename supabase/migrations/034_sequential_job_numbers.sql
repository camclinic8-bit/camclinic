-- Migration: 034_sequential_job_numbers.sql
-- Purpose: Replace date-based job numbers (CC-YYYYMMDD-NNNN) with a global
-- sequential counter: CC-00001, CC-00002, ... CC-99999. After the 5-digit
-- space is exhausted the counter naturally widens to 6 digits (CC-100000).
-- Existing jobs are renumbered from CC-00001 in creation order.

-- 1. Build the old -> new mapping (temp table survives across statements).
CREATE TEMP TABLE job_renumber_map AS
SELECT
  id,
  job_number AS old_number,
  'CC-' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC))::TEXT, 5, '0') AS new_number
FROM jobs;

-- 2. Move every job to a temporary value first so the UNIQUE constraint on
--    jobs.job_number can never observe a duplicate mid-migration
--    (new values CC-00001..N could transiently collide with existing rows).
UPDATE jobs j
SET job_number = 'CC-TMP-' || m.new_number
FROM job_renumber_map m
WHERE j.id = m.id;

-- 3. Remap product cross-references (repeat/other job numbers) to the new scheme.
UPDATE job_products jp
SET repeat_job_number = m.new_number
FROM job_renumber_map m
WHERE jp.repeat_job_number IS NOT NULL
  AND jp.repeat_job_number = m.old_number;

UPDATE job_products jp
SET other_job_number = m.new_number
FROM job_renumber_map m
WHERE jp.other_job_number IS NOT NULL
  AND jp.other_job_number = m.old_number;

-- 4. Assign the final sequential numbers.
UPDATE jobs j
SET job_number = m.new_number
FROM job_renumber_map m
WHERE j.id = m.id;

DROP TABLE job_renumber_map;

-- 5. Regenerate job numbers as a global sequential counter.
--    The p_date parameter is kept for signature compatibility with existing
--    callers (create_job_with_products) but is no longer used.
CREATE OR REPLACE FUNCTION get_next_job_number(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT AS $$
DECLARE
  next_seq INT;
BEGIN
  -- Held until the surrounding transaction completes; serializes all number
  -- generation so concurrent job creators cannot observe the same MAX.
  PERFORM pg_advisory_xact_lock(hashtext('cam-clinic-job-number'));

  SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM 4) AS INT)), 0) + 1
  INTO next_seq
  FROM jobs
  WHERE job_number ~ '^CC-[0-9]+$';

  -- LPAD keeps 5 digits (00001..99999); beyond that the number simply widens
  -- to 6 digits (100000) and keeps counting.
  RETURN 'CC-' || LPAD(next_seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

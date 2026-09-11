-- Migration: 036_continue_legacy_job_number_series.sql
-- Purpose: The shop's legacy (pre-app) records ran on a serial series whose
-- last used number was 05200. Migration 034 restarted app numbering at
-- CC-00001, so newly created jobs did not continue the shop's series — the
-- client expected the next number to follow 05200. Anchor a dedicated
-- Postgres sequence at 5200 so the next job created is CC-05201, then
-- CC-05202, CC-05203, ... Existing CC-00001..CC-00134 jobs keep their
-- numbers because receipts already reference them.

-- 1. Dedicated counter for job numbers (replaces MAX(jobs.job_number) + 1,
--    which could never skip ahead to the legacy series on its own).
CREATE SEQUENCE IF NOT EXISTS job_number_seq;

-- 2. Anchor the counter at the legacy last-used number (5200), but never
--    below the current table max so re-running this migration can never
--    rewind below an already-issued number.
SELECT setval(
  'job_number_seq',
  GREATEST(
    5200,
    (
      SELECT COALESCE(MAX(CAST(SUBSTRING(job_number FROM 4) AS INT)), 0)
      FROM jobs
      WHERE job_number ~ '^CC-[0-9]+$'
    )
  )
);

-- 3. Draw numbers from the sequence. nextval() is atomic, so the advisory
--    lock from migration 034 is no longer needed. The p_date parameter is
--    kept (unused) for signature compatibility with existing callers.
CREATE OR REPLACE FUNCTION get_next_job_number(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT AS $$
BEGIN
  -- LPAD keeps 5 digits (00001..99999); beyond that the number simply
  -- widens to 6 digits (100000) and keeps counting.
  RETURN 'CC-' || LPAD(nextval('job_number_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- 4. Allow direct RPC callers (PostgREST runs as `authenticated`) to draw
--    from the sequence. Callers inside the SECURITY DEFINER job RPCs run as
--    the owner and already have access.
GRANT USAGE ON SEQUENCE job_number_seq TO authenticated;

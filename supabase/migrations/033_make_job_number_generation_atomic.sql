-- Prevent concurrent job creation requests from generating the same job number.
-- The jobs.job_number unique constraint is global, so serialize generation by date.
CREATE OR REPLACE FUNCTION get_next_job_number(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT AS $$
DECLARE
  date_str TEXT;
  next_seq INT;
BEGIN
  date_str := TO_CHAR(p_date, 'YYYYMMDD');

  -- Held until the surrounding transaction completes. Calls for other dates do
  -- not block one another, while same-date callers cannot observe the same MAX.
  PERFORM pg_advisory_xact_lock(hashtext('cam-clinic-job-number:' || date_str));

  SELECT COALESCE(
    MAX(CAST(SUBSTRING(job_number FROM 13 FOR 4) AS INT)),
    0
  ) + 1
  INTO next_seq
  FROM jobs
  WHERE job_number LIKE 'CC-' || date_str || '-%';

  IF next_seq > 9999 THEN
    RAISE EXCEPTION 'Daily job number limit reached for %', p_date;
  END IF;

  RETURN 'CC-' || date_str || '-' || LPAD(next_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

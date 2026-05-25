-- Migration: Fix service_date logic in update_job_status_with_history
-- This migration fixes the service_date to clear when status changes away from completed
-- Previously, service_date would persist even if status was changed back from completed

CREATE OR REPLACE FUNCTION update_job_status_with_history(
  p_job_id UUID,
  p_status job_status,
  p_user_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_status job_status;
  v_result JSONB;
BEGIN
  -- Get current status
  SELECT status INTO v_current_status
  FROM jobs
  WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;
  
  -- Update status (set service_date only when completed, clear otherwise)
  UPDATE jobs SET
    status = p_status,
    service_date = CASE WHEN p_status = 'completed' THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE id = p_job_id;
  
  -- Log status change
  INSERT INTO job_status_history (
    job_id,
    from_status,
    to_status,
    changed_by,
    notes
  ) VALUES (
    p_job_id,
    v_current_status,
    p_status,
    p_user_id,
    p_notes
  );
  
  -- Build result
  v_result := jsonb_build_object('id', p_job_id);
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction automatically rolls back on error
    RAISE EXCEPTION 'Failed to update job status: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

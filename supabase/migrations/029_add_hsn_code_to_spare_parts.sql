-- Add HSN code (optional) to spare_parts table (customer-facing) and
-- update RPC functions that insert/update spare parts.
-- Migration: 029_add_hsn_code_to_spare_parts.sql

-- 1. Add hsn_code column to spare_parts table
ALTER TABLE spare_parts
  ADD COLUMN IF NOT EXISTS hsn_code TEXT DEFAULT NULL;

-- 2. Drop the old 4-param versions so we can recreate with the new signature.
--    Specifying argument list exactly to avoid the "not unique" ambiguity error.
DROP FUNCTION IF EXISTS add_spare_part_with_job_update(UUID, TEXT, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS update_spare_part_with_job_update(UUID, TEXT, NUMERIC, NUMERIC);

-- 3. Create add_spare_part_with_job_update with optional hsn_code
CREATE OR REPLACE FUNCTION add_spare_part_with_job_update(
  p_job_id       UUID,
  p_name         TEXT,
  p_quantity     NUMERIC(10,2),
  p_unit_price   NUMERIC(10,2),
  p_hsn_code     TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_spare_part_id UUID;
  v_result JSONB;
BEGIN
  INSERT INTO spare_parts (
    job_id,
    name,
    quantity,
    unit_price,
    hsn_code
  ) VALUES (
    p_job_id,
    p_name,
    p_quantity,
    p_unit_price,
    p_hsn_code
  ) RETURNING id INTO v_spare_part_id;

  -- Touch the job so any triggers recalculate totals
  UPDATE jobs
  SET updated_at = NOW()
  WHERE id = p_job_id;

  v_result := jsonb_build_object('id', v_spare_part_id);
  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to add spare part: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_spare_part_with_job_update TO authenticated;

-- 4. Create update_spare_part_with_job_update with optional hsn_code
CREATE OR REPLACE FUNCTION update_spare_part_with_job_update(
  p_spare_part_id UUID,
  p_name          TEXT    DEFAULT NULL,
  p_quantity      NUMERIC(10,2) DEFAULT NULL,
  p_unit_price    NUMERIC(10,2) DEFAULT NULL,
  p_hsn_code      TEXT    DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_job_id UUID;
  v_result JSONB;
BEGIN
  SELECT job_id INTO v_job_id
  FROM spare_parts
  WHERE id = p_spare_part_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Spare part not found: %', p_spare_part_id;
  END IF;

  UPDATE spare_parts SET
    name       = COALESCE(p_name, name),
    quantity   = COALESCE(p_quantity, quantity),
    unit_price = COALESCE(p_unit_price, unit_price),
    hsn_code   = p_hsn_code,
    updated_at = NOW()
  WHERE id = p_spare_part_id;

  UPDATE jobs
  SET updated_at = NOW()
  WHERE id = v_job_id;

  v_result := jsonb_build_object('id', p_spare_part_id);
  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update spare part: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_spare_part_with_job_update TO authenticated;

-- Transaction-Safe RPC Functions for Products and Billing
-- Migration: 013_transaction_safe_product_billing_rpc.sql
-- Purpose: Wrap product and billing operations in PostgreSQL transactions

-- ============================================================================
-- FUNCTION: sync_job_products
-- Syncs all products for a job in a single transaction (used in edit page)
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_job_products(
  p_job_id UUID,
  p_products JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_product_id UUID;
  v_product JSONB;
  v_accessory TEXT;
  v_other_part TEXT;
  v_existing_product_ids UUID[];
  v_incoming_product_ids UUID[];
  v_result JSONB;
BEGIN
  -- Get existing product IDs
  SELECT ARRAY_AGG(id) INTO v_existing_product_ids
  FROM job_products
  WHERE job_id = p_job_id;
  
  -- Get incoming product IDs
  SELECT ARRAY_AGG((elem->>'id')::UUID) INTO v_incoming_product_ids
  FROM jsonb_array_elements(p_products) elem
  WHERE (elem->>'id') IS NOT NULL AND (elem->>'id') != '';
  
  -- Delete products not in incoming list
  IF v_existing_product_ids IS NOT NULL THEN
    DELETE FROM job_products
    WHERE job_id = p_job_id
    AND id NOT IN (SELECT UNNEST(COALESCE(v_incoming_product_ids, ARRAY[]::UUID[])));
  END IF;
  
  -- Upsert products
  FOR v_product IN SELECT * FROM jsonb_array_elements(p_products) LOOP
    IF (v_product->>'id') IS NOT NULL AND (v_product->>'id') != '' THEN
      -- Update existing product
      UPDATE job_products SET
        brand = v_product->>'brand',
        model = v_product->>'model',
        serial_number = v_product->>'serial_number',
        condition = (v_product->>'condition')::product_condition,
        description = v_product->>'description',
        remarks = v_product->>'remarks',
        has_warranty = (v_product->>'has_warranty')::BOOLEAN,
        warranty_description = v_product->>'warranty_description',
        warranty_expiry_date = CASE WHEN (v_product->>'warranty_expiry_date') IS NOT NULL AND (v_product->>'warranty_expiry_date') != '' 
                                  THEN (v_product->>'warranty_expiry_date')::DATE 
                                  ELSE NULL 
                             END,
        repeat_job_number = v_product->>'repeat_job_number',
        other_job_number = v_product->>'other_job_number',
        updated_at = NOW()
      WHERE id = (v_product->>'id')::UUID AND job_id = p_job_id;
      
      -- Clear and re-insert accessories
      DELETE FROM product_accessories WHERE job_product_id = (v_product->>'id')::UUID;
      FOR v_accessory IN SELECT jsonb_array_elements_text(v_product->'accessories') LOOP
        INSERT INTO product_accessories (job_product_id, name)
        VALUES ((v_product->>'id')::UUID, v_accessory);
      END LOOP;
      
      -- Clear and re-insert other parts
      DELETE FROM product_other_parts WHERE job_product_id = (v_product->>'id')::UUID;
      FOR v_other_part IN SELECT jsonb_array_elements_text(v_product->'other_parts') LOOP
        INSERT INTO product_other_parts (job_product_id, name)
        VALUES ((v_product->>'id')::UUID, v_other_part);
      END LOOP;
    ELSE
      -- Insert new product
      INSERT INTO job_products (
        job_id,
        brand,
        model,
        serial_number,
        condition,
        description,
        remarks,
        has_warranty,
        warranty_description,
        warranty_expiry_date,
        repeat_job_number,
        other_job_number
      ) VALUES (
        p_job_id,
        v_product->>'brand',
        v_product->>'model',
        v_product->>'serial_number',
        (v_product->>'condition')::product_condition,
        v_product->>'description',
        v_product->>'remarks',
        (v_product->>'has_warranty')::BOOLEAN,
        v_product->>'warranty_description',
        CASE WHEN (v_product->>'warranty_expiry_date') IS NOT NULL AND (v_product->>'warranty_expiry_date') != '' 
             THEN (v_product->>'warranty_expiry_date')::DATE 
             ELSE NULL 
        END,
        v_product->>'repeat_job_number',
        v_product->>'other_job_number'
      ) RETURNING id INTO v_product_id;
      
      -- Insert accessories
      FOR v_accessory IN SELECT jsonb_array_elements_text(v_product->'accessories') LOOP
        INSERT INTO product_accessories (job_product_id, name)
        VALUES (v_product_id, v_accessory);
      END LOOP;
      
      -- Insert other parts
      FOR v_other_part IN SELECT jsonb_array_elements_text(v_product->'other_parts') LOOP
        INSERT INTO product_other_parts (job_product_id, name)
        VALUES (v_product_id, v_other_part);
      END LOOP;
    END IF;
  END LOOP;
  
  -- Build result
  v_result := jsonb_build_object('job_id', p_job_id);
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction automatically rolls back on error
    RAISE EXCEPTION 'Failed to sync job products: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION sync_job_products TO authenticated;

-- ============================================================================
-- FUNCTION: add_spare_part_with_job_update
-- Adds a spare part and updates job totals in a single transaction
-- ============================================================================
CREATE OR REPLACE FUNCTION add_spare_part_with_job_update(
  p_job_id UUID,
  p_name TEXT,
  p_quantity NUMERIC(10,2),
  p_unit_price NUMERIC(10,2)
)
RETURNS JSONB AS $$
DECLARE
  v_spare_part_id UUID;
  v_result JSONB;
BEGIN
  -- Insert spare part
  INSERT INTO spare_parts (
    job_id,
    name,
    quantity,
    unit_price
  ) VALUES (
    p_job_id,
    p_name,
    p_quantity,
    p_unit_price
  ) RETURNING id INTO v_spare_part_id;
  
  -- Update job to trigger recalculation (trigger handles totals)
  UPDATE jobs
  SET updated_at = NOW()
  WHERE id = p_job_id;
  
  -- Build result
  v_result := jsonb_build_object('id', v_spare_part_id);
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction automatically rolls back on error
    RAISE EXCEPTION 'Failed to add spare part: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION add_spare_part_with_job_update TO authenticated;

-- ============================================================================
-- FUNCTION: update_spare_part_with_job_update
-- Updates a spare part and updates job totals in a single transaction
-- ============================================================================
CREATE OR REPLACE FUNCTION update_spare_part_with_job_update(
  p_spare_part_id UUID,
  p_name TEXT DEFAULT NULL,
  p_quantity NUMERIC(10,2) DEFAULT NULL,
  p_unit_price NUMERIC(10,2) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_job_id UUID;
  v_result JSONB;
BEGIN
  -- Get job_id
  SELECT job_id INTO v_job_id
  FROM spare_parts
  WHERE id = p_spare_part_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Spare part not found: %', p_spare_part_id;
  END IF;
  
  -- Update spare part
  UPDATE spare_parts SET
    name = COALESCE(p_name, name),
    quantity = COALESCE(p_quantity, quantity),
    unit_price = COALESCE(p_unit_price, unit_price),
    updated_at = NOW()
  WHERE id = p_spare_part_id;
  
  -- Update job to trigger recalculation
  UPDATE jobs
  SET updated_at = NOW()
  WHERE id = v_job_id;
  
  -- Build result
  v_result := jsonb_build_object('id', p_spare_part_id);
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction automatically rolls back on error
    RAISE EXCEPTION 'Failed to update spare part: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION update_spare_part_with_job_update TO authenticated;

-- ============================================================================
-- FUNCTION: delete_spare_part_with_job_update
-- Deletes a spare part and updates job totals in a single transaction
-- ============================================================================
CREATE OR REPLACE FUNCTION delete_spare_part_with_job_update(
  p_spare_part_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_job_id UUID;
  v_result JSONB;
BEGIN
  -- Get job_id before deletion
  SELECT job_id INTO v_job_id
  FROM spare_parts
  WHERE id = p_spare_part_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Spare part not found: %', p_spare_part_id;
  END IF;
  
  -- Delete spare part
  DELETE FROM spare_parts
  WHERE id = p_spare_part_id;
  
  -- Update job to trigger recalculation
  UPDATE jobs
  SET updated_at = NOW()
  WHERE id = v_job_id;
  
  -- Build result
  v_result := jsonb_build_object('id', p_spare_part_id);
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction automatically rolls back on error
    RAISE EXCEPTION 'Failed to delete spare part: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION delete_spare_part_with_job_update TO authenticated;

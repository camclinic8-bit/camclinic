-- Migration: Update RPC Functions for Spare Parts Total Cost
-- This migration updates the RPC functions to handle spare_parts_total_cost

-- ============================================================================
-- FUNCTION: create_job_with_products
-- Add p_spare_parts_total_cost parameter
-- ============================================================================
CREATE OR REPLACE FUNCTION create_job_with_products(
  p_shop_id UUID,
  p_customer_id UUID,
  p_service_branch_id UUID,
  p_delivery_branch_id UUID,
  p_created_by UUID,
  p_assigned_incharge_id UUID DEFAULT NULL,
  p_assigned_technician_id UUID DEFAULT NULL,
  p_priority job_priority DEFAULT 'medium',
  p_description TEXT DEFAULT NULL,
  p_inspection_fee NUMERIC(10,2) DEFAULT 0,
  p_advance_paid NUMERIC(10,2) DEFAULT 0,
  p_advance_paid_date DATE DEFAULT NULL,
  p_estimate_delivery_date DATE DEFAULT NULL,
  p_spare_parts_total_cost NUMERIC(10,2) DEFAULT 0,
  p_products JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB AS $$
DECLARE
  v_job_number TEXT;
  v_job_id UUID;
  v_product_id UUID;
  v_product JSONB;
  v_accessory TEXT;
  v_other_part TEXT;
  v_result JSONB;
BEGIN
  -- Get next job number
  v_job_number := get_next_job_number();
  
  -- Start transaction (implicit in function)
  
  -- Create the job
  INSERT INTO jobs (
    shop_id,
    job_number,
    customer_id,
    service_branch_id,
    delivery_branch_id,
    assigned_incharge_id,
    assigned_technician_id,
    priority,
    description,
    inspection_fee,
    advance_paid,
    advance_paid_date,
    estimate_delivery_date,
    spare_parts_total_cost,
    created_by,
    status
  ) VALUES (
    p_shop_id,
    v_job_number,
    p_customer_id,
    p_service_branch_id,
    p_delivery_branch_id,
    p_assigned_incharge_id,
    p_assigned_technician_id,
    p_priority,
    p_description,
    p_inspection_fee,
    p_advance_paid,
    p_advance_paid_date,
    p_estimate_delivery_date,
    p_spare_parts_total_cost,
    p_created_by,
    'new'
  ) RETURNING id INTO v_job_id;
  
  -- Create job products with accessories and other parts
  FOR v_product IN SELECT * FROM jsonb_array_elements(p_products) LOOP
    -- Insert product
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
      v_job_id,
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
  END LOOP;
  
  -- Create initial status history
  INSERT INTO job_status_history (
    job_id,
    from_status,
    to_status,
    changed_by,
    notes
  ) VALUES (
    v_job_id,
    NULL,
    'new',
    p_created_by,
    'Job created'
  );
  
  -- Build result
  v_result := jsonb_build_object(
    'id', v_job_id,
    'job_number', v_job_number
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction automatically rolls back on error
    RAISE EXCEPTION 'Failed to create job with products: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: update_job_with_products
-- Add p_spare_parts_total_cost parameter
-- ============================================================================
CREATE OR REPLACE FUNCTION update_job_with_products(
  p_job_id UUID,
  p_user_id UUID,
  p_status job_status DEFAULT NULL,
  p_priority job_priority DEFAULT NULL,
  p_service_branch_id UUID DEFAULT NULL,
  p_delivery_branch_id UUID DEFAULT NULL,
  p_assigned_incharge_id UUID DEFAULT NULL,
  p_assigned_technician_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_technician_notes TEXT DEFAULT NULL,
  p_cam_clinic_advisory_notes TEXT DEFAULT NULL,
  p_inspection_fee NUMERIC(10,2) DEFAULT NULL,
  p_service_charges NUMERIC(10,2) DEFAULT NULL,
  p_advance_paid NUMERIC(10,2) DEFAULT NULL,
  p_advance_paid_date DATE DEFAULT NULL,
  p_gst_enabled BOOLEAN DEFAULT NULL,
  p_estimate_delivery_date DATE DEFAULT NULL,
  p_spare_parts_total_cost NUMERIC(10,2) DEFAULT NULL,
  p_products JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_status job_status;
  v_product_id UUID;
  v_product JSONB;
  v_accessory TEXT;
  v_other_part TEXT;
  v_existing_product_ids UUID[];
  v_incoming_product_ids UUID[];
  v_result JSONB;
BEGIN
  -- Get current job status
  SELECT status INTO v_current_status
  FROM jobs
  WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;
  
  -- Update job fields
  UPDATE jobs SET
    status = COALESCE(p_status, status),
    priority = COALESCE(p_priority, priority),
    service_branch_id = COALESCE(p_service_branch_id, service_branch_id),
    delivery_branch_id = COALESCE(p_delivery_branch_id, delivery_branch_id),
    assigned_incharge_id = p_assigned_incharge_id,
    assigned_technician_id = p_assigned_technician_id,
    description = COALESCE(p_description, description),
    technician_notes = p_technician_notes,
    cam_clinic_advisory_notes = p_cam_clinic_advisory_notes,
    inspection_fee = COALESCE(p_inspection_fee, inspection_fee),
    service_charges = COALESCE(p_service_charges, service_charges),
    advance_paid = COALESCE(p_advance_paid, advance_paid),
    advance_paid_date = p_advance_paid_date,
    gst_enabled = COALESCE(p_gst_enabled, gst_enabled),
    estimate_delivery_date = p_estimate_delivery_date,
    spare_parts_total_cost = COALESCE(p_spare_parts_total_cost, spare_parts_total_cost),
    updated_at = NOW()
  WHERE id = p_job_id;
  
  -- Log status change if status was updated
  IF p_status IS NOT NULL AND p_status != v_current_status THEN
    INSERT INTO job_status_history (
      job_id,
      from_status,
      to_status,
      changed_by
    ) VALUES (
      p_job_id,
      v_current_status,
      p_status,
      p_user_id
    );
  END IF;
  
  -- Sync products if provided
  IF p_products IS NOT NULL THEN
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
          warranty_expiry_date
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
          END
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
  END IF;
  
  -- Build result
  v_result := jsonb_build_object('id', p_job_id);
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Transaction automatically rolls back on error
    RAISE EXCEPTION 'Failed to update job with products: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

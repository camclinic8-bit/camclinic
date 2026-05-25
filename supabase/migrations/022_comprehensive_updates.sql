-- Comprehensive Migration: All pending updates in one file
-- This includes:
-- 1. Add spare_parts_total_cost to jobs
-- 2. Update RPC functions for spare_parts and job number fields
-- 3. Fix service_date logic
-- 4. Add payment_transactions table
-- 5. Update GST calculation to full amount
-- 6. Add repeat_job_number and other_job_number to job_products

-- ============================================================================
-- 1. Add spare_parts_total_cost column to jobs table
-- ============================================================================
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS spare_parts_total_cost NUMERIC DEFAULT 0;

COMMENT ON COLUMN jobs.spare_parts_total_cost IS 'Total cost of spare parts for office use only. Not shown in customer bills.';

-- ============================================================================
-- 2. Add repeat_job_number and other_job_number to job_products table
-- ============================================================================
ALTER TABLE job_products
ADD COLUMN IF NOT EXISTS repeat_job_number TEXT,
ADD COLUMN IF NOT EXISTS other_job_number TEXT;

COMMENT ON COLUMN job_products.repeat_job_number IS 'Repeat job number for this product';
COMMENT ON COLUMN job_products.other_job_number IS 'Other related job number for this product';

-- ============================================================================
-- 3. Update RPC function: create_job_with_products
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
  v_job_number := get_next_job_number();
  
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
  
  FOR v_product IN SELECT * FROM jsonb_array_elements(p_products) LOOP
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
    
    FOR v_accessory IN SELECT jsonb_array_elements_text(v_product->'accessories') LOOP
      INSERT INTO product_accessories (job_product_id, name)
      VALUES (v_product_id, v_accessory);
    END LOOP;
    
    FOR v_other_part IN SELECT jsonb_array_elements_text(v_product->'other_parts') LOOP
      INSERT INTO product_other_parts (job_product_id, name)
      VALUES (v_product_id, v_other_part);
    END LOOP;
  END LOOP;
  
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
  
  v_result := jsonb_build_object('id', v_job_id, 'job_number', v_job_number);
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create job with products: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. Update RPC function: update_job_with_products
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
  SELECT status INTO v_current_status
  FROM jobs
  WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;
  
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
  
  IF p_products IS NOT NULL THEN
    SELECT ARRAY_AGG(id) INTO v_existing_product_ids
    FROM job_products
    WHERE job_id = p_job_id;
    
    SELECT ARRAY_AGG((elem->>'id')::UUID) INTO v_incoming_product_ids
    FROM jsonb_array_elements(p_products) elem
    WHERE (elem->>'id') IS NOT NULL AND (elem->>'id') != '';
    
    IF v_existing_product_ids IS NOT NULL THEN
      DELETE FROM job_products
      WHERE job_id = p_job_id
      AND id NOT IN (SELECT UNNEST(COALESCE(v_incoming_product_ids, ARRAY[]::UUID[])));
    END IF;
    
    FOR v_product IN SELECT * FROM jsonb_array_elements(p_products) LOOP
      IF (v_product->>'id') IS NOT NULL AND (v_product->>'id') != '' THEN
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
        
        DELETE FROM product_accessories WHERE job_product_id = (v_product->>'id')::UUID;
        FOR v_accessory IN SELECT jsonb_array_elements_text(v_product->'accessories') LOOP
          INSERT INTO product_accessories (job_product_id, name)
          VALUES ((v_product->>'id')::UUID, v_accessory);
        END LOOP;
        
        DELETE FROM product_other_parts WHERE job_product_id = (v_product->>'id')::UUID;
        FOR v_other_part IN SELECT jsonb_array_elements_text(v_product->'other_parts') LOOP
          INSERT INTO product_other_parts (job_product_id, name)
          VALUES ((v_product->>'id')::UUID, v_other_part);
        END LOOP;
      ELSE
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
        
        FOR v_accessory IN SELECT jsonb_array_elements_text(v_product->'accessories') LOOP
          INSERT INTO product_accessories (job_product_id, name)
          VALUES (v_product_id, v_accessory);
        END LOOP;
        
        FOR v_other_part IN SELECT jsonb_array_elements_text(v_product->'other_parts') LOOP
          INSERT INTO product_other_parts (job_product_id, name)
          VALUES (v_product_id, v_other_part);
        END LOOP;
      END IF;
    END LOOP;
  END IF;
  
  v_result := jsonb_build_object('id', p_job_id);
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update job with products: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. Update RPC function: update_job_status_with_history
-- ============================================================================
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
  SELECT status INTO v_current_status
  FROM jobs
  WHERE id = p_job_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;
  
  UPDATE jobs SET
    status = p_status,
    service_date = CASE WHEN p_status = 'completed' THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE id = p_job_id;
  
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
  
  v_result := jsonb_build_object('id', p_job_id);
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update job status: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Update GST calculation trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_job_totals()
RETURNS TRIGGER AS $$
DECLARE
  spare_parts_sum NUMERIC(10,2);
BEGIN
  SELECT COALESCE(SUM(total_price), 0) INTO spare_parts_sum
  FROM spare_parts WHERE job_id = NEW.id;
  
  NEW.total_charges = COALESCE(NEW.inspection_fee, 0) + COALESCE(NEW.service_charges, 0) + spare_parts_sum;
  
  IF NEW.gst_enabled THEN
    NEW.gst_amount = NEW.total_charges * 0.18;
  ELSE
    NEW.gst_amount = 0;
  END IF;
  
  NEW.grand_total = NEW.total_charges + NEW.gst_amount;
  NEW.balance_amount = NEW.grand_total - COALESCE(NEW.advance_paid, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. Add payment_transactions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_method VARCHAR(50) DEFAULT 'cash',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT positive_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_job_id ON payment_transactions(job_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(payment_date DESC);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view payment transactions" ON payment_transactions;
CREATE POLICY "Users can view payment transactions"
  ON payment_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = payment_transactions.job_id
      AND (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('super_admin', 'service_manager')
        )
        OR (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'service_incharge'
          )
          AND (
            jobs.service_branch_id = (SELECT branch_id FROM profiles WHERE id = auth.uid())
            OR jobs.delivery_branch_id = (SELECT branch_id FROM profiles WHERE id = auth.uid())
          )
        )
        OR (
          jobs.assigned_technician_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert payment transactions" ON payment_transactions;
CREATE POLICY "Authenticated users can insert payment transactions"
  ON payment_transactions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

COMMENT ON TABLE payment_transactions IS 'Tracks individual payment transactions for jobs with timestamps';
COMMENT ON COLUMN payment_transactions.amount IS 'Payment amount (must be positive)';
COMMENT ON COLUMN payment_transactions.payment_date IS 'Date and time when payment was recorded';
COMMENT ON COLUMN payment_transactions.payment_method IS 'Payment method (cash, card, UPI, etc.)';
COMMENT ON COLUMN payment_transactions.notes IS 'Optional notes about the payment';

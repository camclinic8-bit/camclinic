## 15. SQL Stored Procedures & Database RPC Functions

This section details the PL/pgSQL routines used to execute transactional writes and auto-generate fields.

### 15.1 Get Next Job Number (`get_next_job_number`)
Generates sequential, date-formatted job numbers atomically (format: `CC-YYYYMMDD-NNNN`).
```sql
CREATE OR REPLACE FUNCTION get_next_job_number(
  p_shop_id UUID,
  p_branch_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_date_str TEXT;
  v_seq INTEGER;
  v_count INTEGER;
  v_job_number TEXT;
BEGIN
  -- 1. Get current date string in format YYYYMMDD
  v_date_str := to_char(CURRENT_DATE, 'YYYYMMDD');
  
  -- 2. Count jobs matching the format for the shop today
  -- Lock the matching rows to serialize sequential creation safely
  SELECT COALESCE(MAX(SUBSTRING(job_number FROM 13)::INTEGER), 0)
  INTO v_seq
  FROM jobs
  WHERE shop_id = p_shop_id
    AND job_number LIKE 'CC-' || v_date_str || '-%'
  FOR UPDATE;

  -- 3. Increment sequence
  v_seq := v_seq + 1;
  
  -- 4. Build job number: CC-YYYYMMDD-0001
  v_job_number := 'CC-' || v_date_str || '-' || lpad(v_seq::TEXT, 4, '0');
  
  RETURN v_job_number;
END;
$$ LANGUAGE plpgsql;
```

---

### 15.2 Update Job Status & History (`update_job_status_with_history`)
Ensures that whenever a job status changes, a history entry is recorded within the same transaction.
```sql
CREATE OR REPLACE FUNCTION update_job_status_with_history(
  p_job_id UUID,
  p_status JOB_STATUS,
  p_user_id UUID,
  p_notes TEXT
) RETURNS JSONB AS $$
DECLARE
  v_old_status JOB_STATUS;
  v_shop_id UUID;
  v_job_row RECORD;
BEGIN
  -- 1. Fetch current job record and lock it
  SELECT status, shop_id INTO v_old_status, v_shop_id
  FROM jobs
  WHERE id = p_job_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job with ID % not found.', p_job_id;
  END IF;

  -- 2. Prevent redundant writes
  IF v_old_status = p_status THEN
    RETURN jsonb_build_object('success', true, 'message', 'Status already set to ' || p_status::TEXT);
  END IF;

  -- 3. Update status and set service_date if completing
  UPDATE jobs
  SET 
    status = p_status,
    service_date = CASE WHEN p_status = 'completed' THEN NOW() ELSE service_date END,
    updated_at = NOW()
  WHERE id = p_job_id;

  -- 4. Insert status audit log
  INSERT INTO job_status_history (
    job_id,
    from_status,
    to_status,
    changed_by,
    notes
  ) VALUES (
    p_job_id,
    v_old_status,
    p_status,
    p_user_id,
    p_notes
  );

  RETURN jsonb_build_object('success', true, 'job_id', p_job_id, 'old_status', v_old_status, 'new_status', p_status);
END;
$$ LANGUAGE plpgsql;
```

---

### 15.3 Edit Job & Products Transactionally (`update_job_with_products`)
Performs a comprehensive update to a job's assignments, charges, and conditions in a single database transaction.
```sql
CREATE OR REPLACE FUNCTION update_job_with_products(
  p_job_id UUID,
  p_status JOB_STATUS,
  p_priority JOB_PRIORITY,
  p_service_branch_id UUID,
  p_delivery_branch_id UUID,
  p_assigned_incharge_id UUID,
  p_assigned_technician_id UUID,
  p_description TEXT,
  p_technician_notes TEXT,
  p_cam_clinic_advisory_notes TEXT,
  p_inspection_fee NUMERIC,
  p_service_charges NUMERIC,
  p_advance_paid NUMERIC,
  p_advance_paid_date TEXT,
  p_gst_enabled BOOLEAN,
  p_estimate_delivery_date TEXT,
  p_spare_parts_total_cost NUMERIC,
  p_spare_parts_private_details JSONB,
  p_user_id UUID,
  p_products JSONB,
  p_alternative_contact TEXT
) RETURNS JSONB AS $$
DECLARE
  v_old_status JOB_STATUS;
  v_product RECORD;
  v_prod_id UUID;
  v_acc TEXT;
  v_part TEXT;
BEGIN
  -- 1. Fetch current status
  SELECT status INTO v_old_status FROM jobs WHERE id = p_job_id FOR UPDATE;

  -- 2. Update basic fields on the job card
  UPDATE jobs
  SET
    status = COALESCE(p_status, status),
    priority = COALESCE(p_priority, priority),
    service_branch_id = COALESCE(p_service_branch_id, service_branch_id),
    delivery_branch_id = COALESCE(p_delivery_branch_id, delivery_branch_id),
    assigned_incharge_id = p_assigned_incharge_id,
    assigned_technician_id = p_assigned_technician_id,
    description = COALESCE(p_description, description),
    technician_notes = COALESCE(p_technician_notes, technician_notes),
    cam_clinic_advisory_notes = COALESCE(p_cam_clinic_advisory_notes, cam_clinic_advisory_notes),
    inspection_fee = COALESCE(p_inspection_fee, inspection_fee),
    service_charges = COALESCE(p_service_charges, service_charges),
    advance_paid = COALESCE(p_advance_paid, advance_paid),
    advance_paid_date = CASE WHEN p_advance_paid_date IS NOT NULL THEN p_advance_paid_date::DATE ELSE advance_paid_date END,
    gst_enabled = COALESCE(p_gst_enabled, gst_enabled),
    estimate_delivery_date = CASE WHEN p_estimate_delivery_date IS NOT NULL THEN p_estimate_delivery_date::DATE ELSE estimate_delivery_date END,
    alternative_contact = COALESCE(p_alternative_contact, alternative_contact),
    updated_at = NOW()
  WHERE id = p_job_id;

  -- 3. Update products list if JSON array is passed
  IF p_products IS NOT NULL THEN
    -- Delete previous products (cascade triggers delete accessories and other parts)
    DELETE FROM job_products WHERE job_id = p_job_id;

    FOR v_product IN SELECT * FROM jsonb_to_recordset(p_products) AS x(
      brand TEXT, model TEXT, serial_number TEXT, condition PRODUCT_CONDITION[],
      description TEXT, remarks TEXT, has_warranty BOOLEAN, warranty_description TEXT,
      warranty_expiry_date TEXT, repeat_job_number TEXT, other_job_number TEXT,
      accessories TEXT[], other_parts TEXT[], warranty_images TEXT[], product_images TEXT[]
    ) LOOP
      
      INSERT INTO job_products (
        job_id, brand, model, serial_number, condition, description, remarks,
        has_warranty, warranty_description, warranty_expiry_date,
        repeat_job_number, other_job_number, warranty_images, product_images
      ) VALUES (
        p_job_id, v_product.brand, v_product.model, v_product.serial_number, v_product.condition,
        v_product.description, v_product.remarks, v_product.has_warranty,
        v_product.warranty_description, v_product.warranty_expiry_date::DATE,
        v_product.repeat_job_number, v_product.other_job_number,
        COALESCE(v_product.warranty_images, '{}'), COALESCE(v_product.product_images, '{}')
      ) RETURNING id INTO v_prod_id;

      -- Re-insert accessories
      IF v_product.accessories IS NOT NULL THEN
        FOREACH v_acc IN ARRAY v_product.accessories LOOP
          INSERT INTO product_accessories (job_product_id, name) VALUES (v_prod_id, v_acc);
        END LOOP;
      END IF;

      -- Re-insert other parts
      IF v_product.other_parts IS NOT NULL THEN
        FOREACH v_part IN ARRAY v_product.other_parts LOOP
          INSERT INTO product_other_parts (job_product_id, name) VALUES (v_prod_id, v_part);
        END LOOP;
      END IF;

    END LOOP;
  END IF;

  -- 4. Audit status transition if changed
  IF p_status IS NOT NULL AND v_old_status <> p_status THEN
    INSERT INTO job_status_history (job_id, from_status, to_status, changed_by, notes)
    VALUES (p_job_id, v_old_status, p_status, p_user_id, 'Status changed in edit transaction');
  END IF;

  RETURN jsonb_build_object('success', true, 'job_id', p_job_id);
END;
$$ LANGUAGE plpgsql;
```

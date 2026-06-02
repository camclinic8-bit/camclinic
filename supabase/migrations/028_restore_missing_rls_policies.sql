-- Restore missing RLS policies for dependent tables that were accidentally dropped in migration 006 and never recreated.
-- Migration: 028_restore_missing_rls_policies.sql

-- Enable RLS on all these tables to be absolutely sure
ALTER TABLE job_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_other_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;

-- Clean up any accidentally dangling policies on these tables
DROP POLICY IF EXISTS "Users can view status history for accessible jobs" ON job_status_history;
DROP POLICY IF EXISTS "Users can insert status history" ON job_status_history;
DROP POLICY IF EXISTS "Users can view documents for accessible jobs" ON job_documents;
DROP POLICY IF EXISTS "Users can insert documents" ON job_documents;
DROP POLICY IF EXISTS "Users can view job products for accessible jobs" ON job_products;
DROP POLICY IF EXISTS "Users can insert job products" ON job_products;
DROP POLICY IF EXISTS "Users can update job products" ON job_products;
DROP POLICY IF EXISTS "Users can delete job products" ON job_products;
DROP POLICY IF EXISTS "Users can view product accessories" ON product_accessories;
DROP POLICY IF EXISTS "Users can insert product accessories" ON product_accessories;
DROP POLICY IF EXISTS "Users can delete product accessories" ON product_accessories;
DROP POLICY IF EXISTS "Users can view product other parts" ON product_other_parts;
DROP POLICY IF EXISTS "Users can insert product other parts" ON product_other_parts;
DROP POLICY IF EXISTS "Users can delete product other parts" ON product_other_parts;
DROP POLICY IF EXISTS "Users can view spare parts for accessible jobs" ON spare_parts;
DROP POLICY IF EXISTS "Users can insert spare parts" ON spare_parts;
DROP POLICY IF EXISTS "Users can update spare parts" ON spare_parts;
DROP POLICY IF EXISTS "Users can delete spare parts" ON spare_parts;

-- ==========================================
-- 1. JOB STATUS HISTORY POLICIES
-- ==========================================
CREATE POLICY "Users can view status history for accessible jobs"
  ON job_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_status_history.job_id 
      AND jobs.shop_id = get_my_shop_id()
    )
  );

CREATE POLICY "Users can insert status history"
  ON job_status_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_status_history.job_id 
      AND jobs.shop_id = get_my_shop_id()
    )
  );

-- ==========================================
-- 2. JOB DOCUMENTS POLICIES
-- ==========================================
CREATE POLICY "Users can view documents for accessible jobs"
  ON job_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_documents.job_id 
      AND jobs.shop_id = get_my_shop_id()
    )
  );

CREATE POLICY "Users can insert documents"
  ON job_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_documents.job_id 
      AND jobs.shop_id = get_my_shop_id()
    )
  );

-- ==========================================
-- 3. JOB PRODUCTS POLICIES
-- ==========================================
CREATE POLICY "Users can view job products for accessible jobs"
  ON job_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_products.job_id 
      AND jobs.shop_id = get_my_shop_id()
    )
  );

CREATE POLICY "Users can insert job products"
  ON job_products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_products.job_id 
      AND jobs.shop_id = get_my_shop_id()
    )
  );

CREATE POLICY "Users can update job products"
  ON job_products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_products.job_id 
      AND jobs.shop_id = get_my_shop_id()
    )
  );

CREATE POLICY "Users can delete job products"
  ON job_products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_products.job_id 
      AND jobs.shop_id = get_my_shop_id()
    )
  );

-- ==========================================
-- 4. PRODUCT ACCESSORIES POLICIES
-- ==========================================
CREATE POLICY "Users can view product accessories"
  ON product_accessories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_products jp
      JOIN jobs j ON j.id = jp.job_id
      WHERE jp.id = product_accessories.job_product_id
      AND j.shop_id = get_my_shop_id()
    )
  );

CREATE POLICY "Users can insert product accessories"
  ON product_accessories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_products jp
      JOIN jobs j ON j.id = jp.job_id
      WHERE jp.id = product_accessories.job_product_id
      AND j.shop_id = get_my_shop_id()
    )
  );

CREATE POLICY "Users can delete product accessories"
  ON product_accessories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM job_products jp
      JOIN jobs j ON j.id = jp.job_id
      WHERE jp.id = product_accessories.job_product_id
      AND j.shop_id = get_my_shop_id()
    )
  );

-- ==========================================
-- 5. PRODUCT OTHER PARTS POLICIES
-- ==========================================
CREATE POLICY "Users can view product other parts"
  ON product_other_parts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM job_products jp
      JOIN jobs j ON j.id = jp.job_id
      WHERE jp.id = product_other_parts.job_product_id
      AND j.shop_id = get_my_shop_id()
    )
  );

CREATE POLICY "Users can insert product other parts"
  ON product_other_parts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_products jp
      JOIN jobs j ON j.id = jp.job_id
      WHERE jp.id = product_other_parts.job_product_id
      AND j.shop_id = get_my_shop_id()
    )
  );

CREATE POLICY "Users can delete product other parts"
  ON product_other_parts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM job_products jp
      JOIN jobs j ON j.id = jp.job_id
      WHERE jp.id = product_other_parts.job_product_id
      AND j.shop_id = get_my_shop_id()
    )
  );

-- ==========================================
-- 6. SPARE PARTS POLICIES
-- ==========================================
CREATE POLICY "Users can view spare parts for accessible jobs"
  ON spare_parts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = spare_parts.job_id 
      AND jobs.shop_id = get_my_shop_id()
    )
  );

CREATE POLICY "Users can insert spare parts"
  ON spare_parts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = spare_parts.job_id 
      AND jobs.shop_id = get_my_shop_id()
    )
    AND get_my_role()::text IN ('super_admin', 'service_manager', 'service_incharge')
  );

CREATE POLICY "Users can update spare parts"
  ON spare_parts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = spare_parts.job_id 
      AND jobs.shop_id = get_my_shop_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = spare_parts.job_id 
      AND jobs.shop_id = get_my_shop_id()
    )
    AND get_my_role()::text IN ('super_admin', 'service_manager', 'service_incharge')
  );

CREATE POLICY "Users can delete spare parts"
  ON spare_parts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = spare_parts.job_id 
      AND jobs.shop_id = get_my_shop_id()
    )
    AND get_my_role()::text IN ('super_admin', 'service_manager')
  );

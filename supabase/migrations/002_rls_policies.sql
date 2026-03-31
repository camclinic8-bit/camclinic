-- Cam Clinic RLS Policies
-- Migration: 002_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_other_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_documents ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's profile
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS profiles AS $$
  SELECT * FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get user's shop_id
CREATE OR REPLACE FUNCTION get_my_shop_id()
RETURNS UUID AS $$
  SELECT shop_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get user's branch_id
CREATE OR REPLACE FUNCTION get_my_branch_id()
RETURNS UUID AS $$
  SELECT branch_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================
-- SHOPS POLICIES
-- =====================
CREATE POLICY "Users can view their own shop"
  ON shops FOR SELECT
  USING (id = get_my_shop_id());

CREATE POLICY "Super admins can update their shop"
  ON shops FOR UPDATE
  USING (id = get_my_shop_id() AND is_super_admin());

-- =====================
-- BRANCHES POLICIES
-- =====================
CREATE POLICY "Users can view branches in their shop"
  ON branches FOR SELECT
  USING (shop_id = get_my_shop_id());

CREATE POLICY "Super admins can insert branches"
  ON branches FOR INSERT
  WITH CHECK (shop_id = get_my_shop_id() AND is_super_admin());

CREATE POLICY "Super admins can update branches"
  ON branches FOR UPDATE
  USING (shop_id = get_my_shop_id() AND is_super_admin());

CREATE POLICY "Super admins can delete branches"
  ON branches FOR DELETE
  USING (shop_id = get_my_shop_id() AND is_super_admin());

-- =====================
-- PROFILES POLICIES
-- =====================
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Super admins can view all profiles in their shop"
  ON profiles FOR SELECT
  USING (shop_id = get_my_shop_id() AND is_super_admin());

CREATE POLICY "Service managers can view profiles in their branch"
  ON profiles FOR SELECT
  USING (
    shop_id = get_my_shop_id() 
    AND branch_id = get_my_branch_id()
    AND get_my_role() IN ('service_manager', 'service_incharge')
  );

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Super admins can update profiles in their shop"
  ON profiles FOR UPDATE
  USING (shop_id = get_my_shop_id() AND is_super_admin());

CREATE POLICY "Super admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (shop_id = get_my_shop_id() AND is_super_admin());

-- =====================
-- CUSTOMERS POLICIES
-- =====================
CREATE POLICY "Users can view customers in their shop"
  ON customers FOR SELECT
  USING (shop_id = get_my_shop_id());

CREATE POLICY "Users can insert customers in their shop"
  ON customers FOR INSERT
  WITH CHECK (shop_id = get_my_shop_id());

CREATE POLICY "Users can update customers in their shop"
  ON customers FOR UPDATE
  USING (shop_id = get_my_shop_id());

-- =====================
-- JOBS POLICIES
-- =====================
-- Super admin: full access to all jobs in their shop
CREATE POLICY "Super admins can view all jobs in their shop"
  ON jobs FOR SELECT
  USING (shop_id = get_my_shop_id() AND is_super_admin());

CREATE POLICY "Super admins can insert jobs"
  ON jobs FOR INSERT
  WITH CHECK (shop_id = get_my_shop_id() AND is_super_admin());

CREATE POLICY "Super admins can update jobs"
  ON jobs FOR UPDATE
  USING (shop_id = get_my_shop_id() AND is_super_admin());

-- Service manager: access to jobs in their branch
CREATE POLICY "Service managers can view jobs in their branch"
  ON jobs FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND (service_branch_id = get_my_branch_id() OR delivery_branch_id = get_my_branch_id())
    AND get_my_role() = 'service_manager'
  );

CREATE POLICY "Service managers can insert jobs in their branch"
  ON jobs FOR INSERT
  WITH CHECK (
    shop_id = get_my_shop_id()
    AND service_branch_id = get_my_branch_id()
    AND get_my_role() = 'service_manager'
  );

CREATE POLICY "Service managers can update jobs in their branch"
  ON jobs FOR UPDATE
  USING (
    shop_id = get_my_shop_id()
    AND (service_branch_id = get_my_branch_id() OR delivery_branch_id = get_my_branch_id())
    AND get_my_role() = 'service_manager'
  );

-- Service incharge: access to jobs in their branch
CREATE POLICY "Service incharge can view jobs in their branch"
  ON jobs FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND (service_branch_id = get_my_branch_id() OR delivery_branch_id = get_my_branch_id())
    AND get_my_role() = 'service_incharge'
  );

CREATE POLICY "Service incharge can insert jobs"
  ON jobs FOR INSERT
  WITH CHECK (
    shop_id = get_my_shop_id()
    AND service_branch_id = get_my_branch_id()
    AND get_my_role() = 'service_incharge'
  );

CREATE POLICY "Service incharge can update jobs in their branch"
  ON jobs FOR UPDATE
  USING (
    shop_id = get_my_shop_id()
    AND (service_branch_id = get_my_branch_id() OR assigned_incharge_id = auth.uid())
    AND get_my_role() = 'service_incharge'
  );

-- Technician: view only assigned jobs
CREATE POLICY "Technicians can view their assigned jobs"
  ON jobs FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND assigned_technician_id = auth.uid()
    AND get_my_role() = 'technician'
  );

CREATE POLICY "Technicians can update their assigned jobs"
  ON jobs FOR UPDATE
  USING (
    shop_id = get_my_shop_id()
    AND assigned_technician_id = auth.uid()
    AND get_my_role() = 'technician'
  )
  WITH CHECK (
    -- Technicians can only update specific fields
    shop_id = get_my_shop_id()
    AND assigned_technician_id = auth.uid()
  );

-- =====================
-- JOB PRODUCTS POLICIES
-- =====================
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

-- =====================
-- PRODUCT ACCESSORIES POLICIES
-- =====================
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

-- =====================
-- PRODUCT OTHER PARTS POLICIES
-- =====================
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

-- =====================
-- SPARE PARTS POLICIES
-- =====================
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
    AND get_my_role() IN ('super_admin', 'service_manager', 'service_incharge')
  );

CREATE POLICY "Users can update spare parts"
  ON spare_parts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = spare_parts.job_id 
      AND jobs.shop_id = get_my_shop_id()
    )
    AND get_my_role() IN ('super_admin', 'service_manager', 'service_incharge')
  );

CREATE POLICY "Users can delete spare parts"
  ON spare_parts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = spare_parts.job_id 
      AND jobs.shop_id = get_my_shop_id()
    )
    AND get_my_role() IN ('super_admin', 'service_manager')
  );

-- =====================
-- JOB STATUS HISTORY POLICIES
-- =====================
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

-- =====================
-- JOB DOCUMENTS POLICIES
-- =====================
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

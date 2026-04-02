-- Apply Correct RLS Policies - Clean Version
-- Migration: 006_apply_correct_rls.sql

-- First, drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view branches in their shop" ON branches;
DROP POLICY IF EXISTS "Super admins can delete branches" ON branches;
DROP POLICY IF EXISTS "Super admins can insert branches" ON branches;
DROP POLICY IF EXISTS "Super admins can update branches" ON branches;

DROP POLICY IF EXISTS "Users can insert customers in their shop" ON customers;
DROP POLICY IF EXISTS "Users can update customers in their shop" ON customers;
DROP POLICY IF EXISTS "Users can view customers in their shop" ON customers;

DROP POLICY IF EXISTS "Users can insert documents" ON job_documents;
DROP POLICY IF EXISTS "Users can view documents for accessible jobs" ON job_documents;

DROP POLICY IF EXISTS "Users can delete job products" ON job_products;
DROP POLICY IF EXISTS "Users can insert job products" ON job_products;
DROP POLICY IF EXISTS "Users can update job products" ON job_products;
DROP POLICY IF EXISTS "Users can view job products for accessible jobs" ON job_products;

DROP POLICY IF EXISTS "Users can insert status history" ON job_status_history;
DROP POLICY IF EXISTS "Users can view status history for accessible jobs" ON job_status_history;

DROP POLICY IF EXISTS "Service incharge can insert jobs" ON jobs;
DROP POLICY IF EXISTS "Service incharge can update jobs in their branch" ON jobs;
DROP POLICY IF EXISTS "Service incharge can view jobs in their branch" ON jobs;
DROP POLICY IF EXISTS "Service managers can insert jobs in their branch" ON jobs;
DROP POLICY IF EXISTS "Service managers can update jobs in their branch" ON jobs;
DROP POLICY IF EXISTS "Service managers can view jobs in their branch" ON jobs;
DROP POLICY IF EXISTS "Super admins can insert jobs" ON jobs;
DROP POLICY IF EXISTS "Super admins can update jobs" ON jobs;
DROP POLICY IF EXISTS "Super admins can view all jobs in their shop" ON jobs;
DROP POLICY IF EXISTS "Technicians can update their assigned jobs" ON jobs;
DROP POLICY IF EXISTS "Technicians can view their assigned jobs" ON jobs;

DROP POLICY IF EXISTS "Service managers can view profiles in their branch" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can update profiles in their shop" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles in their shop" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

DROP POLICY IF EXISTS "Super admins can update their shop" ON shops;
DROP POLICY IF EXISTS "Users can view their own shop" ON shops;

DROP POLICY IF EXISTS "Users can delete spare parts" ON spare_parts;
DROP POLICY IF EXISTS "Users can insert spare parts" ON spare_parts;
DROP POLICY IF EXISTS "Users can update spare parts" ON spare_parts;
DROP POLICY IF EXISTS "Users can view spare parts for accessible jobs" ON spare_parts;

DROP POLICY IF EXISTS "Users can delete product accessories" ON product_accessories;
DROP POLICY IF EXISTS "Users can insert product accessories" ON product_accessories;
DROP POLICY IF EXISTS "Users can view product accessories" ON product_accessories;

DROP POLICY IF EXISTS "Users can delete product other parts" ON product_other_parts;
DROP POLICY IF EXISTS "Users can insert product other parts" ON product_other_parts;
DROP POLICY IF EXISTS "Users can view product other parts" ON product_other_parts;

-- Recreate helper functions
CREATE OR REPLACE FUNCTION get_my_shop_id()
RETURNS UUID AS $$
  SELECT shop_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_branch_id()
RETURNS UUID AS $$
  SELECT branch_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Apply new role-based policies

-- Profiles policies
CREATE POLICY "Super admins can view all profiles in their shop"
  ON profiles FOR SELECT
  USING (shop_id = get_my_shop_id() AND is_super_admin());

CREATE POLICY "Service managers can view profiles in their branch"
  ON profiles FOR SELECT
  USING (
    shop_id = get_my_shop_id() 
    AND branch_id = get_my_branch_id()
    AND get_my_role() = 'service_manager'
  );

CREATE POLICY "Service incharges can view profiles in their branch"
  ON profiles FOR SELECT
  USING (
    shop_id = get_my_shop_id() 
    AND branch_id = get_my_branch_id()
    AND get_my_role() = 'service_incharge'
  );

CREATE POLICY "Technicians can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid() AND get_my_role() = 'technician');

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Super admins can update profiles in their shop"
  ON profiles FOR UPDATE
  USING (shop_id = get_my_shop_id() AND is_super_admin());

CREATE POLICY "Super admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (shop_id = get_my_shop_id() AND is_super_admin());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Customers policies
CREATE POLICY "Super admins can view all customers in their shop"
  ON customers FOR SELECT
  USING (shop_id = get_my_shop_id() AND is_super_admin());

CREATE POLICY "Service managers can view customers in their branch"
  ON customers FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND branch_id = get_my_branch_id()
    AND get_my_role() = 'service_manager'
  );

CREATE POLICY "Service incharges can view customers in their branch"
  ON customers FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND branch_id = get_my_branch_id()
    AND get_my_role() = 'service_incharge'
  );

CREATE POLICY "Technicians can view customers of their assigned jobs"
  ON customers FOR SELECT
  USING (
    id IN (
      SELECT customer_id FROM jobs 
      WHERE assigned_technician_id = auth.uid()
    )
    AND get_my_role() = 'technician'
  );

CREATE POLICY "Super admins can manage customers in their shop"
  ON customers FOR ALL
  USING (shop_id = get_my_shop_id() AND is_super_admin())
  WITH CHECK (shop_id = get_my_shop_id() AND is_super_admin());

CREATE POLICY "Service managers can manage customers in their branch"
  ON customers FOR ALL
  USING (
    shop_id = get_my_shop_id()
    AND branch_id = get_my_branch_id()
    AND get_my_role() = 'service_manager'
  )
  WITH CHECK (
    shop_id = get_my_shop_id()
    AND branch_id = get_my_branch_id()
    AND get_my_role() = 'service_manager'
  );

-- Jobs policies
CREATE POLICY "Super admins can view all jobs in their shop"
  ON jobs FOR SELECT
  USING (shop_id = get_my_shop_id() AND is_super_admin());

CREATE POLICY "Service managers can view all jobs in their branch"
  ON jobs FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND (
      service_branch_id = get_my_branch_id() 
      OR delivery_branch_id = get_my_branch_id()
    )
    AND get_my_role() = 'service_manager'
  );

CREATE POLICY "Service incharges can view all jobs in their branch"
  ON jobs FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND (
      service_branch_id = get_my_branch_id() 
      OR delivery_branch_id = get_my_branch_id()
    )
    AND get_my_role() = 'service_incharge'
  );

CREATE POLICY "Technicians can view only their assigned jobs"
  ON jobs FOR SELECT
  USING (
    assigned_technician_id = auth.uid()
    AND get_my_role() = 'technician'
  );

CREATE POLICY "Super admins can manage jobs in their shop"
  ON jobs FOR ALL
  USING (shop_id = get_my_shop_id() AND is_super_admin())
  WITH CHECK (shop_id = get_my_shop_id() AND is_super_admin());

CREATE POLICY "Service managers can manage jobs in their branch"
  ON jobs FOR ALL
  USING (
    shop_id = get_my_shop_id()
    AND (
      service_branch_id = get_my_branch_id() 
      OR delivery_branch_id = get_my_branch_id()
    )
    AND get_my_role() = 'service_manager'
  )
  WITH CHECK (
    shop_id = get_my_shop_id()
    AND service_branch_id = get_my_branch_id()
    AND get_my_role() = 'service_manager'
  );

CREATE POLICY "Service incharges can manage jobs in their branch"
  ON jobs FOR ALL
  USING (
    shop_id = get_my_shop_id()
    AND (
      service_branch_id = get_my_branch_id() 
      OR delivery_branch_id = get_my_branch_id()
      OR assigned_incharge_id = auth.uid()
    )
    AND get_my_role() = 'service_incharge'
  )
  WITH CHECK (
    shop_id = get_my_shop_id()
    AND service_branch_id = get_my_branch_id()
    AND get_my_role() = 'service_incharge'
  );

CREATE POLICY "Technicians can update their assigned jobs"
  ON jobs FOR UPDATE
  USING (
    assigned_technician_id = auth.uid()
    AND get_my_role() = 'technician'
  )
  WITH CHECK (
    assigned_technician_id = auth.uid()
    AND get_my_role() = 'technician'
  );

-- Branches policies
CREATE POLICY "Super admins can view all branches in their shop"
  ON branches FOR SELECT
  USING (shop_id = get_my_shop_id() AND is_super_admin());

CREATE POLICY "Service managers can view all branches for assignment"
  ON branches FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND get_my_role() = 'service_manager'
  );

CREATE POLICY "Service incharges can view all branches for assignment"
  ON branches FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND get_my_role() = 'service_incharge'
  );

CREATE POLICY "Technicians can view their own branch"
  ON branches FOR SELECT
  USING (
    id = get_my_branch_id()
    AND get_my_role() = 'technician'
  );

CREATE POLICY "Super admins can manage branches in their shop"
  ON branches FOR ALL
  USING (shop_id = get_my_shop_id() AND is_super_admin())
  WITH CHECK (shop_id = get_my_shop_id() AND is_super_admin());

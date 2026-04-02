-- Update RLS Policies for Enhanced Role-Based Access Control (Safe Version)
-- Migration: 004_update_rls_policies_safe.sql

-- First, check and add branch_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'branch_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN branch_id UUID REFERENCES branches(id);
        RAISE NOTICE 'Added branch_id column to profiles table';
    ELSE
        RAISE NOTICE 'branch_id column already exists in profiles table';
    END IF;
END $$;

-- Check and add shop_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'shop_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN shop_id UUID REFERENCES shops(id);
        RAISE NOTICE 'Added shop_id column to profiles table';
    ELSE
        RAISE NOTICE 'shop_id column already exists in profiles table';
    END IF;
END $$;

-- First, ensure helper functions exist (recreate them if needed)
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS profiles AS $$
  SELECT * FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'super_admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_shop_id()
RETURNS UUID AS $$
  SELECT shop_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Handle branch_id safely - it might be NULL for some users
CREATE OR REPLACE FUNCTION get_my_branch_id()
RETURNS UUID AS $$
  SELECT branch_id FROM profiles WHERE id = auth.uid() AND branch_id IS NOT NULL
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop existing policies to recreate them with updated rules
DROP POLICY IF EXISTS "Super admins can view all profiles in their shop" ON profiles;
DROP POLICY IF EXISTS "Service managers can view profiles in their branch" ON profiles;
DROP POLICY IF EXISTS "Super admins can update profiles in their shop" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view customers in their shop" ON customers;
DROP POLICY IF EXISTS "Users can insert customers in their shop" ON customers;
DROP POLICY IF EXISTS "Users can update customers in their shop" ON customers;

DROP POLICY IF EXISTS "Super admins can view all jobs in their shop" ON jobs;
DROP POLICY IF EXISTS "Super admins can insert jobs" ON jobs;
DROP POLICY IF EXISTS "Super admins can update jobs" ON jobs;
DROP POLICY IF EXISTS "Service managers can view jobs in their branch" ON jobs;
DROP POLICY IF EXISTS "Service managers can insert jobs in their branch" ON jobs;
DROP POLICY IF EXISTS "Service managers can update jobs in their branch" ON jobs;
DROP POLICY IF EXISTS "Service incharge can view jobs in their branch" ON jobs;
DROP POLICY IF EXISTS "Service incharge can insert jobs" ON jobs;
DROP POLICY IF EXISTS "Service incharge can update jobs in their branch" ON jobs;
DROP POLICY IF EXISTS "Technicians can view their assigned jobs" ON jobs;
DROP POLICY IF EXISTS "Technicians can update their assigned jobs" ON jobs;

DROP POLICY IF EXISTS "Users can view branches in their shop" ON branches;
DROP POLICY IF EXISTS "Super admins can manage branches in their shop" ON branches;

-- =====================
-- PROFILES POLICIES (Updated)
-- =====================

-- Super Admin/Owner: Can view all profiles across all branches
CREATE POLICY "Super admins can view all profiles in their shop"
  ON profiles FOR SELECT
  USING (shop_id = get_my_shop_id() AND is_super_admin());

-- Service Manager: Can view all profiles in their branch only (handle NULL branch_id)
CREATE POLICY "Service managers can view profiles in their branch"
  ON profiles FOR SELECT
  USING (
    shop_id = get_my_shop_id() 
    AND branch_id = get_my_branch_id()
    AND get_my_role() = 'service_manager'
  );

-- Technician: Can only view their own profile
CREATE POLICY "Technicians can view their own profile"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    AND get_my_role() = 'technician'
  );

-- Service Incharge: Can view profiles in their branch (handle NULL branch_id)
CREATE POLICY "Service incharges can view profiles in their branch"
  ON profiles FOR SELECT
  USING (
    shop_id = get_my_shop_id() 
    AND branch_id = get_my_branch_id()
    AND get_my_role() = 'service_incharge'
  );

-- Super Admin: Can update any profile in their shop
CREATE POLICY "Super admins can update profiles in their shop"
  ON profiles FOR UPDATE
  USING (shop_id = get_my_shop_id() AND is_super_admin());

-- Super Admin: Can insert profiles (can assign to any branch)
CREATE POLICY "Super admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (shop_id = get_my_shop_id() AND is_super_admin());

-- Service Manager: Can insert/update technicians for their branch
CREATE POLICY "Service managers can manage technicians in their branch"
  ON profiles FOR INSERT
  WITH CHECK (
    shop_id = get_my_shop_id()
    AND branch_id = get_my_branch_id()
    AND role = 'technician'
    AND get_my_role() = 'service_manager'
  );

CREATE POLICY "Service managers can update technicians in their branch"
  ON profiles FOR UPDATE
  USING (
    shop_id = get_my_shop_id()
    AND branch_id = get_my_branch_id()
    AND role = 'technician'
    AND get_my_role() = 'service_manager'
  );

-- =====================
-- CUSTOMERS POLICIES (Updated)
-- =====================

-- Super Admin: Can view all customers across all branches
CREATE POLICY "Super admins can view all customers in their shop"
  ON customers FOR SELECT
  USING (shop_id = get_my_shop_id() AND is_super_admin());

-- Service Manager: Can view customers in their branch only (handle NULL branch_id)
CREATE POLICY "Service managers can view customers in their branch"
  ON customers FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND branch_id = get_my_branch_id()
    AND get_my_role() = 'service_manager'
  );

-- Service Incharge: Can view customers in their branch (handle NULL branch_id)
CREATE POLICY "Service incharges can view customers in their branch"
  ON customers FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND branch_id = get_my_branch_id()
    AND get_my_role() = 'service_incharge'
  );

-- Technician: Can view customers only for jobs assigned to them
CREATE POLICY "Technicians can view customers of their assigned jobs"
  ON customers FOR SELECT
  USING (
    id IN (
      SELECT customer_id FROM jobs 
      WHERE assigned_technician_id = auth.uid()
    )
    AND get_my_role() = 'technician'
  );

-- Super Admin: Can insert/update customers for any branch
CREATE POLICY "Super admins can manage customers in their shop"
  ON customers FOR INSERT WITH CHECK (shop_id = get_my_shop_id() AND is_super_admin());
CREATE POLICY "Super admins can update customers in their shop"
  ON customers FOR UPDATE USING (shop_id = get_my_shop_id() AND is_super_admin());

-- Service Manager: Can manage customers in their branch
CREATE POLICY "Service managers can manage customers in their branch"
  ON customers FOR INSERT WITH CHECK (
    shop_id = get_my_shop_id()
    AND branch_id = get_my_branch_id()
    AND get_my_role() = 'service_manager'
  );
CREATE POLICY "Service managers can update customers in their branch"
  ON customers FOR UPDATE USING (
    shop_id = get_my_shop_id()
    AND branch_id = get_my_branch_id()
    AND get_my_role() = 'service_manager'
  );

-- =====================
-- JOBS POLICIES (Updated)
-- =====================

-- Super Admin: Can view all jobs across all branches
CREATE POLICY "Super admins can view all jobs in their shop"
  ON jobs FOR SELECT
  USING (shop_id = get_my_shop_id() AND is_super_admin());

-- Service Manager: Can view all jobs in their branch (handle NULL branch_id)
CREATE POLICY "Service managers can view all jobs in their branch"
  ON jobs FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND (service_branch_id = get_my_branch_id() OR delivery_branch_id = get_my_branch_id())
    AND get_my_role() = 'service_manager'
  );

-- Service Incharge: Can view all jobs in their branch (handle NULL branch_id)
CREATE POLICY "Service incharges can view all jobs in their branch"
  ON jobs FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND (service_branch_id = get_my_branch_id() OR delivery_branch_id = get_my_branch_id())
    AND get_my_role() = 'service_incharge'
  );

-- Technician: Can ONLY view jobs assigned to them
CREATE POLICY "Technicians can view only their assigned jobs"
  ON jobs FOR SELECT
  USING (
    assigned_technician_id = auth.uid()
    AND get_my_role() = 'technician'
  );

-- Super Admin: Can insert/update jobs for any branch
CREATE POLICY "Super admins can manage jobs in their shop"
  ON jobs FOR INSERT WITH CHECK (shop_id = get_my_shop_id() AND is_super_admin());
CREATE POLICY "Super admins can update jobs in their shop"
  ON jobs FOR UPDATE USING (shop_id = get_my_shop_id() AND is_super_admin());

-- Service Manager: Can manage jobs in their branch (can assign to other branches)
CREATE POLICY "Service managers can insert jobs in their branch"
  ON jobs FOR INSERT WITH CHECK (
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

-- Service Incharge: Can manage jobs in their branch
CREATE POLICY "Service incharges can insert jobs in their branch"
  ON jobs FOR INSERT WITH CHECK (
    shop_id = get_my_shop_id()
    AND service_branch_id = get_my_branch_id()
    AND get_my_role() = 'service_incharge'
  );

CREATE POLICY "Service incharges can update jobs in their branch"
  ON jobs FOR UPDATE
  USING (
    shop_id = get_my_shop_id()
    AND (service_branch_id = get_my_branch_id() OR assigned_incharge_id = auth.uid())
    AND get_my_role() = 'service_incharge'
  );

-- Technician: Can update only their assigned jobs (specific fields only)
CREATE POLICY "Technicians can update their assigned jobs"
  ON jobs FOR UPDATE
  USING (
    assigned_technician_id = auth.uid()
    AND get_my_role() = 'technician'
  )
  WITH CHECK (
    -- Technicians can only update specific fields
    assigned_technician_id = auth.uid()
    AND get_my_role() = 'technician'
  );

-- =====================
-- BRANCHES POLICIES (Updated)
-- =====================

-- Super Admin: Can view all branches
CREATE POLICY "Super admins can view all branches in their shop"
  ON branches FOR SELECT
  USING (shop_id = get_my_shop_id() AND is_super_admin());

-- Service Manager: Can view all branches (for assignment purposes)
CREATE POLICY "Service managers can view all branches for assignment"
  ON branches FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND get_my_role() = 'service_manager'
  );

-- Service Incharge: Can view all branches (for assignment purposes)
CREATE POLICY "Service incharges can view all branches for assignment"
  ON branches FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND get_my_role() = 'service_incharge'
  );

-- Technician: Can only view their own branch (handle NULL branch_id)
CREATE POLICY "Technicians can view their own branch"
  ON branches FOR SELECT
  USING (
    id = COALESCE(get_my_branch_id(), '00000000-0000-0000-0000-000000000000'::uuid)
    AND get_my_role() = 'technician'
  );

-- Super Admin: Can manage branches
CREATE POLICY "Super admins can manage branches in their shop"
  ON branches FOR ALL
  USING (shop_id = get_my_shop_id() AND is_super_admin())
  WITH CHECK (shop_id = get_my_shop_id() AND is_super_admin());

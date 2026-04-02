-- Fix RLS Policies for Enhanced Role-Based Access Control
-- Migration: 20260331181500_fix_rls_policies.sql

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

-- Recreate helper functions
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

CREATE OR REPLACE FUNCTION get_my_branch_id()
RETURNS UUID AS $$
  SELECT branch_id FROM profiles WHERE id = auth.uid() AND branch_id IS NOT NULL
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Drop existing policies
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

-- Create new policies for profiles
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

CREATE POLICY "Technicians can view their own profile"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    AND get_my_role() = 'technician'
  );

CREATE POLICY "Service incharges can view profiles in their branch"
  ON profiles FOR SELECT
  USING (
    shop_id = get_my_shop_id() 
    AND branch_id = get_my_branch_id()
    AND get_my_role() = 'service_incharge'
  );

CREATE POLICY "Super admins can update profiles in their shop"
  ON profiles FOR UPDATE
  USING (shop_id = get_my_shop_id() AND is_super_admin());

CREATE POLICY "Super admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (shop_id = get_my_shop_id() AND is_super_admin());

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

-- Create new policies for customers
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
  ON customers FOR INSERT WITH CHECK (shop_id = get_my_shop_id() AND is_super_admin());
CREATE POLICY "Super admins can update customers in their shop"
  ON customers FOR UPDATE USING (shop_id = get_my_shop_id() AND is_super_admin());

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

-- Create new policies for jobs
CREATE POLICY "Super admins can view all jobs in their shop"
  ON jobs FOR SELECT
  USING (shop_id = get_my_shop_id() AND is_super_admin());

CREATE POLICY "Service managers can view all jobs in their branch"
  ON jobs FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND (service_branch_id = get_my_branch_id() OR delivery_branch_id = get_my_branch_id())
    AND get_my_role() = 'service_manager'
  );

CREATE POLICY "Service incharges can view all jobs in their branch"
  ON jobs FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND (service_branch_id = get_my_branch_id() OR delivery_branch_id = get_my_branch_id())
    AND get_my_role() = 'service_incharge'
  );

CREATE POLICY "Technicians can view only their assigned jobs"
  ON jobs FOR SELECT
  USING (
    assigned_technician_id = auth.uid()
    AND get_my_role() = 'technician'
  );

CREATE POLICY "Super admins can manage jobs in their shop"
  ON jobs FOR INSERT WITH CHECK (shop_id = get_my_shop_id() AND is_super_admin());
CREATE POLICY "Super admins can update jobs in their shop"
  ON jobs FOR UPDATE USING (shop_id = get_my_shop_id() AND is_super_admin());

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

-- Create new policies for branches
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
    id = COALESCE(get_my_branch_id(), '00000000-0000-0000-0000-000000000000'::uuid)
    AND get_my_role() = 'technician'
  );

CREATE POLICY "Super admins can manage branches in their shop"
  ON branches FOR ALL
  USING (shop_id = get_my_shop_id() AND is_super_admin())
  WITH CHECK (shop_id = get_my_shop_id() AND is_super_admin());

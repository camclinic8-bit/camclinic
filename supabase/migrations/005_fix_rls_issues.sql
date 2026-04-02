-- Fix issues with RLS policies from migration 004
-- Migration: 005_fix_rls_issues.sql

-- Fix 1: Update get_my_branch_id to handle NULL better
CREATE OR REPLACE FUNCTION get_my_branch_id()
RETURNS UUID AS $$
  SELECT branch_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Fix 2: Add helper function to check if user has branch
CREATE OR REPLACE FUNCTION has_branch_id()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND branch_id IS NOT NULL
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Fix 3: Update problematic policies

-- Drop and recreate technician branch policy with better NULL handling
DROP POLICY IF EXISTS "Technicians can view their own branch" ON branches;

CREATE POLICY "Technicians can view their own branch"
  ON branches FOR SELECT
  USING (
    get_my_role() = 'technician'
    AND has_branch_id()
    AND id = get_my_branch_id()
  );

-- Fix 4: Update policies that might fail with NULL branch_id

-- Drop and recreate service manager policies with NULL checks
DROP POLICY IF EXISTS "Service managers can view profiles in their branch" ON profiles;
DROP POLICY IF EXISTS "Service managers can manage technicians in their branch" ON profiles;
DROP POLICY IF EXISTS "Service managers can update technicians in their branch" ON profiles;

CREATE POLICY "Service managers can view profiles in their branch"
  ON profiles FOR SELECT
  USING (
    shop_id = get_my_shop_id() 
    AND get_my_role() = 'service_manager'
    AND (
      branch_id = get_my_branch_id() 
      OR branch_id IS NULL
    )
  );

CREATE POLICY "Service managers can manage technicians in their branch"
  ON profiles FOR INSERT
  WITH CHECK (
    shop_id = get_my_shop_id()
    AND role = 'technician'
    AND get_my_role() = 'service_manager'
    AND (
      branch_id = get_my_branch_id() 
      OR branch_id IS NULL
    )
  );

CREATE POLICY "Service managers can update technicians in their branch"
  ON profiles FOR UPDATE
  USING (
    shop_id = get_my_shop_id()
    AND role = 'technician'
    AND get_my_role() = 'service_manager'
    AND (
      branch_id = get_my_branch_id() 
      OR branch_id IS NULL
    )
  );

-- Fix 5: Similar fixes for service incharge policies
DROP POLICY IF EXISTS "Service incharges can view profiles in their branch" ON profiles;

CREATE POLICY "Service incharges can view profiles in their branch"
  ON profiles FOR SELECT
  USING (
    shop_id = get_my_shop_id() 
    AND get_my_role() = 'service_incharge'
    AND (
      branch_id = get_my_branch_id() 
      OR branch_id IS NULL
    )
  );

-- Fix 6: Update customer policies
DROP POLICY IF EXISTS "Service managers can view customers in their branch" ON customers;
DROP POLICY IF EXISTS "Service managers can manage customers in their branch" ON customers;
DROP POLICY IF EXISTS "Service managers can update customers in their branch" ON customers;

CREATE POLICY "Service managers can view customers in their branch"
  ON customers FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND get_my_role() = 'service_manager'
    AND (
      branch_id = get_my_branch_id() 
      OR branch_id IS NULL
    )
  );

CREATE POLICY "Service managers can manage customers in their branch"
  ON customers FOR INSERT WITH CHECK (
    shop_id = get_my_shop_id()
    AND get_my_role() = 'service_manager'
    AND (
      branch_id = get_my_branch_id() 
      OR branch_id IS NULL
    )
  );

CREATE POLICY "Service managers can update customers in their branch"
  ON customers FOR UPDATE USING (
    shop_id = get_my_shop_id()
    AND get_my_role() = 'service_manager'
    AND (
      branch_id = get_my_branch_id() 
      OR branch_id IS NULL
    )
  );

-- Fix 7: Update job policies
DROP POLICY IF EXISTS "Service managers can view all jobs in their branch" ON jobs;
DROP POLICY IF EXISTS "Service managers can insert jobs in their branch" ON jobs;
DROP POLICY IF EXISTS "Service managers can update jobs in their branch" ON jobs;

CREATE POLICY "Service managers can view all jobs in their branch"
  ON jobs FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND get_my_role() = 'service_manager'
    AND (
      service_branch_id = get_my_branch_id() 
      OR delivery_branch_id = get_my_branch_id()
      OR service_branch_id IS NULL
      OR delivery_branch_id IS NULL
    )
  );

CREATE POLICY "Service managers can insert jobs in their branch"
  ON jobs FOR INSERT WITH CHECK (
    shop_id = get_my_shop_id()
    AND get_my_role() = 'service_manager'
    AND (
      service_branch_id = get_my_branch_id() 
      OR service_branch_id IS NULL
    )
  );

CREATE POLICY "Service managers can update jobs in their branch"
  ON jobs FOR UPDATE
  USING (
    shop_id = get_my_shop_id()
    AND get_my_role() = 'service_manager'
    AND (
      service_branch_id = get_my_branch_id() 
      OR delivery_branch_id = get_my_branch_id()
      OR service_branch_id IS NULL
      OR delivery_branch_id IS NULL
    )
  );

-- Fix 8: Similar fixes for service incharge job policies
DROP POLICY IF EXISTS "Service incharges can view all jobs in their branch" ON jobs;
DROP POLICY IF EXISTS "Service incharges can insert jobs in their branch" ON jobs;
DROP POLICY IF EXISTS "Service incharges can update jobs in their branch" ON jobs;

CREATE POLICY "Service incharges can view all jobs in their branch"
  ON jobs FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND get_my_role() = 'service_incharge'
    AND (
      service_branch_id = get_my_branch_id() 
      OR delivery_branch_id = get_my_branch_id()
      OR service_branch_id IS NULL
      OR delivery_branch_id IS NULL
    )
  );

CREATE POLICY "Service incharges can insert jobs in their branch"
  ON jobs FOR INSERT WITH CHECK (
    shop_id = get_my_shop_id()
    AND get_my_role() = 'service_incharge'
    AND (
      service_branch_id = get_my_branch_id() 
      OR service_branch_id IS NULL
    )
  );

CREATE POLICY "Service incharges can update jobs in their branch"
  ON jobs FOR UPDATE
  USING (
    shop_id = get_my_shop_id()
    AND (
      service_branch_id = get_my_branch_id() 
      OR delivery_branch_id = get_my_branch_id()
      OR service_branch_id IS NULL
      OR delivery_branch_id IS NULL
    )
    AND get_my_role() = 'service_incharge'
  );

-- Fix 9: Update service incharge customer policies
DROP POLICY IF EXISTS "Service incharges can view customers in their branch" ON customers;

CREATE POLICY "Service incharges can view customers in their branch"
  ON customers FOR SELECT
  USING (
    shop_id = get_my_shop_id()
    AND get_my_role() = 'service_incharge'
    AND (
      branch_id = get_my_branch_id() 
      OR branch_id IS NULL
    )
  );

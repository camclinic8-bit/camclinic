-- Service managers: same shop-wide operational access as super admins (customers, jobs, branches, profile reads).
-- Team administration stays super_admin-only (profiles INSERT/UPDATE policies unchanged).

-- Profiles: shop-wide read for service managers (replaces branch-only read)
DROP POLICY IF EXISTS "Service managers can view profiles in their branch" ON profiles;

CREATE POLICY "Service managers can view all profiles in their shop"
  ON profiles FOR SELECT
  USING (shop_id = get_my_shop_id() AND get_my_role() = 'service_manager');

-- Customers
DROP POLICY IF EXISTS "Service managers can view customers in their branch" ON customers;
DROP POLICY IF EXISTS "Service managers can manage customers in their branch" ON customers;

CREATE POLICY "Service managers can view all customers in their shop"
  ON customers FOR SELECT
  USING (shop_id = get_my_shop_id() AND get_my_role() = 'service_manager');

CREATE POLICY "Service managers can manage customers in their shop"
  ON customers FOR ALL
  USING (shop_id = get_my_shop_id() AND get_my_role() = 'service_manager')
  WITH CHECK (shop_id = get_my_shop_id() AND get_my_role() = 'service_manager');

-- Jobs
DROP POLICY IF EXISTS "Service managers can view all jobs in their branch" ON jobs;
DROP POLICY IF EXISTS "Service managers can manage jobs in their branch" ON jobs;

CREATE POLICY "Service managers can view all jobs in their shop"
  ON jobs FOR SELECT
  USING (shop_id = get_my_shop_id() AND get_my_role() = 'service_manager');

CREATE POLICY "Service managers can manage jobs in their shop"
  ON jobs FOR ALL
  USING (shop_id = get_my_shop_id() AND get_my_role() = 'service_manager')
  WITH CHECK (shop_id = get_my_shop_id() AND get_my_role() = 'service_manager');

-- Branches: allow create/update/delete in shop (SELECT policies already allow SM to list branches)
DROP POLICY IF EXISTS "Super admins can manage branches in their shop" ON branches;

CREATE POLICY "Super admins and service managers can manage branches in their shop"
  ON branches FOR ALL
  USING (
    shop_id = get_my_shop_id()
    AND (is_super_admin() OR get_my_role() = 'service_manager')
  )
  WITH CHECK (
    shop_id = get_my_shop_id()
    AND (is_super_admin() OR get_my_role() = 'service_manager')
  );

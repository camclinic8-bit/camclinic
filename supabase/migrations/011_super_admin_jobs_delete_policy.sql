-- Explicit DELETE for super admins on jobs.
-- Migration 20260331124517 (runs after 010) only added INSERT + UPDATE for super admins,
-- so DELETE was never allowed and .delete() affected 0 rows with no error from PostgREST.

DROP POLICY IF EXISTS "Super admins can delete jobs in their shop" ON jobs;

CREATE POLICY "Super admins can delete jobs in their shop"
  ON jobs FOR DELETE
  USING (shop_id = get_my_shop_id() AND is_super_admin());

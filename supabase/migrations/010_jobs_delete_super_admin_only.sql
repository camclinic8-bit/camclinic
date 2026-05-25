-- Only super admins may DELETE jobs. Service managers and service incharges keep INSERT/UPDATE.

-- Service managers: replace FOR ALL with INSERT + UPDATE only
DROP POLICY IF EXISTS "Service managers can manage jobs in their shop" ON jobs;

CREATE POLICY "Service managers can insert jobs in their shop"
  ON jobs FOR INSERT
  WITH CHECK (shop_id = get_my_shop_id() AND get_my_role() = 'service_manager');

CREATE POLICY "Service managers can update jobs in their shop"
  ON jobs FOR UPDATE
  USING (shop_id = get_my_shop_id() AND get_my_role() = 'service_manager')
  WITH CHECK (shop_id = get_my_shop_id() AND get_my_role() = 'service_manager');

-- Service incharges: replace FOR ALL with INSERT + UPDATE only
DROP POLICY IF EXISTS "Service incharges can manage jobs in their branch" ON jobs;

CREATE POLICY "Service incharges can insert jobs in their branch"
  ON jobs FOR INSERT
  WITH CHECK (
    shop_id = get_my_shop_id()
    AND service_branch_id = get_my_branch_id()
    AND get_my_role() = 'service_incharge'
  );

CREATE POLICY "Service incharges can update jobs in their branch"
  ON jobs FOR UPDATE
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

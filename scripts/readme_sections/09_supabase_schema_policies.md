## 14. Row-Level Security (RLS) Complete SQL Policies

This section lists the exact PostgreSQL RLS policies applied to all database tables to enforce security boundaries.

### 14.1 Shops Table Policies
```sql
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_shop_policy ON shops
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY insert_shop_policy ON shops
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

CREATE POLICY update_shop_policy ON shops
  FOR UPDATE
  TO authenticated
  USING (
    id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

CREATE POLICY delete_shop_policy ON shops
  FOR DELETE
  TO authenticated
  USING (
    id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );
```

### 14.2 Branches Table Policies
```sql
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_branch_policy ON branches
  FOR SELECT
  TO authenticated
  USING (
    shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY insert_branch_policy ON branches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'service_manager')
  );

CREATE POLICY update_branch_policy ON branches
  FOR UPDATE
  TO authenticated
  USING (
    shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'service_manager')
  );

CREATE POLICY delete_branch_policy ON branches
  FOR DELETE
  TO authenticated
  USING (
    shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );
```

### 14.3 Profiles Table Policies
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_profile_policy ON profiles
  FOR SELECT
  TO authenticated
  USING (
    shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY insert_profile_policy ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

CREATE POLICY update_profile_policy ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
    AND (
      id = auth.uid() 
      OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
    )
  );

CREATE POLICY delete_profile_policy ON profiles
  FOR DELETE
  TO authenticated
  USING (
    shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );
```

### 14.4 Customers Table Policies
```sql
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_customer_policy ON customers
  FOR SELECT
  TO authenticated
  USING (
    shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY insert_customer_policy ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'service_manager', 'service_incharge')
  );

CREATE POLICY update_customer_policy ON customers
  FOR UPDATE
  TO authenticated
  USING (
    shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY delete_customer_policy ON customers
  FOR DELETE
  TO authenticated
  USING (
    shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );
```

### 14.5 Jobs Table Policies
```sql
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_jobs_policy ON jobs
  FOR SELECT
  TO authenticated
  USING (
    shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
    AND (
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'service_manager')
      OR (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'service_incharge'
        AND (service_branch_id = (SELECT branch_id FROM profiles WHERE id = auth.uid())
             OR delivery_branch_id = (SELECT branch_id FROM profiles WHERE id = auth.uid()))
      )
      OR (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'technician'
        AND assigned_technician_id = auth.uid()
      )
    )
  );

CREATE POLICY insert_jobs_policy ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'service_manager', 'service_incharge')
  );

CREATE POLICY update_jobs_policy ON jobs
  FOR UPDATE
  TO authenticated
  USING (
    shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
    AND (
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'service_manager')
      OR (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'service_incharge'
        AND (service_branch_id = (SELECT branch_id FROM profiles WHERE id = auth.uid())
             OR delivery_branch_id = (SELECT branch_id FROM profiles WHERE id = auth.uid()))
      )
      OR (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'technician'
        AND assigned_technician_id = auth.uid()
      )
    )
  );

CREATE POLICY delete_jobs_policy ON jobs
  FOR DELETE
  TO authenticated
  USING (
    shop_id = (SELECT shop_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );
```

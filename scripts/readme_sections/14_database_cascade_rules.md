## 19. Database Constraints, Cascades, & Audit Triggers

This section documents the database integrity layers, describing how deletion cascades, primary keys, check constraints, and historical audit triggers prevent orphan data and keep the system consistent.

---

### 19.1 Deletion Cascades & Nullification Rules

To prevent foreign key constraint violations and orphaned records, the database defines cascade rules:

1. **`shops` Deletion**:
   - Deleting a shop triggers `ON DELETE CASCADE` across all child tables.
   - All linked records in `branches`, `profiles`, `customers`, and `jobs` are automatically deleted.
   - This prevents orphan tenant records in a multi-tenant environment.

2. **`branches` Deletion**:
   - Deleting a branch triggers `ON DELETE CASCADE` on:
     - `profiles` (if branch-bound)
     - `jobs` (where the branch is the service or delivery center).
   - This ensures branch-scoped data is cleaned up if a branch is removed.

3. **`profiles` Deletion**:
   - Profiles are linked to jobs as `assigned_incharge_id` or `assigned_technician_id`.
   - On profile deletion, the fields are set to null (`ON DELETE SET NULL`) on the job card, preserving the job history while clearing the assignment.
   - Deleting a profile triggers `ON DELETE CASCADE` on `job_status_history` and `payment_transactions` to clear logs related to the user.

4. **`customers` Deletion**:
   - Customers cannot be deleted if they have active jobs associated with them (`ON DELETE RESTRICT` constraint on `jobs.customer_id`).
   - This prevents managers from deleting customer contacts while active repairs or unpaid balances remain.

5. **`jobs` Deletion**:
   - Deleting a job triggers `ON DELETE CASCADE` on:
     - `job_products`
     - `product_accessories`
     - `product_other_parts`
     - `spare_parts`
     - `payment_transactions`
     - `job_status_history`
   - Job deletion is restricted to **Super Admins** to prevent data loss.

---

### 19.2 Database Integrity Check Constraints

Check constraints ensure that numeric and status values remain within valid ranges:

1. **Positive Pricing Check (`chk_positive_prices`)**:
   - Enforced on `jobs.inspection_fee`, `jobs.service_charges`, `jobs.spare_parts_total_cost`, `jobs.total_charges`, and `jobs.grand_total`:
     ```sql
     CONSTRAINT chk_positive_inspection_fee CHECK (inspection_fee >= 0.00);
     CONSTRAINT chk_positive_service_charges CHECK (service_charges >= 0.00);
     CONSTRAINT chk_positive_grand_total CHECK (grand_total >= 0.00);
     ```
   - Prevents accidental negative inputs in labor, diagnostics, or parts fields.

2. **Non-Negative Advance Payments (`chk_positive_advance`)**:
   - Enforced on `jobs.advance_paid`:
     ```sql
     CONSTRAINT chk_positive_advance CHECK (advance_paid >= 0.00);
     ```

3. **Spare Parts Price Ranges (`chk_parts_pricing`)**:
   - Enforced on `spare_parts.quantity` and `spare_parts.unit_price`:
     ```sql
     CONSTRAINT chk_min_qty CHECK (quantity >= 1);
     CONSTRAINT chk_min_price CHECK (unit_price >= 0.00);
     ```
   - Prevents inserting parts with zero or negative quantities.

4. **Positive Payment Amounts (`chk_payment_amount`)**:
   - Enforced on `payment_transactions.amount`:
     ```sql
     CONSTRAINT chk_min_payment CHECK (amount > 0.00);
     ```
   - Prevents logging zero or negative payments.

---

### 19.3 Automated Change Auditing Triggers

To maintain a reliable audit trail, the database uses trigger functions to log state changes.

#### 19.3.1 `profiles` Synchronization Trigger
When a user signs up via Supabase Auth, a trigger copies the email and user metadata into the `public.profiles` table:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, shop_id, branch_id, email, full_name, role, is_active)
  VALUES (
    new.id,
    '00000000-0000-0000-0000-000000000000', -- Default temporary shop ID
    NULL,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New Employee'),
    'technician',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 19.3.2 Status Transition Validation Trigger
Prevents invalid status transitions (e.g. transitioning directly from `new` to `completed` without diagnostics/inspections):
```sql
CREATE OR REPLACE FUNCTION validate_status_transition_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Super Admins and Service Managers can bypass validations
  IF (SELECT role FROM profiles WHERE id = auth.uid()) IN ('super_admin', 'service_manager') THEN
    RETURN NEW;
  END IF;

  -- Enforce transition rules for Service Incharges and Technicians
  IF OLD.status = 'new' AND NEW.status NOT IN ('inspected', 'cancelled') THEN
    RAISE EXCEPTION 'Jobs in "new" status must first be updated to "inspected" or "cancelled".';
  END IF;

  IF OLD.status = 'inspected' AND NEW.status NOT IN ('pending_approval', 'cancelled') THEN
    RAISE EXCEPTION 'Inspected jobs must be updated to "pending_approval" for estimate reviews.';
  END IF;

  IF OLD.status = 'pending_approval' AND NEW.status NOT IN ('quote_sent', 'approved', 'disapproved', 'cancelled') THEN
    RAISE EXCEPTION 'Pending approval jobs must transition to quote_sent, approved, or disapproved.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
---

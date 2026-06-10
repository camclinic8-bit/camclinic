## 3. Database Architecture & Schema Analysis

The database layer of Cam Clinic is built on PostgreSQL 15, hosted and managed via Supabase. It uses a normalized relational model designed for consistency, integrity, and strict access isolation.

```
       +-------------------+
       |       shops       |
       +---------+---------+
                 | 1
                 |
                 | N
       +---------v---------+
       |     branches      |
       +----+----+----+----+
            |    |    |
          1 |  1 |  1 |
            |    |    +------------------------+
          N |  N |                             | N
+-----------v-+  +-v---------+                 +-v---------+
|  profiles   |  | customers |                 |   jobs    |
+-------------+  +----+------+                 +-+---+---+-+
                      |                          |   |   |
                    1 |                        1 | 1 | 1 |
                      |                          |   |   |
                    N |                        N | N | N |
         +------------v-+     +------------------v-+ |   |
         |  contracts / |     |   job_products     | |   |
         |  customer_   |     +--------+-----------+ |   |
         |  history     |              |             |   |
         +--------------+            1 |             |   |
                                       |             |   |
                                     N |             |   |
                          +------------v-+           |   v N
                          | accessories  |           | +-------------+
                          | & other_parts|           | | spare_parts |
                          +--------------+           | +-------------+
                                                     |
                                                   N v
                                            +-------------+
                                            |   payment   |
                                            | transactions|
                                            +-------------+
```

### 3.1 Tables and Schema Definitions

#### 3.1.1 `shops`
Represents the parent business entity (tenant).
- `id` (uuid, primary key): Unique identifier of the tenant.
- `name` (text, not null): Registered business name (e.g. "Supportta Solutions Pvt Ltd").
- `created_at` (timestamp with time zone, default: `now()`): Creation date.
- `updated_at` (timestamp with time zone, default: `now()`): Update date.

#### 3.1.2 `branches`
Physical repair centers belonging to a shop.
- `id` (uuid, primary key): Unique identifier.
- `shop_id` (uuid, foreign key referencing `shops.id` on delete cascade): Parent shop.
- `name` (text, not null): Physical branch name (e.g. "Panaji Camera Center", "Mumbai Service Lab").
- `address` (text, not null): Detailed postal address.
- `phone` (text): Branch primary contact number.
- `email` (text): Branch operational email.
- `landline` (text): Landline number for invoice printing.
- `is_active` (boolean, default: `true`): Branch active state.
- `created_at`/`updated_at` (timestamp with time zone).

#### 3.1.3 `profiles`
User metadata stored inside the `public` schema, mapped to Supabase Auth (`auth.users`) via a trigger.
- `id` (uuid, primary key, references `auth.users.id` on delete cascade): Mapped auth ID.
- `shop_id` (uuid, foreign key referencing `shops.id` on delete cascade): User's organization.
- `branch_id` (uuid, foreign key referencing `branches.id` on delete set null): Assigned home branch.
- `email` (text, not null): Mapped email.
- `full_name` (text, not null): User's name.
- `phone` (text): Contact phone.
- `role` (user_role enum): User permissions level (`super_admin`, `service_manager`, `service_incharge`, `technician`).
- `is_active` (boolean, default: `true`): Active state.
- `created_at`/`updated_at` (timestamp with time zone).

#### 3.1.4 `customers`
Customer registration records.
- `id` (uuid, primary key): Unique identifier.
- `shop_id` (uuid, foreign key referencing `shops.id` on delete cascade): Parent shop context.
- `name` (text, not null): Customer full name or studio name.
- `phone` (text, not null): Customer phone number.
- `email` (text): Customer email.
- `address` (text): Billing/shipping address.
- `alternative_phone` (text): Second contact number.
- `created_at`/`updated_at` (timestamp with time zone).

#### 3.1.5 `jobs`
Represents the service job card, tracking charges, assignments, and statuses.
- `id` (uuid, primary key): Unique identifier.
- `shop_id` (uuid, foreign key referencing `shops.id` on delete cascade).
- `job_number` (text, unique, not null): Auto-generated unique ticket ID (format: `CC-YYYYMMDD-NNNN`).
- `customer_id` (uuid, foreign key referencing `customers.id` on delete restrict).
- `service_branch_id` (uuid, foreign key referencing `branches.id` on delete restrict): Intake branch.
- `delivery_branch_id` (uuid, foreign key referencing `branches.id` on delete restrict): Delivery branch.
- `assigned_incharge_id` (uuid, foreign key referencing `profiles.id` on delete set null).
- `assigned_technician_id` (uuid, foreign key referencing `profiles.id` on delete set null).
- `status` (job_status enum, default: `'new'`): Current step in repair pipeline.
- `priority` (job_priority enum, default: `'medium'`).
- `description` (text): Primary customer description of the problem.
- `technician_notes` (text): Technician's internal notes.
- `cam_clinic_advisory_notes` (text): Print-friendly customer advisory.
- `inspection_fee` (numeric(10,2), default: `0.00`): Flat diagnostic charge.
- `service_charges` (numeric(10,2), default: `0.00`): Cost of labor.
- `spare_parts_total_cost` (numeric(10,2), default: `0.00`): Sum of parts.
- `total_charges` (numeric(10,2), default: `0.00`): Calculated as `inspection_fee + service_charges + spare_parts_total_cost`.
- `gst_enabled` (boolean, default: `true`): True if service charges subject to GST.
- `gst_amount` (numeric(10,2), default: `0.00`): Calculated as `service_charges * 0.18` (if enabled).
- `grand_total` (numeric(10,2), default: `0.00`): Calculated as `total_charges + gst_amount`.
- `advance_paid` (numeric(10,2), default: `0.00`): Advance paid by customer during intake.
- `advance_paid_date` (date): Date of advance.
- `balance_amount` (numeric(10,2), default: `0.00`): Calculated as `grand_total - (advance_paid + final_payments)`.
- `estimate_delivery_date` (date): Promised return date.
- `service_date` (timestamp with time zone): Date repair completed.
- `alternative_contact` (text): Alternative contact details.
- `created_by` (uuid, foreign key referencing `profiles.id`).
- `created_at`/`updated_at` (timestamp with time zone).

#### 3.1.6 `job_products`
Individual camera gear items included in a single service job card.
- `id` (uuid, primary key).
- `job_id` (uuid, foreign key referencing `jobs.id` on delete cascade).
- `brand` (text, not null): e.g. "Sony".
- `model` (text, not null): e.g. "Alpha 7 IV".
- `serial_number` (text, not null): Unique gear serial.
- `condition` (product_condition[]): Array of cosmetic conditions (`good`, `dusty`, `scratches`, `damage`, `not_working`, `dead`, `liquid_damage`).
- `description` (text): Specific complaints for this product.
- `remarks` (text): Specific notes.
- `has_warranty` (boolean, default: `false`).
- `warranty_description` (text).
- `warranty_expiry_date` (date).
- `repeat_job_number` (text): If repeat repair, prior ticket number.
- `other_job_number` (text): External repair shop tracking reference.
- `warranty_images` (text[]): Paths to uploaded warranty receipts.
- `product_images` (text[]): Paths to photos of the equipment cosmetic state during intake.

#### 3.1.7 `product_accessories`
Accessories brought alongside the product.
- `id` (uuid, primary key).
- `job_product_id` (uuid, foreign key referencing `job_products.id` on delete cascade).
- `name` (text, not null): e.g. "Sony NP-FZ100 battery", "Lens hood".

#### 3.1.8 `product_other_parts`
Other miscellaneous components.
- `id` (uuid, primary key).
- `job_product_id` (uuid, foreign key referencing `job_products.id` on delete cascade).
- `name` (text, not null).

#### 3.1.9 `spare_parts`
Spare parts requested/used during repair.
- `id` (uuid, primary key).
- `job_id` (uuid, foreign key referencing `jobs.id` on delete cascade).
- `name` (text, not null): e.g. "Shutter Unit (OEM)".
- `quantity` (integer, default: `1`).
- `unit_price` (numeric(10,2), default: `0.00`).
- `total_price` (numeric(10,2), default: `0.00`): Computed automatically.
- `hsn_code` (text): HSN code for GST compliance.

#### 3.1.10 `payment_transactions`
Ledger tracking customer payments.
- `id` (uuid, primary key).
- `job_id` (uuid, foreign key referencing `jobs.id` on delete cascade).
- `amount` (numeric(10,2), not null).
- `payment_date` (timestamp with time zone, default: `now()`).
- `payment_method` (text, default: `'cash'`): Cash, UPI, Card, NetBanking.
- `notes` (text).
- `created_by` (uuid, foreign key referencing `profiles.id`).

#### 3.1.11 `job_status_history`
Audit logs tracking job state changes.
- `id` (uuid, primary key).
- `job_id` (uuid, foreign key referencing `jobs.id` on delete cascade).
- `from_status` (job_status).
- `to_status` (job_status, not null).
- `changed_by` (uuid, foreign key referencing `profiles.id`).
- `notes` (text).
- `created_at` (timestamp with time zone, default: `now()`).

---

### 3.2 SQL Triggers and RPC Functions

#### 3.2.1 Automatically Recalculate Job Balances
A database trigger executes on updates/inserts to `jobs`, `spare_parts`, or `payment_transactions`. It aggregates parts and payments to guarantee that financial fields match:
- `total_charges = inspection_fee + service_charges + sum(spare_parts.total_price)`
- `gst_amount = if (gst_enabled) then (service_charges * 0.18) else 0.00`
- `grand_total = total_charges + gst_amount`
- `balance_amount = grand_total - advance_paid - sum(payment_transactions.amount)`

#### 3.2.2 Transaction-Safe Job Creation (`create_job_with_products`)
To prevent partial writes where a job is created but its associated products or accessories fail to insert, the database exposes a PL/pgSQL function:
```sql
CREATE OR REPLACE FUNCTION create_job_with_products(
  p_shop_id UUID,
  p_customer_id UUID,
  p_service_branch_id UUID,
  p_delivery_branch_id UUID,
  p_created_by UUID,
  p_assigned_incharge_id UUID,
  p_assigned_technician_id UUID,
  p_priority JOB_PRIORITY,
  p_description TEXT,
  p_inspection_fee NUMERIC,
  p_advance_paid NUMERIC,
  p_advance_paid_date TEXT,
  p_estimate_delivery_date TEXT,
  p_spare_parts_total_cost NUMERIC,
  p_spare_parts_private_details JSONB,
  p_products JSONB,
  p_alternative_contact TEXT
) RETURNS JSONB AS $$
DECLARE
  v_job_id UUID;
  v_job_number TEXT;
  v_product RECORD;
  v_prod_id UUID;
  v_acc TEXT;
  v_part TEXT;
BEGIN
  -- 1. Generate job number atomically
  v_job_number := get_next_job_number(p_shop_id, p_service_branch_id);
  
  -- 2. Insert the Job
  INSERT INTO jobs (
    shop_id, job_number, customer_id, service_branch_id, delivery_branch_id,
    assigned_incharge_id, assigned_technician_id, priority, description,
    inspection_fee, advance_paid, advance_paid_date, estimate_delivery_date,
    spare_parts_total_cost, alternative_contact, created_by, status
  ) VALUES (
    p_shop_id, v_job_number, p_customer_id, p_service_branch_id, p_delivery_branch_id,
    p_assigned_incharge_id, p_assigned_technician_id, p_priority, p_description,
    p_inspection_fee, p_advance_paid, p_advance_paid_date::DATE, p_estimate_delivery_date::DATE,
    p_spare_parts_total_cost, p_alternative_contact, p_created_by, 'new'
  ) RETURNING id INTO v_job_id;

  -- 3. Loop through products json array and insert
  FOR v_product IN SELECT * FROM jsonb_to_recordset(p_products) AS x(
    brand TEXT, model TEXT, serial_number TEXT, condition PRODUCT_CONDITION[],
    description TEXT, remarks TEXT, has_warranty BOOLEAN, warranty_description TEXT,
    warranty_expiry_date TEXT, repeat_job_number TEXT, other_job_number TEXT,
    accessories TEXT[], other_parts TEXT[], warranty_images TEXT[], product_images TEXT[]
  ) LOOP
    
    INSERT INTO job_products (
      job_id, brand, model, serial_number, condition, description, remarks,
      has_warranty, warranty_description, warranty_expiry_date,
      repeat_job_number, other_job_number, warranty_images, product_images
    ) VALUES (
      v_job_id, v_product.brand, v_product.model, v_product.serial_number, v_product.condition,
      v_product.description, v_product.remarks, v_product.has_warranty,
      v_product.warranty_description, v_product.warranty_expiry_date::DATE,
      v_product.repeat_job_number, v_product.other_job_number,
      coalesce(v_product.warranty_images, '{}'), coalesce(v_product.product_images, '{}')
    ) RETURNING id INTO v_prod_id;

    -- Insert accessories
    IF v_product.accessories IS NOT NULL THEN
      FOREACH v_acc IN ARRAY v_product.accessories LOOP
        INSERT INTO product_accessories (job_product_id, name) VALUES (v_prod_id, v_acc);
      END LOOP;
    END IF;

    -- Insert other parts
    IF v_product.other_parts IS NOT NULL THEN
      FOREACH v_part IN ARRAY v_product.other_parts LOOP
        INSERT INTO product_other_parts (job_product_id, name) VALUES (v_prod_id, v_part);
      END LOOP;
    END IF;

  END LOOP;

  -- 4. Log initial history
  INSERT INTO job_status_history (job_id, from_status, to_status, changed_by, notes)
  VALUES (v_job_id, NULL, 'new', p_created_by, 'Job created');

  RETURN jsonb_build_object('id', v_job_id, 'job_number', v_job_number);
END;
$$ LANGUAGE plpgsql;
```

---

### 3.3 Row-Level Security (RLS) Policy Specifications

To comply with tenant isolation (Multi-Shop) and role-based data visibility constraints (multi-branch access), every table has RLS policies:

1. **`shops`**:
   - `SELECT`: Allowed only if the user is authenticated and belongs to the shop (`auth.uid() -> profiles.shop_id`).
   - `INSERT`/`UPDATE`/`DELETE`: Restricted to super admins.
2. **`branches`**:
   - `SELECT`: Authenticated users belonging to the same shop.
   - `INSERT`/`UPDATE`/`DELETE`: Super Admins of that shop.
3. **`profiles`**:
   - `SELECT`: Users within the same shop.
   - `UPDATE`: Self update (or Super Admin of the same shop).
4. **`jobs`**:
   - `SELECT`:
     - Super Admins and Service Managers: Access all jobs in their shop.
     - Service Incharges: Access jobs where service or delivery branch matches their branch assignment.
     - Technicians: Access only jobs assigned to them.
   - `INSERT`: Super Admins, Service Managers, and Service Incharges.
   - `UPDATE`: Same as SELECT, but restricted for Technicians (can only update status, technician notes, and assigned check fields).
   - `DELETE`: Restricted to **Super Admins only** (using specific cascade handling to log delete actions safely).
5. **`job_products` / `spare_parts` / `product_accessories`**:
   - Access policies cascade directly from their parent `jobs` records.

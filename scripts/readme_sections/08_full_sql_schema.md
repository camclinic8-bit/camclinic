## 13. Database Schema SQL Definitions

This section lists the exact DDL statements, schemas, column constraints, triggers, and RPC procedures used to initialize and manage the Cam Clinic database.

### 13.1 Database Initialization SQL DDL

```sql
-- 1. Create custom Enumeration types
CREATE TYPE user_role AS ENUM ('super_admin', 'service_manager', 'service_incharge', 'technician');

CREATE TYPE job_priority AS ENUM ('immediate', 'high', 'medium', 'low');

CREATE TYPE product_condition AS ENUM ('good', 'dusty', 'scratches', 'damage', 'not_working', 'dead', 'liquid_damage');

CREATE TYPE job_status AS ENUM (
  'new', 'inspected', 'pending_approval', 'quote_sent', 'approved', 
  'disapproved', 'spare_parts_pending', 'in_progress', 'completed', 'cancelled'
);

-- 2. Shops Table
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Branches Table
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  landline VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Profiles Table (user metadata synchronized with Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role user_role NOT NULL DEFAULT 'technician',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT fk_user_id FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 5. Customers Table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  alternative_phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Jobs Table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  job_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  service_branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  delivery_branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  assigned_incharge_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_technician_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status job_status NOT NULL DEFAULT 'new',
  priority job_priority NOT NULL DEFAULT 'medium',
  description TEXT,
  technician_notes TEXT,
  cam_clinic_advisory_notes TEXT,
  alternative_contact TEXT,
  inspection_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  service_charges NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  spare_parts_total_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_charges NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  gst_enabled BOOLEAN NOT NULL DEFAULT true,
  gst_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  advance_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  advance_paid_date DATE,
  balance_amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  estimate_delivery_date DATE,
  service_date TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Job Products Table
CREATE TABLE job_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(255) NOT NULL,
  serial_number VARCHAR(100) NOT NULL,
  condition product_condition[] NOT NULL,
  description TEXT,
  remarks TEXT,
  has_warranty BOOLEAN NOT NULL DEFAULT false,
  warranty_description TEXT,
  warranty_expiry_date DATE,
  repeat_job_number VARCHAR(50),
  other_job_number VARCHAR(50),
  warranty_images TEXT[] DEFAULT '{}',
  product_images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Product Accessories Table
CREATE TABLE product_accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_product_id UUID NOT NULL REFERENCES job_products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL
);

-- 9. Product Other Parts Table
CREATE TABLE product_other_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_product_id UUID NOT NULL REFERENCES job_products(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL
);

-- 10. Spare Parts Table
CREATE TABLE spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_price NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  hsn_code VARCHAR(20)
);

-- 11. Payment Transactions Table
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT now(),
  payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Job Status History Table
CREATE TABLE job_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  from_status job_status,
  to_status job_status NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 13.2 Database Indexes for Performance

```sql
-- Speed up queries by branch and search fields
CREATE INDEX idx_jobs_shop_id ON jobs(shop_id);
CREATE INDEX idx_jobs_service_branch_id ON jobs(service_branch_id);
CREATE INDEX idx_jobs_delivery_branch_id ON jobs(delivery_branch_id);
CREATE INDEX idx_jobs_assigned_technician_id ON jobs(assigned_technician_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_job_number ON jobs(job_number);

-- Speed up customer listings and profiles search
CREATE INDEX idx_customers_shop_id ON customers(shop_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_profiles_shop_id ON profiles(shop_id);

-- Speed up product joins and accessories cascading
CREATE INDEX idx_job_products_job_id ON job_products(job_id);
CREATE INDEX idx_product_accessories_product_id ON product_accessories(job_product_id);
CREATE INDEX idx_product_other_parts_product_id ON product_other_parts(job_product_id);
CREATE INDEX idx_spare_parts_job_id ON spare_parts(job_id);
CREATE INDEX idx_payment_transactions_job_id ON payment_transactions(job_id);
CREATE INDEX idx_job_status_history_job_id ON job_status_history(job_id);
```

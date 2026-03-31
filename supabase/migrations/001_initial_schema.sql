-- Cam Clinic Database Schema
-- Migration: 001_initial_schema.sql

-- ENUMS
CREATE TYPE user_role AS ENUM ('super_admin', 'service_manager', 'service_incharge', 'technician');
CREATE TYPE job_status AS ENUM ('new', 'inspected', 'pending_approval', 'quote_sent', 'approved', 'disapproved', 'spare_parts_pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE job_priority AS ENUM ('immediate', 'high', 'medium', 'low');
CREATE TYPE product_condition AS ENUM ('good', 'dusty', 'scratches', 'damage', 'not_working', 'dead');

-- SHOPS (multi-tenant ready)
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BRANCHES
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id),
  branch_id UUID REFERENCES branches(id),
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'technician',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CUSTOMERS
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- JOBS
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  job_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  service_branch_id UUID REFERENCES branches(id),
  delivery_branch_id UUID REFERENCES branches(id),
  assigned_incharge_id UUID REFERENCES profiles(id),
  assigned_technician_id UUID REFERENCES profiles(id),
  status job_status NOT NULL DEFAULT 'new',
  priority job_priority NOT NULL DEFAULT 'medium',
  description TEXT,
  technician_notes TEXT,
  cam_clinic_advisory_notes TEXT,
  inspection_fee NUMERIC(10,2) DEFAULT 0,
  service_charges NUMERIC(10,2) DEFAULT 0,
  advance_paid NUMERIC(10,2) DEFAULT 0,
  advance_paid_date DATE,
  gst_enabled BOOLEAN DEFAULT FALSE,
  gst_amount NUMERIC(10,2) DEFAULT 0,
  total_charges NUMERIC(10,2) DEFAULT 0,
  grand_total NUMERIC(10,2) DEFAULT 0,
  balance_amount NUMERIC(10,2) DEFAULT 0,
  estimate_delivery_date DATE,
  service_date TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- JOB PRODUCTS (multiple products per job)
CREATE TABLE job_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  condition product_condition,
  description TEXT,
  remarks TEXT,
  has_warranty BOOLEAN DEFAULT FALSE,
  warranty_description TEXT,
  warranty_expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCT ACCESSORIES
CREATE TABLE product_accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_product_id UUID REFERENCES job_products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCT OTHER PARTS
CREATE TABLE product_other_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_product_id UUID REFERENCES job_products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SPARE PARTS LINE ITEMS
CREATE TABLE spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- JOB STATUS HISTORY
CREATE TABLE job_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  from_status job_status,
  to_status job_status NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- JOB DOCUMENTS
CREATE TABLE job_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- receipt | quote | invoice
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES profiles(id)
);

-- INDEXES for performance
CREATE INDEX idx_jobs_shop_id ON jobs(shop_id);
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_priority ON jobs(priority);
CREATE INDEX idx_jobs_service_branch_id ON jobs(service_branch_id);
CREATE INDEX idx_jobs_delivery_branch_id ON jobs(delivery_branch_id);
CREATE INDEX idx_jobs_assigned_technician_id ON jobs(assigned_technician_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_job_products_job_id ON job_products(job_id);
CREATE INDEX idx_spare_parts_job_id ON spare_parts(job_id);
CREATE INDEX idx_job_status_history_job_id ON job_status_history(job_id);
CREATE INDEX idx_customers_shop_id ON customers(shop_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_profiles_shop_id ON profiles(shop_id);
CREATE INDEX idx_profiles_branch_id ON profiles(branch_id);
CREATE INDEX idx_branches_shop_id ON branches(shop_id);

-- FUNCTION: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS: Auto-update updated_at
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_products_updated_at BEFORE UPDATE ON job_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spare_parts_updated_at BEFORE UPDATE ON spare_parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- FUNCTION: Calculate job totals
CREATE OR REPLACE FUNCTION calculate_job_totals()
RETURNS TRIGGER AS $$
DECLARE
  spare_parts_sum NUMERIC(10,2);
BEGIN
  -- Calculate spare parts total
  SELECT COALESCE(SUM(total_price), 0) INTO spare_parts_sum
  FROM spare_parts WHERE job_id = NEW.id;
  
  -- Calculate total charges
  NEW.total_charges = COALESCE(NEW.inspection_fee, 0) + COALESCE(NEW.service_charges, 0) + spare_parts_sum;
  
  -- Calculate GST if enabled (18% on service charges only)
  IF NEW.gst_enabled THEN
    NEW.gst_amount = COALESCE(NEW.service_charges, 0) * 0.18;
  ELSE
    NEW.gst_amount = 0;
  END IF;
  
  -- Calculate grand total
  NEW.grand_total = NEW.total_charges + NEW.gst_amount;
  
  -- Calculate balance
  NEW.balance_amount = NEW.grand_total - COALESCE(NEW.advance_paid, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_job_totals_trigger
BEFORE INSERT OR UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION calculate_job_totals();

-- FUNCTION: Generate next job number for a date
CREATE OR REPLACE FUNCTION get_next_job_number(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT AS $$
DECLARE
  date_str TEXT;
  next_seq INT;
  job_num TEXT;
BEGIN
  date_str := TO_CHAR(p_date, 'YYYYMMDD');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(job_number FROM 13 FOR 4) AS INT)
  ), 0) + 1 INTO next_seq
  FROM jobs
  WHERE job_number LIKE 'CC-' || date_str || '-%';
  
  job_num := 'CC-' || date_str || '-' || LPAD(next_seq::TEXT, 4, '0');
  
  RETURN job_num;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'technician'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail user creation
  RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

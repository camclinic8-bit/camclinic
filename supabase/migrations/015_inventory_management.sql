-- Migration: Inventory Management Module
-- This migration creates tables for managing accessories, brands, and models

-- Accessories Table
CREATE TABLE IF NOT EXISTS accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brands Table
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Models Table (linked to brands)
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, name)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accessories_name ON accessories(name);
CREATE INDEX IF NOT EXISTS idx_accessories_active ON accessories(is_active);
CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active);
CREATE INDEX IF NOT EXISTS idx_models_brand_id ON models(brand_id);
CREATE INDEX IF NOT EXISTS idx_models_active ON models(is_active);

-- Enable Row Level Security
ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Accessories
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Accessories: Allow read for authenticated users" ON accessories;
DROP POLICY IF EXISTS "Accessories: Allow insert for admins" ON accessories;
DROP POLICY IF EXISTS "Accessories: Allow update for admins" ON accessories;
DROP POLICY IF EXISTS "Accessories: Allow delete for super_admin" ON accessories;

-- Allow all authenticated users to read accessories
CREATE POLICY "Accessories: Allow read for authenticated users"
  ON accessories FOR SELECT
  TO authenticated
  USING (true);

-- Allow super_admin and service_manager to insert accessories
CREATE POLICY "Accessories: Allow insert for admins"
  ON accessories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'service_manager')
    )
  );

-- Allow super_admin and service_manager to update accessories
CREATE POLICY "Accessories: Allow update for admins"
  ON accessories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'service_manager')
    )
  );

-- Allow super_admin to delete accessories
CREATE POLICY "Accessories: Allow delete for super_admin"
  ON accessories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- RLS Policies for Brands
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Brands: Allow read for authenticated users" ON brands;
DROP POLICY IF EXISTS "Brands: Allow insert for admins" ON brands;
DROP POLICY IF EXISTS "Brands: Allow update for admins" ON brands;
DROP POLICY IF EXISTS "Brands: Allow delete for super_admin" ON brands;

-- Allow all authenticated users to read brands
CREATE POLICY "Brands: Allow read for authenticated users"
  ON brands FOR SELECT
  TO authenticated
  USING (true);

-- Allow super_admin and service_manager to insert brands
CREATE POLICY "Brands: Allow insert for admins"
  ON brands FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'service_manager')
    )
  );

-- Allow super_admin and service_manager to update brands
CREATE POLICY "Brands: Allow update for admins"
  ON brands FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'service_manager')
    )
  );

-- Allow super_admin to delete brands
CREATE POLICY "Brands: Allow delete for super_admin"
  ON brands FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- RLS Policies for Models
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Models: Allow read for authenticated users" ON models;
DROP POLICY IF EXISTS "Models: Allow insert for admins" ON models;
DROP POLICY IF EXISTS "Models: Allow update for admins" ON models;
DROP POLICY IF EXISTS "Models: Allow delete for super_admin" ON models;

-- Allow all authenticated users to read models
CREATE POLICY "Models: Allow read for authenticated users"
  ON models FOR SELECT
  TO authenticated
  USING (true);

-- Allow super_admin and service_manager to insert models
CREATE POLICY "Models: Allow insert for admins"
  ON models FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'service_manager')
    )
  );

-- Allow super_admin and service_manager to update models
CREATE POLICY "Models: Allow update for admins"
  ON models FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'service_manager')
    )
  );

-- Allow super_admin to delete models
CREATE POLICY "Models: Allow delete for super_admin"
  ON models FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Updated_at trigger function (reuse existing if available)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_accessories_updated_at ON accessories;
CREATE TRIGGER update_accessories_updated_at
  BEFORE UPDATE ON accessories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_brands_updated_at ON brands;
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_models_updated_at ON models;
CREATE TRIGGER update_models_updated_at
  BEFORE UPDATE ON models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

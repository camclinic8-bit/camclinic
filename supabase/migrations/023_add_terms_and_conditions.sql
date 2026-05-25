-- Migration: Add terms_and_conditions table
-- This allows admins to manage terms and conditions that appear in PDFs

CREATE TABLE IF NOT EXISTS terms_and_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_terms_and_conditions_shop_id ON terms_and_conditions(shop_id);
CREATE INDEX IF NOT EXISTS idx_terms_and_conditions_is_active ON terms_and_conditions(is_active);

-- Row Level Security
ALTER TABLE terms_and_conditions ENABLE ROW LEVEL SECURITY;

-- Only super_admins and service_managers can view terms and conditions
CREATE POLICY "Admins can view terms and conditions"
  ON terms_and_conditions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'service_manager')
    )
  );

-- Only super_admins and service_managers can insert terms and conditions
CREATE POLICY "Admins can insert terms and conditions"
  ON terms_and_conditions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'service_manager')
    )
  );

-- Only super_admins and service_managers can update terms and conditions
CREATE POLICY "Admins can update terms and conditions"
  ON terms_and_conditions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'service_manager')
    )
  );

-- Only super_admins can delete terms and conditions
CREATE POLICY "Super admins can delete terms and conditions"
  ON terms_and_conditions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Comment
COMMENT ON TABLE terms_and_conditions IS 'Terms and conditions that appear in receipts, invoices, and other PDFs';
COMMENT ON COLUMN terms_and_conditions.title IS 'Title of the terms and conditions';
COMMENT ON COLUMN terms_and_conditions.content IS 'Full content of the terms and conditions (supports multiline text)';
COMMENT ON COLUMN terms_and_conditions.is_active IS 'Whether this terms and conditions is currently active';

-- Insert default terms and conditions for all existing shops
INSERT INTO terms_and_conditions (shop_id, title, content, is_active, created_by)
SELECT 
  id as shop_id,
  'Terms and Conditions' as title,
  '1. All items are accepted for service with the understanding that the customer is the rightful owner.
2. The company is not responsible for any data loss or damage to memory cards, batteries, or accessories.
3. Estimates provided are approximate and final charges may vary based on actual work required.
4. Goods not collected within 30 days of completion may be disposed of without further notice.
5. Payment is required upon collection of goods unless prior credit arrangements have been made.
6. The company reserves the right to refuse service at its discretion.
7. Warranty claims must be accompanied by the original job receipt and warranty card.
8. The company is not liable for any consequential damages arising from the service or repair.' as content,
  true as is_active,
  (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1) as created_by
FROM shops
ON CONFLICT DO NOTHING;

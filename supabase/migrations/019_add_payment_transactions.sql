-- Migration: Add payment_transactions table to track individual payment records
-- This allows tracking payment history with timestamps for each transaction

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_method VARCHAR(50) DEFAULT 'cash',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure amount is positive
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Index for faster queries by job
CREATE INDEX IF NOT EXISTS idx_payment_transactions_job_id ON payment_transactions(job_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(payment_date DESC);

-- Row Level Security
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view payment transactions for jobs they have access to
CREATE POLICY "Users can view payment transactions"
  ON payment_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = payment_transactions.job_id
      AND (
        -- Service managers and super admins see all
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('super_admin', 'service_manager')
        )
        -- Service incharges see jobs in their branch
        OR (
          EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'service_incharge'
          )
          AND (
            jobs.service_branch_id = (SELECT branch_id FROM profiles WHERE id = auth.uid())
            OR jobs.delivery_branch_id = (SELECT branch_id FROM profiles WHERE id = auth.uid())
          )
        )
        -- Technicians see only their assigned jobs
        OR (
          jobs.assigned_technician_id = auth.uid()
        )
      )
    )
  );

-- Only authenticated users can insert payment transactions
CREATE POLICY "Authenticated users can insert payment transactions"
  ON payment_transactions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Comment
COMMENT ON TABLE payment_transactions IS 'Tracks individual payment transactions for jobs with timestamps';
COMMENT ON COLUMN payment_transactions.amount IS 'Payment amount (must be positive)';
COMMENT ON COLUMN payment_transactions.payment_date IS 'Date and time when payment was recorded';
COMMENT ON COLUMN payment_transactions.payment_method IS 'Payment method (cash, card, UPI, etc.)';
COMMENT ON COLUMN payment_transactions.notes IS 'Optional notes about the payment';

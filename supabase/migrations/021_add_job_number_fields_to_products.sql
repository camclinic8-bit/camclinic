-- Migration: Add repeat job number and other job number fields to job_products
-- These fields allow tracking related job numbers for each product

ALTER TABLE job_products
ADD COLUMN IF NOT EXISTS repeat_job_number TEXT,
ADD COLUMN IF NOT EXISTS other_job_number TEXT;

-- Add comments
COMMENT ON COLUMN job_products.repeat_job_number IS 'Repeat job number for this product';
COMMENT ON COLUMN job_products.other_job_number IS 'Other related job number for this product';

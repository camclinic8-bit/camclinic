-- Migration: Add Spare Parts Total Cost to Jobs
-- This migration adds a field to track the total cost of spare parts for office use only
-- This is NOT shown to customers in bills

-- Add spare_parts_total_cost column to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS spare_parts_total_cost NUMERIC DEFAULT 0;

-- Add comment to document the purpose
COMMENT ON COLUMN jobs.spare_parts_total_cost IS 'Total cost of spare parts for office use only. Not shown in customer bills.';

-- Migration: 026_add_alternative_phone_to_customers.sql
-- Purpose: Add alternative_phone column to customers table for backup contact options

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS alternative_phone TEXT DEFAULT NULL;

COMMENT ON COLUMN customers.alternative_phone IS 'Alternative contact or backup phone number for the customer';

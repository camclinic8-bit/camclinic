-- Migration: 032_delete_orders_customers_staff.sql
-- Description: Deletes all jobs (orders), customers, and staff users (except super_admins).

-- 1. Delete all jobs (orders).
-- This will automatically cascade delete records in:
--   - public.job_products
--   - public.product_accessories
--   - public.product_other_parts
--   - public.spare_parts
--   - public.job_status_history
--   - public.job_documents
--   - public.payment_transactions
DELETE FROM public.jobs;

-- 2. Delete all customers.
DELETE FROM public.customers;

-- 3. Delete all staff auth users and their profiles, preserving only super_admins.
-- This deletes the authentication records, which cascades to delete the profiles.
DELETE FROM auth.users
WHERE id NOT IN (
  SELECT id FROM public.profiles
  WHERE role = 'super_admin'
);

-- 4. Clean up any remaining non-admin profiles (fallback)
DELETE FROM public.profiles
WHERE role != 'super_admin';

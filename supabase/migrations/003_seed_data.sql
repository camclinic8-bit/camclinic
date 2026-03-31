-- Cam Clinic Seed Data
-- Migration: 003_seed_data.sql
-- This file contains sample data for development/testing

-- Note: In production, you would create the shop and first super_admin user
-- through the application's onboarding flow.

-- Sample shop (for development)
-- INSERT INTO shops (id, name) VALUES 
--   ('00000000-0000-0000-0000-000000000001', 'Demo Camera Shop');

-- Sample branches (for development)
-- INSERT INTO branches (id, shop_id, name, address, phone) VALUES
--   ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Main Branch', '123 Main Street, City', '+91 9876543210'),
--   ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Downtown Branch', '456 Downtown Ave, City', '+91 9876543211');

-- Note: Profiles are created automatically when users sign up via the handle_new_user trigger.
-- To make a user a super_admin, update their profile after signup:
-- UPDATE profiles SET role = 'super_admin', shop_id = 'your-shop-id' WHERE id = 'user-id';

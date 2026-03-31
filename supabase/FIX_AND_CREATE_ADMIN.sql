-- ============================================
-- CAM CLINIC: FIX TRIGGER AND CREATE ADMIN
-- Run this in Supabase Dashboard SQL Editor
-- https://supabase.com/dashboard/project/ddtrzryqobmurqlgclxd/sql/new
-- ============================================

-- STEP 1: Fix the handle_new_user trigger
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
  -- Don't block user creation if profile insert fails
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- STEP 2: Create admin user directly in auth.users
-- Note: This creates the user with email camclinic8@gmail.com and password admin123

-- First, check if user already exists and delete if needed
DELETE FROM auth.users WHERE email = 'camclinic8@gmail.com';

-- Insert the admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'camclinic8@gmail.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Cam Clinic Admin"}',
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
);

-- STEP 3: Get the user ID and update profile
DO $$
DECLARE
  v_user_id UUID;
  v_shop_id UUID;
  v_branch_id UUID;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'camclinic8@gmail.com';
  
  -- Get shop ID
  SELECT id INTO v_shop_id FROM shops LIMIT 1;
  
  -- Get branch ID
  SELECT id INTO v_branch_id FROM branches LIMIT 1;
  
  -- Update or insert profile
  INSERT INTO profiles (id, shop_id, branch_id, full_name, role, is_active)
  VALUES (v_user_id, v_shop_id, v_branch_id, 'Cam Clinic Admin', 'super_admin', true)
  ON CONFLICT (id) DO UPDATE SET
    shop_id = EXCLUDED.shop_id,
    branch_id = EXCLUDED.branch_id,
    full_name = EXCLUDED.full_name,
    role = 'super_admin',
    is_active = true;
    
  RAISE NOTICE 'Admin user created with ID: %', v_user_id;
END $$;

-- Verify the setup
SELECT 
  u.id,
  u.email,
  p.full_name,
  p.role,
  s.name as shop_name,
  b.name as branch_name
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN shops s ON s.id = p.shop_id
LEFT JOIN branches b ON b.id = p.branch_id
WHERE u.email = 'camclinic8@gmail.com';

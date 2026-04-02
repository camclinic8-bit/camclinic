-- Check for issues with the 004 migration
-- Run this in Supabase SQL Editor

-- 1. Check if columns exist in profiles table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND column_name IN ('branch_id', 'shop_id')
ORDER BY column_name;

-- 2. Check if helper functions exist and work
SELECT proname AS function_name, prorettype::regtype AS return_type
FROM pg_proc 
WHERE proname IN ('get_my_shop_id', 'get_my_branch_id', 'get_my_role', 'is_super_admin', 'get_my_profile')
ORDER BY proname;

-- 3. Test helper functions (replace with actual user ID)
-- First get a user ID to test with
SELECT id, role, shop_id, branch_id 
FROM profiles 
LIMIT 1;

-- 4. Check RLS policies status
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Check if RLS is enabled on tables
SELECT schemaname, tablename, rowsecurity, forcerlspolicy 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'customers', 'jobs', 'branches')
ORDER BY tablename;

-- 6. Check for any policy conflicts or duplicates
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
HAVING COUNT(*) > 1
ORDER BY tablename;

-- 7. Check for potential issues with get_my_branch_id function
-- This function might return NULL for users without branch_id
SELECT id, role, shop_id, branch_id,
       CASE 
         WHEN branch_id IS NULL THEN 'WARNING: User has no branch_id'
         ELSE 'OK'
       END as branch_status
FROM profiles 
WHERE branch_id IS NULL
LIMIT 5;

-- Transaction Rollback Test Script
-- Migration: 014_test_transaction_rollback.sql
-- Purpose: Verify transaction safety by testing rollback scenarios
-- 
-- INSTRUCTIONS: Run this in Supabase SQL Editor to test transaction safety
-- This script creates a test scenario and verifies rollback behavior
--
-- NOTE: This is for testing purposes only. It creates test data that should be cleaned up.

-- ============================================================================
-- TEST 1: Job Creation with Invalid Data (Should Rollback)
-- ============================================================================
-- This test attempts to create a job with an invalid customer_id
-- Expected: Entire transaction should fail, no job or products should be created

DO $$
DECLARE
  v_test_customer_id UUID := gen_random_uuid(); -- Invalid customer ID
  v_test_shop_id UUID;
  v_test_branch_id UUID;
  v_test_user_id UUID;
  v_error_message TEXT;
BEGIN
  -- Get a valid shop_id, branch_id, and user_id from existing data
  SELECT id INTO v_test_shop_id FROM shops LIMIT 1;
  SELECT id INTO v_test_branch_id FROM branches LIMIT 1;
  SELECT id INTO v_test_user_id FROM profiles LIMIT 1;
  
  IF v_test_shop_id IS NULL OR v_test_branch_id IS NULL OR v_test_user_id IS NULL THEN
    RAISE NOTICE 'TEST 1 SKIPPED: No existing data found for testing';
    RETURN;
  END IF;
  
  -- Attempt to create job with invalid customer (should fail and rollback)
  BEGIN
    PERFORM create_job_with_products(
      p_shop_id := v_test_shop_id,
      p_customer_id := v_test_customer_id,
      p_service_branch_id := v_test_branch_id,
      p_delivery_branch_id := v_test_branch_id,
      p_created_by := v_test_user_id,
      p_products := '[{"brand": "Test", "model": "Test", "accessories": [], "other_parts": []}]'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    v_error_message := SQLERRM;
    RAISE NOTICE 'TEST 1 PASSED: Transaction rolled back as expected. Error: %', v_error_message;
  END;
  
  -- Verify no orphaned data was created
  IF NOT EXISTS (SELECT 1 FROM jobs WHERE customer_id = v_test_customer_id) THEN
    RAISE NOTICE 'TEST 1 VERIFIED: No orphaned job records found';
  ELSE
    RAISE EXCEPTION 'TEST 1 FAILED: Orphaned job records found!';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM job_products WHERE job_id IN (SELECT id FROM jobs WHERE customer_id = v_test_customer_id)) THEN
    RAISE NOTICE 'TEST 1 VERIFIED: No orphaned product records found';
  END IF;
END $$;

-- ============================================================================
-- TEST 2: Product Sync with Invalid Condition (Should Rollback)
-- ============================================================================
-- This test attempts to sync products with an invalid condition value
-- Expected: Entire transaction should fail, no partial updates should occur

DO $$
DECLARE
  v_test_job_id UUID;
  v_test_shop_id UUID;
  v_test_customer_id UUID;
  v_test_branch_id UUID;
  v_test_user_id UUID;
  v_error_message TEXT;
BEGIN
  -- Get existing data for testing
  SELECT id INTO v_test_shop_id FROM shops LIMIT 1;
  SELECT id INTO v_test_branch_id FROM branches LIMIT 1;
  SELECT id INTO v_test_user_id FROM profiles LIMIT 1;
  
  -- Create a valid test customer
  INSERT INTO customers (shop_id, name, phone)
  VALUES (v_test_shop_id, 'Test Customer', '9999999999')
  RETURNING id INTO v_test_customer_id;
  
  -- Create a valid test job
  PERFORM create_job_with_products(
    p_shop_id := v_test_shop_id,
    p_customer_id := v_test_customer_id,
    p_service_branch_id := v_test_branch_id,
    p_delivery_branch_id := v_test_branch_id,
    p_created_by := v_test_user_id,
    p_products := '[{"brand": "Test", "model": "Test", "accessories": [], "other_parts": []}]'::jsonb
  );
  
  -- Get the created job
  SELECT id INTO v_test_job_id FROM jobs WHERE customer_id = v_test_customer_id ORDER BY created_at DESC LIMIT 1;
  
  -- Attempt to sync with invalid condition (should fail and rollback)
  BEGIN
    PERFORM sync_job_products(
      p_job_id := v_test_job_id,
      p_products := '[{"brand": "Test", "model": "Test", "condition": "invalid_condition", "accessories": [], "other_parts": []}]'::jsonb
    );
  EXCEPTION WHEN OTHERS THEN
    v_error_message := SQLERRM;
    RAISE NOTICE 'TEST 2 PASSED: Transaction rolled back as expected. Error: %', v_error_message;
  END;
  
  -- Cleanup test data
  DELETE FROM jobs WHERE id = v_test_job_id;
  DELETE FROM customers WHERE id = v_test_customer_id;
  
  RAISE NOTICE 'TEST 2 COMPLETED: Test data cleaned up';
END $$;

-- ============================================================================
-- TEST 3: Spare Part Addition to Non-Existent Job (Should Rollback)
-- ============================================================================
-- This test attempts to add a spare part to a non-existent job
-- Expected: Transaction should fail, no data should be affected

DO $$
DECLARE
  v_fake_job_id UUID := gen_random_uuid(); -- Non-existent job ID
  v_error_message TEXT;
BEGIN
  -- Attempt to add spare part to non-existent job (should fail and rollback)
  BEGIN
    PERFORM add_spare_part_with_job_update(
      p_job_id := v_fake_job_id,
      p_name := 'Test Part',
      p_quantity := 1,
      p_unit_price := 100
    );
  EXCEPTION WHEN OTHERS THEN
    v_error_message := SQLERRM;
    RAISE NOTICE 'TEST 3 PASSED: Transaction rolled back as expected. Error: %', v_error_message;
  END;
  
  -- Verify no spare part was created
  IF NOT EXISTS (SELECT 1 FROM spare_parts WHERE job_id = v_fake_job_id) THEN
    RAISE NOTICE 'TEST 3 VERIFIED: No orphaned spare part records found';
  ELSE
    RAISE EXCEPTION 'TEST 3 FAILED: Orphaned spare part records found!';
  END IF;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '=== TRANSACTION ROLLBACK TESTS COMPLETE ===';
  RAISE NOTICE 'If all tests passed, transaction safety is working correctly.';
  RAISE NOTICE 'If any tests failed, review the error messages above.';
END $$;

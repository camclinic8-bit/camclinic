-- Migration: 030_auto_cleanup_completed_images.sql
-- Purpose: Automatically clean up product and warranty image storage objects and 
-- database arrays for jobs that have been completed for more than 30 days.
-- Runs daily inside Supabase using pg_cron.

-- 1. Create the cleanup function
CREATE OR REPLACE FUNCTION delete_old_job_images()
RETURNS void AS $$
DECLARE
  v_product RECORD;
  v_image_url TEXT;
  v_file_path TEXT;
BEGIN
  -- Select products belonging to completed jobs updated > 30 days ago that still have images
  FOR v_product IN 
    SELECT jp.id, jp.product_images, jp.warranty_images
    FROM job_products jp
    JOIN jobs j ON jp.job_id = j.id
    WHERE j.status = 'completed'
      AND j.updated_at < NOW() - INTERVAL '30 days'
      AND (
        (jp.product_images IS NOT NULL AND array_length(jp.product_images, 1) > 0)
        OR (jp.warranty_images IS NOT NULL AND array_length(jp.warranty_images, 1) > 0)
      )
  LOOP
    -- A. Process product images
    IF v_product.product_images IS NOT NULL THEN
      FOREACH v_image_url IN ARRAY v_product.product_images LOOP
        -- Extract the path after '/public/products/' (bucket name)
        v_file_path := split_part(v_image_url, '/public/products/', 2);
        
        IF v_file_path IS NOT NULL AND v_file_path <> '' THEN
          -- Deleting from storage.objects triggers Supabase's internal triggers to delete the physical files in S3
          DELETE FROM storage.objects 
          WHERE bucket_id = 'products' 
            AND name = v_file_path;
        END IF;
      END LOOP;
    END IF;

    -- B. Process warranty images
    IF v_product.warranty_images IS NOT NULL THEN
      FOREACH v_image_url IN ARRAY v_product.warranty_images LOOP
        v_file_path := split_part(v_image_url, '/public/products/', 2);
        
        IF v_file_path IS NOT NULL AND v_file_path <> '' THEN
          DELETE FROM storage.objects 
          WHERE bucket_id = 'products' 
            AND name = v_file_path;
        END IF;
      END LOOP;
    END IF;

    -- C. Clear database image arrays for the product
    UPDATE job_products
    SET product_images = ARRAY[]::TEXT[],
        warranty_images = ARRAY[]::TEXT[]
    WHERE id = v_product.id;

  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant execution permissions
GRANT EXECUTE ON FUNCTION delete_old_job_images TO service_role;

-- 3. Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 4. Schedule the cron job to run daily at 2:00 AM (database local time)
-- Note: unschedule first to avoid duplicate cron schedules on migrations rerun
SELECT cron.unschedule('cleanup-old-job-images-cron') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-job-images-cron'
);

SELECT cron.schedule(
  'cleanup-old-job-images-cron',
  '0 2 * * *',
  'SELECT delete_old_job_images();'
);

## 27. Chronological Database Migration Logs & Schema Evolution

This section documents the history, rationale, and schema changes of the 33 database migrations located in the `supabase/migrations/` directory.

---

### 27.1 Migration Log Directory Reference

#### 1. `001_initial_schema.sql`
- **Purpose**: Creates the base tables for the multi-tenant camera clinic.
- **Details**: Defines tables for `shops`, `branches`, `profiles`, `customers`, `jobs`, `job_products`, and `spare_parts`. Establishes foreign keys, primary keys, and auto-updated timestamp fields.

#### 2. `002_rls_policies.sql`
- **Purpose**: Establishes initial Row-Level Security (RLS) policies.
- **Details**: Enables RLS on all tables and creates policies for SELECT, INSERT, UPDATE, and DELETE operations based on user roles and shop IDs.

#### 3. `003_seed_data.sql`
- **Purpose**: Seeds the database with default configurations.
- **Details**: Registers the parent shop ("Supportta Solutions Pvt Ltd") and sets up default branches in Goa, Karnataka, and Maharashtra.

#### 4. `004_update_rls_policies_safe.sql`
- **Purpose**: Hardens RLS check boundaries.
- **Details**: Replaces nested subquery checks with safer JOIN checks to prevent infinite recursion during permission evaluations.

#### 5. `005_fix_rls_issues.sql`
- **Purpose**: Resolves recursion errors in profile select policies.
- **Details**: Simplifies profile selection checks using `auth.uid()` directly, bypassing recursive checks on profiles.

#### 6. `006_apply_correct_rls.sql`
- **Purpose**: Applies optimized RLS policies across all tables.
- **Details**: Re-applies policies for `jobs` and `profiles` using optimized SQL performance patterns.

#### 7. `007_profiles_email.sql`
- **Purpose**: Synchronizes email addresses between auth and profiles tables.
- **Details**: Mappings are enforced via triggers on Supabase Auth events.

#### 8. `008_backfill_profile_shop_id.sql`
- **Purpose**: Syncs shop UUIDs across existing profiles.
- **Details**: Assigns default shop IDs to existing profiles.

#### 9. `009_service_manager_shop_wide_access.sql`
- **Purpose**: Grants Service Managers access to all jobs in the shop.
- **Details**: Updates select policies to allow Service Managers to view jobs across all branches within their shop.

#### 10. `010_jobs_delete_super_admin_only.sql`
- **Purpose**: Restricts job deletions.
- **Details**: Restricts job deletion policies to Super Admins only.

#### 11. `011_super_admin_jobs_delete_policy.sql`
- **Purpose**: Enforces deletion checks on the jobs table.

#### 12. `012_transaction_safe_rpc_functions.sql`
- **Purpose**: Adds transaction-safe RPC functions.
- **Details**: Introduces `create_job_with_products` to ensure atomic job intake operations.

#### 13. `013_transaction_safe_product_billing_rpc.sql`
- **Purpose**: Adds triggers to synchronize product and billing fields.
- **Details**: Recalculates job billing parameters on updates.

#### 14. `014_test_transaction_rollback.sql`
- **Purpose**: Test suite script for transaction rollbacks.

#### 15. `015_inventory_management.sql`
- **Purpose**: Implements inventory management tables.
- **Details**: Adds tables for `brands`, `models`, and `brand_models`.

#### 16. `016_add_spare_parts_cost.sql`
- **Purpose**: Adds pricing fields to spare parts.
- **Details**: Adds unit cost tracking fields.

#### 17. `017_update_rpc_for_spare_parts_cost.sql`
- **Purpose**: Integrates parts costs with billing calculations.

#### 18. `018_fix_service_date_logic.sql`
- **Purpose**: Updates completion date logic.
- **Details**: Sets the completion date (`service_date`) automatically when the status changes to `completed`.

#### 19. `019_add_payment_transactions.sql`
- **Purpose**: Adds payment transactions ledger.
- **Details**: Creates `payment_transactions` to track UPI, Cash, and Card payments.

#### 20. `020_update_gst_calculation_to_full_amount.sql`
- **Purpose**: Updates GST calculation formula to match Indian tax guidelines (18% GST on labor charges).

#### 21. `021_add_job_number_fields_to_products.sql`
- **Purpose**: Links prior and external job numbers to products.
- **Details**: Adds `repeat_job_number` and `other_job_number` fields.

#### 22. `022_comprehensive_updates.sql`
- **Purpose**: Large database update for warranty and intake features.
- **Details**: Adds warranty fields, image paths, and contact info fields.

#### 23. `023_add_terms_and_conditions.sql`
- **Purpose**: Adds terms and conditions template tables.

#### 24. `024_add_warranty_images_to_products.sql`
- **Purpose**: Configures storage buckets for warranty images.

#### 25. `025_add_product_images_to_job_products.sql`
- **Purpose**: Configures storage buckets for product intake photos.

#### 26. `026_add_alternative_contact_to_jobs.sql`
- **Purpose**: Adds alternative contact details to the jobs table.

#### 27. `026_add_alternative_phone_to_customers.sql`
- **Purpose**: Adds alternative phone numbers to customer profiles.

#### 28. `027_add_liquid_damage_to_product_condition.sql`
- **Purpose**: Adds `liquid_damage` to the product condition enum.

#### 29. `028_restore_missing_rls_policies.sql`
- **Purpose**: Restores missing RLS policies on auxiliary tables.

#### 30. `029_add_hsn_code_to_spare_parts.sql`
- **Purpose**: Adds HSN code fields to spare parts.

#### 31. `030_auto_cleanup_completed_images.sql`
- **Purpose**: Implements cleanup triggers for deleted product images.

#### 32. `031_add_email_landline_to_branches.sql`
- **Purpose**: Adds email and landline fields to branches.

#### 33. `20260331124517_fix_rls_policies.sql`
- **Purpose**: Hardens security policies across all tables.

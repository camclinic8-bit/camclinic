# Cam Clinic — Database & Migrations

## DB Query Modules `src/lib/db/`

### `jobs.ts`
All functions take `(supabase, ...params)`.
- `getJobs(filters?, page?, pageSize?)` — paginated list with joins (customer, branches, profiles, products). Filters: status[], priority[], branch_id, technician_id, customer_id, date range, search (job_number/customer name/phone), sort
- `getJobById(id)` — full detail with all joins including products+accessories+other_parts, spare_parts, status_history+user
- `createJob(input, shopId, createdBy)` — calls RPC `get_next_job_number`, inserts job + products + accessories/parts + status_history
- `updateJob(id, input, userId)` — updates fields, logs status_history if status changed
- `updateJobStatus(id, status, userId, notes?)` — sets service_date if completed, logs history
- `deleteJob(id)` — CASCADE delete, throws if 0 rows (RLS)
- `getJobStatusHistory(jobId)` — returns status_history with changed_by_user
- `getJobCounts(branchId?)` — returns Record<JobStatus, number>
- `getJobsDueToday(branchId?)` — estimate_delivery_date=today, excludes completed/cancelled

### `customers.ts`
- `getCustomers(search?, page?, pageSize?)` — paginated, OR search on name/phone/email
- `getCustomerById(id)` — single, null if PGRST116
- `searchCustomers(query, limit=10)` — autocomplete, name/phone ilike
- `createCustomer(input, shopId)` — name + phone + optional email/address
- `updateCustomer(id, input)` — patch fields
- `getCustomerWithJobCount(id)` — customer + job count (head query)

### `branches.ts`
- `getBranches()` — active only, ordered by name
- `getAllBranches()` — all regardless of active
- `getBranchById(id)` — single, null if PGRST116
- `createBranch(input, shopId)` — name + optional address/phone
- `updateBranch(id, input)` — name/address/phone/is_active
- `deleteBranch(id)` — soft delete (is_active=false)

### `technicians.ts`
- `getTechnicians(branchId?)` — active profiles with role technician or service_incharge
- `getServiceIncharges(branchId?)` — active service_incharge
- `getTechnicianById(id)` — single profile
- `getTechnicianWithJobCounts(id)` — profile + assigned/completed job counts
- `getAllUsers()` — all profiles ordered by name
- `updateUserProfile(userId, patch)` — patch role/branch_id/is_active. Throws if no fields
- Type: `UserProfilePatch = { role?, branch_id?, is_active? }`

### `billing.ts`
- `getSpareParts(jobId)` — ordered by created_at
- `addSparePart(jobId, input)` — inserts, touches job.updated_at to trigger totals recalc
- `updateSparePart(id, input)` — updates, touches parent job
- `deleteSparePart(id, jobId)` — deletes, touches parent job
- `updateJobCharges(jobId, charges)` — validates advance_paid <= grand_total

### `products.ts`
- `getJobProducts(jobId)` — products + nested accessories + other_parts
- `getProductById(id)` — single with nested
- `updateProduct(id, input)` — patch fields
- `createProduct(input)` — requires job_id
- `deleteProduct(id)` — deletes by ID
- `addAccessory(productId, name)` / `addAccessoriesBulk(productId, names[])` / `removeAccessory(id)` / `clearAccessoriesByProductId(productId)`
- `addOtherPart(productId, name)` / `addOtherPartsBulk(productId, names[])` / `removeOtherPart(id)` / `clearOtherPartsByProductId(productId)`

### `reports.ts`
- `getJobsReport(filters?)` — returns JobReport[]: id, job_number, customer_name, customer_phone, status, priority, service_branch, delivery_branch, technician_name, grand_total, balance_amount, created_at, completed_at
- `getDashboardStats(branchId?)` — 5 parallel queries (total, today, pending, completed, revenue+balance)
- Types exported: ReportFilters, JobReport, DashboardStats

## Supabase Clients `src/lib/supabase/`

| File | Export | Description |
|---|---|---|
| `client.ts` | `createClient()` | Browser client via createBrowserClient. Env: NEXT_PUBLIC_SUPABASE_URL + ANON_KEY |
| `server.ts` | `createClient()` | Server client via createServerClient + cookies() from next/headers |
| `middleware.ts` | `updateSession(request)` | Filters cookies to sb-* prefix only (avoid HTTP 431). Redirects: unauthenticated→/login, /login→/dashboard, /settings→/technicians |

## Migrations `supabase/migrations/`

| # | File | Purpose (short) |
|---|---|---|
| 1 | `001_initial_schema.sql` | Enums(4) + tables(10) + indexes(16) + trigger functions + get_next_job_number + handle_new_user |
| 2 | `002_rls_policies.sql` | Enable RLS on all tables + helper functions + initial policies per role |
| 3 | `003_seed_data.sql` | Commented-out demo shop+branches template |
| 4 | `004_update_rls_policies_safe.sql` | Add branch_id/shop_id columns to profiles, recreate policies with branch scoping |
| alt | `20260331124517_fix_rls_policies.sql` | Duplicate/corrective of 004. Same structure, slightly different policy names |
| 5 | `005_fix_rls_issues.sql` | Fix NULL branch_id, has_branch_id() helper, NULL-safe policies |
| 6 | `006_apply_correct_rls.sql` | Clean slate: drop all, recreate with final logic. get_my_role() returns TEXT |
| 7 | `007_profiles_email.sql` | Add email column, backfill from auth.users, update handle_new_user |
| 8 | `008_backfill_profile_shop_id.sql` | Backfill NULL shop_id from any super_admin (single-shop assumption) |
| 9 | `009_service_manager_shop_wide_access.sql` | Elevate SM to shop-wide (profiles read, customers, jobs, branches CRUD) |
| 10 | `010_jobs_delete_super_admin_only.sql` | Restrict DELETE to SA, split SM/SI FOR ALL into INSERT+UPDATE |
| 11 | `011_super_admin_jobs_delete_policy.sql` | Explicit DELETE policy for SA on jobs |

## DB Schema Summary

```
shops(id, name)
  → branches(id, shop_id, name, address, phone, is_active)
  → profiles(id PK→auth.users, shop_id, branch_id, full_name, email, phone, role, is_active)
  → customers(id, shop_id, name, phone, email, address)

jobs(id, shop_id, job_number UNIQUE, customer_id, service_branch_id, delivery_branch_id,
     assigned_incharge_id, assigned_technician_id, status, priority, description, ...financials,
     created_by, timestamps)
  → job_products(id, job_id, brand, model, serial_number, condition, ...warranty)
    → product_accessories(id, job_product_id, name)
    → product_other_parts(id, job_product_id, name)
  → spare_parts(id, job_id, name, quantity, unit_price, total_price GENERATED)
  → job_status_history(id, job_id, from_status, to_status, changed_by, notes)
  → job_documents(id, job_id, document_type, generated_by)
```

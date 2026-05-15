# Cam Clinic — Types & Validation

## Types `src/types/`

### `enums.ts`
- Types: `UserRole`, `JobStatus`, `JobPriority`, `ProductCondition` (string unions matching DB enums)
- Labels: `JOB_STATUS_LABELS`, `JOB_PRIORITY_LABELS`, `PRODUCT_CONDITION_LABELS`, `USER_ROLE_LABELS`
- `JOB_STATUS_ORDER`: ordered array of workflow statuses (excludes disapproved, cancelled)

### `database.ts`
- `Database` — full Supabase generated type. All tables under `public.Tables` with Row/Insert/Update. All 4 enums under `public.Enums`

### `user.ts`
- `Profile`: id, shop_id, branch_id, full_name, email?, phone, role, is_active, created_at, updated_at
- `ProfileWithBranch`: Profile + optional `branch: { id, name }`

### `branch.ts`
- `Shop`: id, name, timestamps
- `Branch`: id, shop_id, name, address?, phone?, is_active, timestamps
- `BranchWithShop`: Branch + optional shop

### `customer.ts`
- `Customer`: id, shop_id, name, phone, email?, address?, timestamps
- `CustomerWithJobCount`: Customer + optional job_count

### `job.ts`
- `Job`: id, shop_id, job_number, customer_id, service_branch_id, delivery_branch_id, assigned_incharge_id?, assigned_technician_id?, status, priority, description?, technician_notes?, cam_clinic_advisory_notes?, financial fields, estimate_delivery_date?, service_date?, created_by, timestamps
- `JobWithRelations`: Job + customer?, service_branch?, delivery_branch?, assigned_incharge?, assigned_technician?, created_by_user?, products?, spare_parts?, status_history?
- `JobProduct`: id, job_id, brand?, model?, serial_number?, condition?, description?, remarks?, has_warranty, warranty_description?, warranty_expiry_date?, accessories?, other_parts?
- `ProductAccessory`: id, job_product_id, name
- `ProductOtherPart`: id, job_product_id, name
- `JobStatusHistory`: id, job_id, from_status?, to_status, changed_by, notes?, changed_by_user?
- `JobDocument`: id, job_id, document_type (receipt|quote|invoice), generated_by
- `JobCreateInput`: customer_id, service_branch_id, delivery_branch_id, priority, products[], optional fields
- `JobProductInput`: brand?, model?, serial_number?, condition?, description?, remarks?, has_warranty?, accessories[], other_parts[]
- `JobUpdateInput`: partial of Job fields (status, priority, branches, assignments, financials, notes)
- `JobFilters`: status?, priority?, branch_id?, technician_id?, customer_id?, date_from?, date_to?, search?, sort_by?, sort_order?

### `technician.ts`
- `Technician`: Profile + assigned_jobs_count?, completed_jobs_count?
- `TechnicianPerformance`: technician_id, technician_name, total_jobs, completed_jobs, in_progress_jobs, average_completion_time_hours?

### `billing.ts`
- `SparePart`: id, job_id, name, quantity, unit_price, total_price (generated), timestamps
- `JobBilling`: aggregated: inspection_fee, service_charges, spare_parts_total, total_charges, gst_enabled, gst_amount, grand_total, advance_paid, advance_paid_date?, balance_amount
- `SparePartInput`: name, quantity, unit_price

### `index.ts` — barrel, re-exports all types

## Validation `src/lib/validation/`

### `optionalFields.ts` (Zod schemas)

| Export | Type | Behavior |
|---|---|---|
| `optionalStr` | `z.string().nullish()` | Optional text, accepts null/undefined |
| `chipStringArray` | `z.array(z.string()).default([])` | Preprocess: filter non-strings, trim, remove empty |
| `optionalNonNegativeNumber` | `z.number().min(0).optional()` | NaN→undefined, undefined→undefined |
| `optionalDateInput` | `z.string().nullish()` | Date input, empty string → nullish |
| `nonNegativeNumberOrZero` | `z.number().min(0)` | NaN→0, always returns number |

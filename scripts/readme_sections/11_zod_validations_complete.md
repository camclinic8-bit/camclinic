## 16. Data Validation & Forms: Zod Schemas

Data integrity at the frontend boundaries is enforced by Zod validation schemas. This section lists the Zod schemas used to validate form inputs.

### 16.1 Job Intake Schema (`jobSchema`)
Used to validate the intake form when registering a new camera repair.

```typescript
const productSchema = z.object({
  brand: z.string().nullish(),
  model: z.string().nullish(),
  serial_number: z.string().nullish(),
  condition: z.string().nullish(),
  description: z.string().nullish(),
  remarks: z.string().nullish(),
  has_warranty: z.coerce.boolean().default(false),
  warranty_description: z.string().nullish(),
  warranty_expiry_date: z.string().nullish(),
  repeat_job_number: z.string().nullish(),
  other_job_number: z.string().nullish(),
  warranty_images: z.array(z.string()).optional().default([]),
  product_images: z.array(z.string()).optional().default([]),
  accessories: z.preprocess((val) => {
    if (!Array.isArray(val)) return [];
    return val
      .map((x) => (typeof x === 'string' ? x.trim() : typeof x === 'number' ? String(x) : ''))
      .filter((s) => s.length > 0);
  }, z.array(z.string()).default([])),
  other_parts: z.preprocess((val) => {
    if (!Array.isArray(val)) return [];
    return val
      .map((x) => (typeof x === 'string' ? x.trim() : typeof x === 'number' ? String(x) : ''))
      .filter((s) => s.length > 0);
  }, z.array(z.string()).default([])),
});

const jobSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  service_branch_id: z.string().min(1, 'Service branch is required'),
  delivery_branch_id: z.string().min(1, 'Delivery branch is required'),
  assigned_incharge_id: z.string().nullish(),
  assigned_technician_id: z.string().nullish(),
  priority: z.enum(['immediate', 'high', 'medium', 'low']),
  description: z.string().nullish(),
  inspection_fee: z
    .union([z.nan(), z.number()])
    .optional()
    .transform((v) =>
      v === undefined || (typeof v === 'number' && Number.isNaN(v)) ? undefined : v
    )
    .pipe(z.number().min(0).optional()),
  advance_paid: z
    .union([z.nan(), z.number()])
    .optional()
    .transform((v) =>
      v === undefined || (typeof v === 'number' && Number.isNaN(v)) ? undefined : v
    )
    .pipe(z.number().min(0).optional()),
  advance_paid_date: z.string().nullish(),
  estimate_delivery_date: z.string().nullish(),
  spare_parts_total_cost: z
    .union([z.nan(), z.number()])
    .optional()
    .transform((v) =>
      v === undefined || (typeof v === 'number' && Number.isNaN(v)) ? undefined : v
    )
    .pipe(z.number().min(0).optional()),
  spare_parts_private_details: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit_cost: z.number(),
      hsn_code: z.string().nullable().optional(),
    })
  ).optional().default([]),
  products: z.array(productSchema).min(1, 'At least one product is required'),
  alternative_contact: z.string().nullish(),
});
```

---

### 16.2 Edit Job Validation Schema (`editJobSchema`)
Validates updates to job cards, including labor, diagnostics, parts, and GST details.

```typescript
const editJobSchema = z.object({
  status: z.string().min(1, 'Status is required'),
  priority: z.enum(['immediate', 'high', 'medium', 'low']),
  service_branch_id: z.string().min(1, 'Service branch is required'),
  delivery_branch_id: z.string().min(1, 'Delivery branch is required'),
  assigned_incharge_id: z.string().nullish(),
  assigned_technician_id: z.string().nullish(),
  description: z.string().nullish(),
  technician_notes: z.string().nullish(),
  cam_clinic_advisory_notes: z.string().nullish(),
  inspection_fee: z
    .union([z.nan(), z.number()])
    .optional()
    .transform((v) =>
      v === undefined || (typeof v === 'number' && Number.isNaN(v)) ? undefined : v
    )
    .pipe(z.number().min(0).optional()),
  service_charges: z
    .union([z.nan(), z.number()])
    .optional()
    .transform((v) =>
      v === undefined || (typeof v === 'number' && Number.isNaN(v)) ? undefined : v
    )
    .pipe(z.number().min(0).optional()),
  gst_enabled: z.coerce.boolean().default(true),
  advance_paid: z
    .union([z.nan(), z.number()])
    .optional()
    .transform((v) =>
      v === undefined || (typeof v === 'number' && Number.isNaN(v)) ? undefined : v
    )
    .pipe(z.number().min(0).optional()),
  advance_paid_date: z.string().nullish(),
  estimate_delivery_date: z.string().nullish(),
  spare_parts_total_cost: z
    .union([z.nan(), z.number()])
    .optional()
    .transform((v) =>
      v === undefined || (typeof v === 'number' && Number.isNaN(v)) ? undefined : v
    )
    .pipe(z.number().min(0).optional()),
  alternative_contact: z.string().nullish(),
});
```

---

### 16.3 Login Page Schema (`loginSchema`)
Validates user credentials before authenticating with Supabase.

```typescript
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
```

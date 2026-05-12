# Cam Clinic — Agent Context File

> **Cam Clinic** is a comprehensive **camera service management system** for multi-branch camera shops. Built with Next.js 16, Supabase (PostgreSQL), and TypeScript. Designed for Indian camera service centers with GST support, INR formatting, and multi-branch operations.

---

## 1. Project Identity

- **Name:** cam-clinic
- **Version:** 0.1.0 (private)
- **Domain:** Camera/electronics service center management
- **Company:** Supportta Solutions Private Limited
- **Support WhatsApp:** +918590377418
- **Deployment:** Vercel (region: `sin1` — Singapore)
- **Default Admin:** `camclinic8@gmail.com` / `admin123`

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.1 |
| Library | React & React DOM | 19.2.4 |
| Language | TypeScript | ^5 (strict mode) |
| Styling | TailwindCSS | v4 |
| Database | Supabase (PostgreSQL) | via `@supabase/supabase-js` ^2.101.0 |
| Auth | Supabase Auth (SSR) | via `@supabase/ssr` ^0.10.0 |
| State (client) | Zustand | ^5.0.12 |
| Server State | TanStack React Query | ^5.95.2 |
| Forms | React Hook Form | ^7.72.0 |
| Resolvers | @hookform/resolvers | ^5.2.2 |
| Validation | Zod | ^4.3.6 |
| PDF | jsPDF + jspdf-autotable | ^4.2.1 / ^5.0.7 |
| Icons | Lucide React | ^1.7.0 |
| Toasts | Sonner | ^2.0.7 |
| Dates | date-fns | ^4.1.0 |
| Lint | ESLint (Next.js core-web-vitals + TypeScript) | ^9 |
| PostCSS | `@tailwindcss/postcss` | v4 |
| React Compiler | babel-plugin-react-compiler | 1.0.0 (enabled in next.config.ts) |
| Dev DB | Supabase CLI | 2.84.2 |

---

## 3. Project Structure (Full Map)

```
cam-clinic/
├── AGENTS.md                        # ← This file
├── README.md                        # Project docs + setup instructions
├── ROLE_BASED_ACCESS.md             # RBAC design document
├── env.example                      # Environment variable template
├── .env.local                       # Local env vars (gitignored)
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript config (strict, bundler resolution, @/* → ./src/*)
├── next.config.ts                   # Next.js config (reactCompiler: true, turbopack root pinned)
├── eslint.config.mjs                # ESLint flat config (next-vitals + typescript)
├── postcss.config.mjs               # PostCSS (Tailwind v4 plugin)
├── vercel.json                      # Vercel deployment config (sin1 region)
├── next-env.d.ts                    # Next.js types
│
├── src/
│   ├── middleware.ts                # Next.js middleware — session refresh + route protection
│   │
│   ├── app/                         # Next.js App Router
│   │   ├── globals.css              # Global styles (Tailwind v4, light-only, no dark mode)
│   │   ├── layout.tsx               # Root layout (html, providers, metadata)
│   │   ├── page.tsx                 # / → redirect(/dashboard)
│   │   ├── providers.tsx            # QueryClientProvider + AuthInitializer + Toaster
│   │   │
│   │   ├── (auth)/
│   │   │   └── login/page.tsx       # /login — Email/password form, Zod validation
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx           # AuthGate + Sidebar + ErrorBoundary
│   │   │   ├── dashboard/page.tsx   # /dashboard — Stats cards, job status breakdown, due today
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx         # /jobs — Full data table (search, filter, sort, paginate)
│   │   │   │   ├── new/page.tsx     # /jobs/new — Create job (customer, products, details)
│   │   │   │   ├── [id]/page.tsx    # /jobs/:id — Detail view (PDF, charges, status history)
│   │   │   │   └── [id]/edit/page.tsx # /jobs/:id/edit — Full edit (products, spare parts, charges)
│   │   │   ├── customers/page.tsx   # /customers — Searchable list + inline CRUD modal
│   │   │   ├── technicians/page.tsx # /technicians — Team roster, CRUD, password reset
│   │   │   ├── branches/page.tsx    # /branches — Card grid, CRUD modal
│   │   │   └── reports/page.tsx     # /reports — Filterable report + CSV export
│   │   │
│   │   └── api/
│   │       ├── users/create/route.ts      # POST — Create user (super_admin, service_role)
│   │       ├── users/update-password/route.ts # POST — Reset password (super_admin)
│   │       └── team/route.ts              # GET — Team list (queries profiles directly)
│   │
│   ├── components/
│   │   ├── ui/                      # Reusable primitives
│   │   │   ├── Badge.tsx            # 6 color variants, 2 sizes
│   │   │   ├── Button.tsx           # forwardRef, 5 variants, 3 sizes, loading spinner
│   │   │   ├── Card.tsx             # Card, CardHeader, CardTitle, CardContent, CardFooter
│   │   │   ├── ChipInput.tsx        # Tag/chip input (Enter/comma to add, backspace to remove)
│   │   │   ├── ErrorBoundary.tsx    # Class-based error boundary with stack trace in dev
│   │   │   ├── Input.tsx            # forwardRef, label, error, password toggle
│   │   │   ├── Modal.tsx            # Overlay dialog, backdrop click, Escape key, scroll lock
│   │   │   ├── Select.tsx           # forwardRef, native select, label, error
│   │   │   ├── Table.tsx            # Composable Table, TableHeader/Body/Row/Cell/Empty
│   │   │   └── index.ts             # Barrel
│   │   │
│   │   ├── jobs/                    # Job-domain components
│   │   │   ├── JobCard.tsx          # Clickable card summary (link), prefetches detail on hover
│   │   │   ├── JobPriorityBadge.tsx # Maps priority → badge color
│   │   │   ├── JobStatusBadge.tsx   # Maps 10 statuses → badge colors
│   │   │   └── ProductWarrantyFields.tsx # Warranty form fields with isolated useWatch
│   │   │
│   │   └── layout/                  # App shell
│   │       ├── Sidebar.tsx          # Responsive sidebar (mobile drawer, desktop collapsible)
│   │       ├── Header.tsx           # Top bar with title, branch selector, notification bell
│   │       ├── BranchSelector.tsx   # Branch-scoping dropdown
│   │       └── index.ts             # Barrel
│   │
│   ├── hooks/                       # React Query hooks (8 files)
│   │   ├── useAuth.ts               # Auth actions: signIn, signOut, role checks + computed permissions
│   │   ├── useJobs.ts               # Jobs CRUD + counts + due today (technician filter override)
│   │   ├── useCustomers.ts          # Customers CRUD + search
│   │   ├── useBranches.ts           # Branches CRUD (active + all)
│   │   ├── useTechnicians.ts        # Technicians, incharges, all users, team, profile updates
│   │   ├── useBilling.ts            # Spare parts CRUD + job charges update
│   │   ├── useProducts.ts           # Products + accessories + other parts mutations
│   │   └── useReports.ts            # Jobs report + dashboard stats
│   │
│   ├── stores/                      # Zustand stores
│   │   ├── authStore.ts             # user, isLoading, isAuthenticated, setUser, logout
│   │   ├── branchStore.ts           # selectedBranchId (persisted with localStorage fallback)
│   │   └── uiStore.ts              # sidebarOpen, sidebarCollapsed, toggle functions
│   │
│   ├── lib/
│   │   ├── db/                      # Database query functions (8 files)
│   │   │   ├── index.ts             # Barrel
│   │   │   ├── jobs.ts              # Full CRUD + job number via RPC + status history + counts
│   │   │   ├── customers.ts         # CRUD + search (name/phone, OR search for autocomplete)
│   │   │   ├── branches.ts          # CRUD + soft delete (is_active = false)
│   │   │   ├── technicians.ts       # Profiles by role + team + update profile
│   │   │   ├── billing.ts           # Spare parts CRUD + job charges
│   │   │   ├── products.ts          # Job products + accessories + other parts full CRUD
│   │   │   └── reports.ts           # Dashboard stats (5 parallel queries) + jobs report for CSV
│   │   │
│   │   ├── supabase/                # Supabase client factories (3 files)
│   │   │   ├── client.ts            # Browser client (createBrowserClient)
│   │   │   ├── server.ts            # Server client (createServerClient + cookies())
│   │   │   └── middleware.ts         # Session refresh + route redirects
│   │   │
│   │   ├── utils/                   # Pure utility functions (8 files)
│   │   │   ├── index.ts             # Barrel (exports currency, dates, jobNumber, pdf)
│   │   │   ├── currency.ts          # formatINR, formatINRWhole, parseINR (en-IN locale)
│   │   │   ├── dates.ts             # formatDate, formatDateTime, formatDateForInput, isExpired, etc.
│   │   │   ├── jobNumber.ts         # generateJobNumber (CC-YYYYMMDD-XXXX), parse, validate
│   │   │   ├── initials.ts          # nameInitials — 2-letter avatar initials
│   │   │   ├── jobProducts.ts       # formatProductName, truncateChars, summarizeJobProducts
│   │   │   ├── normalizeJobProduct.ts # normalizeJobProductWarrantyForDb helper
│   │   │   └── pdf.ts              # generateReceipt, generateQuote, generateInvoice, downloadPDF
│   │   │
│   │   └── validation/
│   │       └── optionalFields.ts    # Zod schemas: optionalStr, chipStringArray, optionalNonNegativeNumber, etc.
│   │
│   └── types/                       # TypeScript type definitions (9 files)
│       ├── index.ts                 # Barrel: re-exports all
│       ├── enums.ts                 # UserRole, JobStatus, JobPriority, ProductCondition + label maps
│       ├── database.ts             # Full Supabase Database type (all tables Row/Insert/Update)
│       ├── user.ts                 # Profile, ProfileWithBranch
│       ├── branch.ts               # Shop, Branch, BranchWithShop
│       ├── customer.ts             # Customer, CustomerWithJobCount
│       ├── job.ts                  # Job, JobWithRelations, JobProduct, JobStatusHistory, inputs, filters
│       ├── technician.ts           # Technician (Profile with job counts), TechnicianPerformance
│       └── billing.ts             # SparePart, JobBilling, SparePartInput
│
├── supabase/
│   ├── config.toml                  # Local Supabase config (ports, auth, storage, etc.)
│   ├── .gitignore
│   ├── .temp/cli-latest             # "v2.84.2"
│   └── migrations/                  # 12 SQL migrations (see Section 6)
│
├── scripts/
│   └── seed-demo-jobs.ts            # Bulk demo seeder: 120+ jobs with deterministic RNG
│
└── .commandcode/                    # IDE/agent config directory
    └── taste/                       # Learned code preferences (if any)
```

---

## 4. Architecture Overview

### 4.1 Routing Architecture (Next.js App Router)

Two **route groups** provide organizational separation without URL segments:

| Route Group | URL Prefix | Layout | Purpose |
|---|---|---|---|
| `(auth)` | none | Root layout (no sidebar) | Login only |
| `(dashboard)` | none | Dashboard layout (sidebar + auth gate) | All authenticated pages |

**Route protection flow:**
1. **Middleware** (`src/middleware.ts`): Runs for all app routes (`/dashboard/*`, `/jobs/*`, `/customers/*`, `/technicians/*`, `/branches/*`, `/reports/*`, `/settings/*`, `/login`). Refreshes Supabase session cookie on each request. Redirects unauthenticated → `/login`, authenticated away from `/login` → `/dashboard`, `/settings` → `/technicians`.
2. **AuthGate** (`(dashboard)/layout.tsx`): Client-side safety net — checks `useAuthStore` for `isLoading`/`isAuthenticated`, shows skeleton while loading, redirects to `/login` if not authenticated.

Both middleware and AuthGate exist for **defense in depth**, since middleware can have a stale cookie edge case.

### 4.2 State Management Strategy

| Concern | Tool | Details |
|---|---|---|
| **Auth session & profile** | Zustand (`authStore`) | Single source of truth for current user, role, loading state |
| **Selected branch filter** | Zustand (`branchStore`) | Persisted to localStorage with safe fallback |
| **Sidebar UI state** | Zustand (`uiStore`) | sidebarOpen, sidebarCollapsed |
| **Server data** (jobs, customers, etc.) | TanStack React Query | `useQuery` + `useMutation` with cache invalidation |
| **Realtime Sync** | Supabase Realtime | `jobs` table subscription invalidates React Query cache (`providers.tsx`) |
| **Forms** | React Hook Form + Zod | Zod schemas validated via `@hookform/resolvers`. UI is single source of truth for normalization. |

*React Query Provider config (`providers.tsx`): staleTime: 5 mins, gcTime: 10 mins, retry: 1, retryDelay: 1000.*

### 4.3 Data Fetching Pattern

Every hook follows the same pattern:
1. Create a Supabase client inside the hook (`createClient()`)
2. Use `useQuery` with `queryKey: ['entity', ...dependencies]`
3. Call the corresponding `@/lib/db/*` function
4. `staleTime` varies by entity (5min for jobs/branches, 1min for customers/stats/reports)
5. `enabled:` is tied to `useAuthStore.isAuthenticated` or role checks
6. Mutations invalidate related queries on success

### 4.4 Multi-Tenant Architecture

- Each `shop` is a tenant (root container)
- All data tables have `shop_id` foreign keys
- RLS policies enforce shop-level isolation at the database level
- No cross-shop data leakage possible at the DB level
- Single-shop deployment model currently (no multi-tenant UI yet — seed script assumes one shop)

### 4.5 Role-Based Access Control (RBAC)

**4 roles** with progressive permission levels:

| Role | Abbr | Job Scope | Customer Scope | Profile Scope | Branch Scope | Manage Users |
|---|---|---|---|---|---|---|
| Super Admin | SA | All shop jobs | All shop customers | All shop profiles | Full CRUD | Yes |
| Service Manager | SM | All shop jobs | All shop customers | Shop-wide read | Full CRUD (from mig 009) | No (read-only) |
| Service Incharge | SI | Branch jobs (service + delivery + assigned) | Branch customers | Branch read | View all (for assignment) | No (read-only) |
| Technician | TECH | Assigned jobs only | Customers of assigned jobs | Own profile only | Own branch only | No |

**Permission flags** (computed in `useAuth`):
- `canManageJobs`: SA, SM, SI
- `canManageBranches`: SA, SM
- `canManageUsers`: SA only
- `canViewAllBranches`: SA, SM
- `canSetAnyStatus`: SA, SM

### 4.6 Security Architecture (Defense in Depth)

1. **Supabase RLS**: Every table has row-level security policies. Helper functions (`get_my_shop_id()`, `get_my_role()`, `is_super_admin()`) evaluate permissions on every query
2. **Next.js Middleware**: Session refresh + route redirection
3. **Client-side AuthGate**: `(dashboard)/layout.tsx` checks auth store
4. **API routes**: Server-side Supabase client with `SUPABASE_SERVICE_ROLE_KEY` for admin operations (user creation, password reset)
5. **Server-side Auth**: API routes verify caller's profile/role before performing actions
6. **Frontend filtering**: UI components hide unauthorized features by role
7. **Deleted job protection**: Only super_admin has DELETE policy on jobs (mig 010-011)

---

## 5. Database Schema (PostgreSQL via Supabase)

### 5.1 Enums

| Enum | Values |
|---|---|
| `user_role` | `super_admin`, `service_manager`, `service_incharge`, `technician` |
| `job_status` | `new`, `inspected`, `pending_approval`, `quote_sent`, `approved`, `disapproved`, `spare_parts_pending`, `in_progress`, `completed`, `cancelled` |
| `job_priority` | `immediate`, `high`, `medium`, `low` |
| `product_condition` | `good`, `dusty`, `scratches`, `damage`, `not_working`, `dead` |

### 5.2 Tables

| Table | Purpose | Key Columns | Key FK |
|---|---|---|---|
| `shops` | Multi-tenant root | `id PK`, `name` | — |
| `branches` | Physical locations | `id PK`, `shop_id FK`, `name`, `address`, `phone`, `is_active` | `shops(id)` |
| `profiles` | Extends auth.users | `id PK FK → auth.users`, `shop_id FK`, `branch_id FK`, `full_name`, `email`, `phone`, `role`, `is_active` | `shops(id)`, `branches(id)`, `auth.users(id)` |
| `customers` | Customer records | `id PK`, `shop_id FK`, `name`, `phone`, `email`, `address` | `shops(id)` |
| `jobs` | Core work orders | `id PK`, `shop_id FK`, `job_number UNIQUE`, `customer_id FK`, `status`, `priority`, financial columns (inspection_fee, service_charges, gst, totals) | `shops`, `customers`, `branches` (x2), `profiles` (x2) |
| `job_products` | Products under a job | `id PK`, `job_id FK`, `brand`, `model`, `serial_number`, `condition`, warranty fields | `jobs(id)` |
| `product_accessories` | Accessories per product | `id PK`, `job_product_id FK`, `name` | `job_products(id)` |
| `product_other_parts` | Other parts per product | `id PK`, `job_product_id FK`, `name` | `job_products(id)` |
| `spare_parts` | Billable parts | `id PK`, `job_id FK`, `name`, `quantity`, `unit_price`, `total_price` (generated) | `jobs(id)` |
| `job_status_history` | Status audit trail | `id PK`, `job_id FK`, `from_status`, `to_status`, `changed_by FK`, `notes` | `jobs(id)`, `profiles(id)` |
| `job_documents` | Generated PDFs | `id PK`, `job_id FK`, `document_type`, `generated_by FK` | `jobs(id)`, `profiles(id)` |

### 5.3 Key Database Functions

| Function | Purpose |
|---|---|
| `update_updated_at_column()` | Trigger function: sets `updated_at = NOW()` on UPDATE |
| `calculate_job_totals()` | Trigger on jobs INSERT/UPDATE: sums spare parts, calculates total_charges, GST (18% on service_charges), grand_total, balance_amount |
| `get_next_job_number(DATE)` | Generates `CC-YYYYMMDD-NNNN` sequential job numbers |
| `handle_new_user()` | Trigger on auth.users INSERT: auto-creates profile with technician role |

### 5.4 Indexes

16 indexes on foreign keys and frequently queried columns (jobs by shop_id, status, priority, technician; customers by phone; profiles by shop_id/branch_id; etc.)

---

## 6. Migration History

| # | File | Purpose |
|---|---|---|
| 001 | `001_initial_schema.sql` | All tables, enums, indexes, triggers, functions |
| 002 | `002_rls_policies.sql` | RLS on 10 tables, helper functions, initial policies |
| 003 | `003_seed_data.sql` | Commented-out seed data (shop + branches) |
| 004 | `004_update_rls_policies_safe.sql` | Branch/role-scoped profiles, customers, jobs, branches |
| 005 | `005_fix_rls_issues.sql` | NULL branch_id fixes, has_branch_id() helper |
| — | `20260331124517_fix_rls_policies.sql` | Alternative/corrective version of 004 |
| 006 | `006_apply_correct_rls.sql` | Clean slate: drop all policies, recreate with final logic |
| 007 | `007_profiles_email.sql` | Add email column to profiles, backfill, update trigger |
| 008 | `008_backfill_profile_shop_id.sql` | Backfill NULL shop_id from super_admin |
| 009 | `009_service_manager_shop_wide_access.sql` | Elevate SM to shop-wide access |
| 010 | `010_jobs_delete_super_admin_only.sql` | Restrict DELETE to super_admin for jobs |
| 011 | `011_super_admin_jobs_delete_policy.sql` | Explicit DELETE policy for super_admin |

---

## 7. Key Business Logic

### 7.1 Job Number Format
`CC-YYYYMMDD-NNNN` — e.g., `CC-20260512-0001`. Generated by `get_next_job_number()` RPC. Sequential per date (resets daily).

### 7.2 Billing / Financial Calculation
A **database trigger** (`calculate_job_totals_trigger`) auto-computes on every INSERT/UPDATE:
- `total_charges = inspection_fee + service_charges + spare_parts_sum`
- `gst_amount` = 0 if `gst_enabled = false`, else `service_charges × 0.18`
- `grand_total = total_charges + gst_amount`
- `balance_amount = grand_total - advance_paid`

### 7.3 Job Status Workflow (10 statuses)
```
new → inspected → pending_approval → quote_sent → approved → spare_parts_pending → in_progress → completed
                → disapproved ─────────────────────────────────────────────────────────────────────────┐
                → cancelled ────────────────────────────────────────────────────────────────────────── │
```

### 7.4 PDF Documents
Three PDF types generated client-side via jsPDF:
- **Receipt** (on job creation, status = New)
- **Quote** (when charges entered, status = Quote Sent)
- **Invoice** (on completion, status = Completed)
All include: header, job info, customer details, product table (A-Z full detail), charges summary, signature footer.

### 7.5 Technician Filtering
When a technician logs in, `useJobs` automatically overrides filters to `{ technician_id: user.id }`, so they only see their assigned jobs. This is client-side + RLS enforced (RLS checks `assigned_technician_id = auth.uid()`).

---

## 8. API Routes

| Route | Method | Auth | Supabase Role | Purpose |
|---|---|---|---|---|
| `/api/users/create` | POST | super_admin | service_role key | Creates user in Auth + upserts profile |
| `/api/users/update-password` | POST | super_admin | service_role key | Resets user password (min 6 chars) |
| `/api/team` | GET | Any authenticated | service_role key | Returns profiles, backfills missing emails from Auth |

---

## 9. Environment Variables (from env.example)

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_NAME=Cam Clinic
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_SUPPORT_WHATSAPP=+918590377418
NEXT_PUBLIC_COMPANY_NAME=Supportta Solutions Private Limited
```

---

## 10. Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed:demo` | Seed 120+ demo jobs with products, spare parts, users |

---

## 11. Demo Seed Script (`scripts/seed-demo-jobs.ts`)

- **Purpose:** Bulk data seeding for development/testing
- **Scale:** 120 jobs, 24 auth users, 140 customers (deterministic RNG via mulberry32)
- **Usage:** `npm run seed:demo` (first run) or `npm run seed:demo -- --clean` (re-seed)
- **Job prefix:** `CC-SEED-NNNNN`
- **Tech stack data:** Real camera models (Sony Alpha 7 IV, Canon EOS R6 II, Nikon Z8, DJI, GoPro, etc.)
- **Auth pattern:** Creates users via `supabase.auth.admin.createUser()`, password `DemoSeed2026!`
- **Job variety:** All 10 statuses represented, all 4 priorities, variable products/accessories/parts per job

---

## 12. UI Component Patterns

### 12.1 Shared Conventions
- All dashboard pages: `'use client'`
- Data tables: Composable `<Table>` component with `<TableEmpty>` for no-results state
- Forms: React Hook Form + Zod with `@hookform/resolvers`
- Buttons: loading spinner during mutations (disabled state)
- Modals: Inline CRUD (add/edit in same modal, no route changes for simple CRUD)
- Colors: Tailwind v4 classes, light-only (`color-scheme: light` enforced in globals.css)
- Currency: Indian Rupee via `Intl.NumberFormat('en-IN')` — uses lakh/crore notation
- Avatars: Initials-based (2-letter from name) instead of images

### 12.2 Layout Structure
```
┌──────────────────────────────────────────────┐
│ Header (title, branch selector, bell icon)    │
├──────────┬───────────────────────────────────┤
│ Sidebar  │ Main Content Area                  │
│ (role-   │ (wrapped in ErrorBoundary)         │
│  filtered)│                                   │
│          │                                   │
│ Collaps- │                                   │
│ ible on  │                                   │
│ desktop  │                                   │
│ Drawer on│                                   │
│ mobile   │                                   │
└──────────┴───────────────────────────────────┘
```

### 12.3 Sidebar Navigation Items (Role-Filtered)
- **Dashboard** — All roles
- **Jobs** — All roles
- **Customers** — All roles
- **Team** — SA, SM, SI
- **Branches** — SA, SM, SI
- **Reports** — All roles (No specific role restriction in Sidebar)

---

## 13. Data Flow Patterns

### 13.1 Job Creation Flow
1. User fills `/jobs/new` form (customer search/create → products → job details)
2. Zod validates on submit
3. `useCreateJob()` mutation calls `createJob()` in `lib/db/jobs.ts`
4. `createJob()`: Calls `get_next_job_number()` RPC → inserts job → inserts products → inserts accessories/parts → inserts status_history
5. On success: invalidates `['jobs']` and `['jobCounts']` queries, shows success toast
6. Redirects to `/jobs` or `/jobs/:id`

### 13.2 Job Edit Flow
1. User visits `/jobs/:id/edit`
2. Form pre-populated from `useJob(id)` data
3. User can change customer, job details, products (with sync of accessories/other_parts via bulk clear + re-add)
4. Spare parts managed via inline add/remove rows in `useBilling` mutations
5. On submit: `useUpdateJob()` mutation, then `router.replace('/jobs/' + id)` to avoid back-navigation loop

### 13.3 Dashboard Stats Flow
1. `useDashboardStats(branchId?)` calls `getDashboardStats()` in `lib/db/reports.ts`
2. Runs 5 parallel Supabase queries: total jobs, jobs today, pending, completed, revenue + balance
3. Returns `DashboardStats` with 6 stat card values
4. Right panel shows "Jobs by Status" breakdown + "Jobs Due Today" list

---

## 14. Testing / Known Issues

- **No test files exist** in the project (`*.test.*`, `*.spec.*` — none found)
- **No CI/CD** configured beyond Vercel auto-deploy
- **Pending:** Audit logging, time-based access, IP restrictions, data encryption (noted in ROLE_BASED_ACCESS.md)
- **Edge case:** Corporate browsers may block localStorage — `branchStore` has a safe fallback to `sessionStorage`

---

## 15. Strategic Notes for Development

1. **All pages are client components** — server components not used in dashboard. Could migrate some data-fetching to server components for performance.
2. **React Compiler** is enabled (`reactCompiler: true` in `next.config.ts`) — Next.js 16 feature, ensures memoization without `useMemo`/`useCallback` in most cases.
3. **No dark mode** supported — CSS explicitly forces `color-scheme: light`.
4. **Branch selection** is persisted across sessions via localStorage. When a user selects a branch filter, it affects jobs, dashboard stats, and reports.
5. **Job number generation** uses the database RPC — the TypeScript utility (`lib/utils/jobNumber.ts`) exists but the DB is the source of truth.
6. **Service Manager has been elevated** to shop-wide operational access (mig 009), making them nearly as powerful as super_admin for daily operations, just without user management (create/update profiles).
7. **The timestamp migration** (`20260331124517_fix_rls_policies.sql`) is a duplicate/corrective version of mig 004 — likely applied in some environments alongside 004-006. Careful when reapplying.
8. **Seed data migration (003)** is fully commented out — seeding is done via the standalone TypeScript script instead.

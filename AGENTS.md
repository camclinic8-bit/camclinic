# Cam Clinic — Agent Context (Index)

> Camera service management system for multi-branch Indian camera shops. Next.js 16, Supabase, TypeScript, GST/INR.

## Identity
**cam-clinic** v0.1.0 | Supportta Solutions Pvt Ltd | Deployed on Vercel (sin1)
Admin: `camclinic8@gmail.com` / `admin123`

## Tech Stack
Next.js 16.2 / React 19.2 / TS5 strict / Tailwind v4 / Supabase SSR / TanStack Query 5 / Zustand 5 / RHF 7 / Zod 4 / jsPDF / Lucide / Sonner / date-fns

## How to Use — Read Index First, Then Pick Detail File

| Task | Read this first | Then read |
|---|---|---|
| Any task | `AGENTS.md` (index) | Relevant file(s) below |
| Pages, routes, login, API | `AGENTS_PAGES.md` | — |
| UI/Job/Layout components | `AGENTS_COMPONENTS.md` | — |
| Hooks (useJobs, etc.) + Zustand stores | `AGENTS_HOOKS_STORES.md` | — |
| DB queries + Supabase clients + migrations | `AGENTS_DB.md` | — |
| TypeScript types + Zod validation | `AGENTS_TYPES_VALIDATION.md` | — |
| Currency, dates, PDF, initials, etc. | `AGENTS_UTILS.md` | — |

## Dir Map
| Dir | # Files | What |
|---|---|---|
| `src/app/` | 19 | Root layout, login, 7 dashboard pages, 3 API routes, CSS, providers |
| `src/components/ui/` | 10 | Button, Input, Select, Card, Badge, Modal, Table, ChipInput, ErrorBoundary, barrel |
| `src/components/jobs/` | 4 | JobCard, JobPriorityBadge, JobStatusBadge, ProductWarrantyFields |
| `src/components/layout/` | 4 | Sidebar, Header, BranchSelector, barrel |
| `src/hooks/` | 8 | useAuth, useJobs, useCustomers, useBranches, useTechnicians, useBilling, useProducts, useReports |
| `src/stores/` | 3 | authStore, branchStore, uiStore |
| `src/lib/db/` | 7 | jobs, customers, branches, technicians, billing, products, reports + barrel |
| `src/lib/supabase/` | 3 | client (browser), server (SSR), middleware |
| `src/lib/utils/` | 7 | currency, dates, jobNumber, initials, jobProducts, normalizeJobProduct, pdf + barrel |
| `src/lib/validation/` | 1 | optionalFields (Zod schemas) |
| `src/types/` | 8 | enums, database, user, branch, customer, job, technician, billing + barrel |
| `supabase/migrations/` | 12 | SQL migrations |
| `scripts/` | 1 | seed-demo-jobs.ts |

## Enums
- `user_role`: super_admin | service_manager | service_incharge | technician
- `job_status` (10): new → inspected → pending_approval → quote_sent → approved → disapproved → spare_parts_pending → in_progress → completed → cancelled
- `job_priority`: immediate | high | medium | low
- `product_condition`: good | dusty | scratches | damage | not_working | dead

## Permission Flags (computed in `useAuth()`)
- `canManageJobs`: SA/SM/SI | `canManageBranches`: SA/SM | `canManageUsers`: SA only
- `canViewAllBranches`: SA/SM | `canSetAnyStatus`: SA/SM

## Key Business Rules
- Job # format: `CC-YYYYMMDD-NNNN` (DB RPC `get_next_job_number`)
- Finance trigger: `total_charges = inspection_fee + service_charges + spare_parts`; `gst = service_charges × 0.18` (if enabled); `grand_total = total_charges + gst`; `balance = grand_total - advance_paid`
- Technician sees only assigned jobs (client filter + RLS)
- Only super_admin can DELETE jobs (mig 010-011)

## Scripts
`npm run dev` / `npm run build` / `npm start` / `npm run lint` / `npm run seed:demo`

---

## Project Notes

### Security: CVE-2026-45321 (TanStack Supply-Chain Attack)
**Status**: ✅ **Not affected** — no action required.

This project uses `@tanstack/react-query@5.95.2` (Query family), which was **not affected** by the May 11, 2026 supply-chain attack on the router/start monorepo. See `README.md` Security section for full details.

### Critical Fixes (2026-05-16)
See `PROJECT_JOURNEY.md` for the full session log. Key fixes:

1. **GST Calculation Mismatch** (`src/app/(dashboard)/jobs/[id]/edit/page.tsx`)
   - Frontend was calculating GST on the full subtotal; DB trigger only taxes `service_charges`.
   - Fixed frontend formula to match DB: `gst = service_charges × 0.18`.

2. **Missing Error Handling** (`src/lib/db/jobs.ts`)
   - `createJob`, `updateJob`, `updateJobStatus` now properly check and throw on:
     - Failed current job fetches (`fetchError`)
     - Failed `job_status_history` inserts (`historyError`)
   - Previously these failures were silent, meaning audit trails could disappear without error.

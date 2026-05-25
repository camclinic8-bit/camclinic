# Cam Clinic — Pages & API Routes

## Middleware `src/middleware.ts`
Exports: `middleware(request)` — calls `updateSession()` from `@/lib/supabase/middleware`
Matches: `/dashboard/*`, `/jobs/*`, `/customers/*`, `/technicians/*`, `/branches/*`, `/reports/*`, `/settings/*`, `/login`

## Root `src/app/`

| File | Route | What it does |
|---|---|---|
| `layout.tsx` | — | Root HTML: `<html lang="en" className="h-full light">`, body `bg-gray-50`, wraps in `<Providers>` |
| `page.tsx` | `/` | Redirects to `/dashboard` |
| `globals.css` | — | `@import "tailwindcss"`, `color-scheme: light only`, inputs white bg |
| `providers.tsx` | — | QueryClientProvider (stale 5min, gc 10min, retry 1) + AuthInitializer + RealtimeInitializer + Toaster |

## Auth `src/app/(auth)/`

| File | Route | What it does |
|---|---|---|
| `login/page.tsx` | `/login` | Email/password form, RHF + Zod, calls `useAuth().signIn()`, error on failure. Branding: camera icon + company footer |

## Dashboard Layout `src/app/(dashboard)/`

| File | Route | What it does |
|---|---|---|
| `layout.tsx` | — | AuthGate: reads authStore, shows skeleton while loading, redirects to login if not auth. Renders `<Sidebar>` + `<main>` + `<ErrorBoundary>` |

## Dashboard Pages `src/app/(dashboard)/`

| File | Route | Key hooks/features |
|---|---|---|
| `dashboard/page.tsx` | `/dashboard` | useDashboardStats + useJobCounts + useJobsDueToday. 6 stat cards, status breakdown, due-today list |
| `jobs/page.tsx` | `/jobs` | useJobs(filters). Search (250ms debounce), status/priority/sort filters, pagination 20/50/100. SA sees delete trash icon |
| `jobs/new/page.tsx` | `/jobs/new` | useCreateJob(). 3 cards: customer (search/create), details (branch, priority, incharge, etc.), products (field array) |
| `jobs/[id]/page.tsx` | `/jobs/:id` | useJob(id). Left: customer, products, description, notes, status history. Right: status dropdown, edit, PDF docs, charges+payment, assignment |
| `jobs/[id]/edit/page.tsx` | `/jobs/:id/edit` | useJob(id) + useUpdateJob. Pre-populated edit form. Products sync (deletes/updates/creates). Spare parts inline CRUD |
| `customers/page.tsx` | `/customers` | useCustomers + useSearchCustomers. Searchable table, inline CRUD modal, pagination |
| `technicians/page.tsx` | `/technicians` | Dual-mode: non-SA sees read-only table; SA sees full user mgmt (add, edit role/branch, password reset modal) |
| `branches/page.tsx` | `/branches` | Card grid, edit/deactivate buttons, add modal. Empty state: "Add First Branch" |
| `reports/page.tsx` | `/reports` | Filters: status + date range. Summary cards + table + CSV export |

## API Routes `src/app/api/`

| File | Route | Method | Auth | What it does |
|---|---|---|---|---|
| `users/create/route.ts` | `/api/users/create` | POST | SA only | Uses service_role key, calls `supabaseAdmin.auth.admin.createUser()`, upserts profile |
| `users/update-password/route.ts` | `/api/users/update-password` | POST | SA only | `supabaseAdmin.auth.admin.updateUserById()` |
| `team/route.ts` | `/api/team` | GET | Any auth | Returns profiles list, SA/SM see all, others see filtered (active techs/inch/mgr) |

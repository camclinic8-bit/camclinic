# Cam Clinic — Hooks & Stores

## Hooks `src/hooks/` (React Query)

### `useAuth.ts`
Returns: `{ user, isLoading, isAuthenticated, signIn, signOut, isSuperAdmin, isServiceManager, isServiceIncharge, isTechnician, canManageJobs, canManageBranches, canManageUsers, canViewAllBranches, canSetAnyStatus }`
- signIn(email, pw): calls supabase.auth.signInWithPassword, pushes /dashboard
- signOut(): calls supabase.auth.signOut, authStore.logout(), pushes /login

### `useJobs.ts`
- `useJobs(filters?, page?, pageSize?)` — queryKey: ['jobs',...], stale 5min. Auto-overrides technician_id for TECH role
- `useJob(id)` — queryKey: ['job', id], stale 5min, gc 30min
- `useCreateJob()` — mutation, invalidates ['jobs', 'jobCounts']
- `useUpdateJob()` — mutation, invalidates ['jobs', 'job', id, 'jobCounts']
- `useUpdateJobStatus()` — mutation, invalidates ['jobs', 'job', id, 'jobCounts']
- `useDeleteJob()` — mutation, invalidates ['jobs', 'job', id, 'jobCounts', 'jobsDueToday']
- `useJobCounts(branchId?)` — queryKey: ['jobCounts'], stale 1min
- `useJobsDueToday(branchId?)` — queryKey: ['jobsDueToday'], stale 1min

### `useCustomers.ts`
- `useCustomers(page?, pageSize?, search?)` — queryKey: ['customers',...], stale 1min
- `useCustomer(id)` — queryKey: ['customer', id], stale 1min
- `useSearchCustomers(query)` — queryKey: ['searchCustomers', query], enabled when query.length >= 2
- `useCreateCustomer()` — mutation, invalidates ['customers', 'searchCustomers']
- `useUpdateCustomer()` — mutation, invalidates ['customers', 'customer', id]

### `useBranches.ts`
- `useBranches()` — active only (is_active=true), queryKey: ['branches'], stale 5min
- `useAllBranches()` — all regardless of active, enabled for SA/SM/SI, stale 5min
- `useBranch(id)` — queryKey: ['branch', id]
- `useCreateBranch()` — mutation, invalidates ['branches', 'allBranches']
- `useUpdateBranch()` — mutation, invalidates ['branches', 'allBranches', 'branch', id]
- `useDeleteBranch()` — mutation (soft delete), invalidates ['branches', 'allBranches']

### `useTechnicians.ts`
- `useTechnicians(branchId?)` — active techs + incharges, stale 1min
- `useServiceIncharges(branchId?)` — active service_incharge, stale 1min
- `useTechnician(id)` — single with job counts
- `useAllUsers()` — all profiles, SA only
- `useTeamMembers()` — via GET /api/team, SA/SM see all, others filtered
- `useUpdateUserProfile()` — mutation patches role/branch_id/is_active. Invalidates all above

### `useBilling.ts`
- `useSpareParts(jobId)` — queryKey: ['spareParts', jobId], stale 30s
- `useAddSparePart(jobId)` — mutation, optimistic update (append + sort), syncs job cache
- `useUpdateSparePart(jobId)` — mutation, optimistic update (replace in-place)
- `useDeleteSparePart(jobId)` — mutation, optimistic update (filter out)
- `useUpdateJobCharges(jobId)` — mutation for advance payment, invalidates ['job', 'jobs']

### `useProducts.ts`
- `useUpdateProduct(jobId)` — mutation, invalidates ['job', jobId]
- `useAddAccessory(jobId)`, `useRemoveAccessory(jobId)` — mutations, invalidate ['job', jobId]
- `useAddOtherPart(jobId)`, `useRemoveOtherPart(jobId)` — mutations, invalidate ['job', jobId]

### `useReports.ts`
- `useJobsReport(filters?)` — queryKey: ['jobsReport'], stale 1min
- `useDashboardStats(branchId?)` — queryKey: ['dashboardStats'], stale 1min

## Stores `src/stores/` (Zustand)

### `authStore.ts`
State: `user: Profile|null` (null), `isLoading: boolean` (true), `isAuthenticated: boolean` (false)
Actions: `setUser(u)`, `setLoading(b)`, `setAuthenticated(b)`, `logout()` (resets all)

### `branchStore.ts`
State: `selectedBranchId: string|null` (null)
Actions: `setSelectedBranch(id)`
Persistence: localStorage key `cam-clinic-branch`, falls back to sessionStorage

### `uiStore.ts`
State: `sidebarOpen: boolean` (true), `sidebarCollapsed: boolean` (false)
Actions: `toggleSidebar()`, `setSidebarOpen(b)`, `toggleSidebarCollapsed()`

## 18. Detailed Custom Hooks & Zustand Stores Reference Manual

This section provides an exhaustive guide to the states, actions, parameters, return signatures, and query key configurations for all custom React hooks and Zustand stores in the Cam Clinic codebase.

---

### 18.1 Zustand Stores Specifications

#### 18.1.1 Authentication Store (`authStore.ts`)
The `authStore` manages the identity, authorization level, and active session of the logged-in user.

- **State Interface (`AuthState`)**:
  - `user`: `Profile | null` — The public profile metadata (name, email, role, branch, shop).
  - `session`: `Session | null` — The active Supabase OAuth/JWT session.
  - `isLoading`: `boolean` — True while checking session status on mount.
  - `isAuthenticated`: `boolean` — Computed helper derived from the presence of a valid session.
- **Actions**:
  - `setUser(user)`: Hydrates the store with the authenticated user profile.
  - `setSession(session)`: Saves the JWT token session details.
  - `setLoading(isLoading)`: Updates the loading state.
  - `setAuthenticated(isAuthenticated)`: Explicitly sets authentication state.
  - `logout()`: Resets all auth state variables to null.
- **State Selection Examples**:
  ```typescript
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  ```

#### 18.1.2 Branch Store (`branchStore.ts`)
The `branchStore` provides the current branch scoping mechanism. It restricts the data viewed on lists, reports, and dashboards.

- **State Interface (`BranchState`)**:
  - `selectedBranchId`: `string | null` — The UUID of the selected branch. If `null`, matches "All Branches".
- **Actions**:
  - `setSelectedBranchId(id)`: Sets the active branch scope.
  - `clearBranch()`: Resets the scope to `null` (All Branches).
- **Business Logic Constraints**:
  - Only users with Super Admin or Service Manager roles can change this selection.
  - Service Incharges and Technicians are locked to their assigned branches, so the UI disables selection changes for them.

#### 18.1.3 UI Store (`uiStore.ts`)
Manages dashboard navigation visual states.

- **State Interface (`UIState`)**:
  - `sidebarOpen`: `boolean` — Mobile sidebar menu display state.
  - `activeModal`: `string | null` — Active overlay modal key.
- **Actions**:
  - `toggleSidebar()`: Opens or closes the sidebar menu.
  - `setSidebar(isOpen)`: Direct sidebar visibility set.
  - `setActiveModal(modalName)`: Launches or closes a modal dialog.

---

### 18.2 Custom React Hooks specifications

All data querying, validation, and mutations are wrapped inside custom React Query hooks.

#### 18.2.1 `useAuth` Hook
- **Purpose**: Computes role flags and simplifies component checks.
- **Exports**:
  - `user`: Mapped profile.
  - `role`: Active user role enum value.
  - `isSuperAdmin`: True if role matches `super_admin`.
  - `isServiceManager`: True if role matches `service_manager`.
  - `isServiceIncharge`: True if role matches `service_incharge`.
  - `isTechnician`: True if role matches `technician`.
  - `canManageJobs`: Computed as `super_admin`, `service_manager`, or `service_incharge`.
  - `canManageBranches`: Computed as `super_admin` or `service_manager`.
  - `canManageUsers`: Computed as `super_admin` only.
  - `canViewAllBranches`: Computed as `super_admin` or `service_manager`.
  - `canSetAnyStatus`: Computed as `super_admin` or `service_manager`.

#### 18.2.2 `useJobs` Hook
- **Parameters**:
  - `filters`: `JobFilters` — Contains search term, status, priority, branch ID, technician ID, sort options, and date ranges.
  - `pageSize`: `number` (default: 20).
- **Return Type**: `UseInfiniteQueryResult<{ data: JobWithRelations[]; count: number }>`
- **Internal Query Key**: `queryKeys.jobs.list(filters)`
- **Behavior**:
  - Integrates infinite scrolling logic.
  - Automatically overrides filters for Technician roles, restricting their visibility to assigned tasks.
  - If a filter parameter is updated, it invalidates the current page parameters and restarts the query from page 1.

#### 18.2.3 `useCreateJob` Hook
- **Mutation Type**: `UseMutationResult<Job, Error, JobCreateInput>`
- **Behavior**:
  - Calls `createJob` transactional RPC.
  - On success, it calls `invalidateQueries` for:
    - `queryKeys.jobs.all` (Refreshes the main list and counts).
    - `queryKeys.jobs.counts()` (Refreshes the status count summary).
  - Displays a toast notification upon completion.

#### 18.2.4 `useUpdateJob` Hook
- **Mutation Type**: `UseMutationResult<Job, Error, { id: string; input: JobUpdateInput }>`
- **Behavior**:
  - Updates job card fields.
  - On success, it invalidates the job's detail cache key: `queryKeys.jobs.detail(id)`.

#### 18.2.5 `useUpdateJobStatus` Hook
- **Mutation Type**: `UseMutationResult<Job, Error, { id: string; status: JobStatus; notes?: string }>`
- **Behavior**:
  - Triggers status updates and records transitions in the history logs.
  - Clears cached lists and counts, updating UI metrics instantly.

#### 18.2.6 `useDeleteJob` Hook
- **Mutation Type**: `UseMutationResult<void, Error, string>`
- **Behavior**:
  - Removes a job record.
  - Restricted to Super Admins.
  - Invalidates job list caches, count caches, and due-today list caches.

#### 18.2.7 `useJob` Hook
- **Parameters**: `id: string`
- **Return Type**: `UseQueryResult<JobWithRelations | null>`
- **Behavior**:
  - Fetches complete job details (customer details, products, accessories, spare parts, status histories, payment ledgers).
  - Caches details for 5 minutes (`staleTime: 5 * 60 * 1000`) and garbage collects unused details after 30 minutes.

#### 18.2.8 `useCustomers` Hook
- **Query Types**:
  - `useCustomers(search, limit)`: Paginated customer search.
  - `useCustomer(id)`: Fetches a single customer's details.
  - `useCustomerJobs(customerId)`: Fetches repair history for a customer.
- **Mutation Types**:
  - `useCreateCustomer()`: Creates a new customer profile.
  - `useUpdateCustomer()`: Edits customer contact details.

#### 18.2.9 `useBranches` Hook
- **Query Types**:
  - `useBranches()`: Returns a list of active branches.
  - `useBranch(id)`: Returns details of a specific branch.
- **Mutation Types**:
  - `useCreateBranch()`: Registers a new branch location (restricted).
  - `useUpdateBranch()`: Edits branch configuration details.

#### 18.2.10 `useTechnicians` Hook
- **Query Types**:
  - `useTechnicians()`: Fetches a list of active technicians to populate assignment dropdowns.
  - `useServiceIncharges()`: Fetches active service incharges.

#### 18.2.11 `useBilling` Hook
- **Mutation Types**:
  - `useAddPayment()`: Registers a new payment transaction.
  - `useAddSparePart()`: Inserts a new spare part and HSN code.
  - `useRemoveSparePart()`: Deletes a spare part.

#### 18.2.12 `useReports` Hook
- **Query Types**:
  - `useDashboardStats(branchId)`: Fetches metrics for the dashboard cards.
  - `useFinancialReport(filters)`: Returns transaction statements for analysis and CSV export.

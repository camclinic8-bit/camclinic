## 31. React Query Caching & Invalidation Matrices

This section documents the React Query caching layer, query key mappings, and cache invalidation matrices triggered by mutation operations or real-time WebSockets events.

---

### 31.1 React Query Key Catalog

The query key structure ensures that data queries are segregated and cached independently:

- **\`['jobs', 'list', filters]\`**: Cached jobs list. The cache is scoped to the branch filter, search query, status, priority, and sorting configuration.
- **\`['jobs', 'detail', jobId]\`**: Single job details cache, housing product conditions, payments history, and status logs.
- **\`['jobs', 'counts', branchId]\`**: Status-grouped counts.
- **\`['jobs', 'due-today', branchId]\`**: List of jobs with estimated delivery dates set to today.
- **\`['customers', 'search', query]\`**: Customer search queries.
- **\`['customers', 'detail', customerId]\`**: Specific customer records.
- **\`['customers', 'jobs', customerId]\`**: History of jobs for a customer.
- **\`['branches', 'list']\`**: Active branch list.
- **\`['branches', 'detail', branchId]\`**: Specific branch details.
- **\`['technicians', 'list']\`**: Employee user profiles with technician roles.
- **\`['incharges', 'list']\`**: Employee user profiles with service incharge roles.
- **\`['reports', 'dashboard', branchId]\`**: Dashboard cards revenue metrics.
- **\`['reports', 'jobs', filters]\`**: Transaction ledgers for Excel exports.

---

### 31.2 Caching Configurations
Default options are configured globally in [providers.tsx](file:///e:/PROJECTS/camclinic/src/app/providers.tsx):
- **\`staleTime\`**: `5 * 60 * 1000` (5 minutes). Query data is treated as fresh for 5 minutes, preventing redundant network queries during page navigation.
- **\`gcTime\`** (formerly `cacheTime`): `10 * 60 * 1000` (10 minutes). Unused query cache entries are garbage-collected after 10 minutes.
- **\`refetchOnWindowFocus\`**: `false`. Prevents automatic queries when switching browser tabs.
- **\`retry\`**: `1`. Network errors trigger exactly one retry before failing.
- **\`retryDelay\`**: `1000` ms (1 second).

---

### 31.3 Cache Invalidation Matrix

The table below maps mutation operations to the query caches they invalidate to trigger automatic updates.

| Mutation Hook | Action Performed | Invalidated Query Keys | Expected UI Outcome |
|---|---|---|---|
| **`useCreateJob`** | Inserts a new job card | `['jobs']` (all lists)<br>`['jobs', 'counts']` | Redraws active queues; updates metric count cards on dashboard. |
| **`useUpdateJob`** | Modifies job card details | `['jobs', 'detail', jobId]` | Updates detail panels; updates lists if sorting details changed. |
| **`useUpdateJobStatus`** | Modifies status fields | `['jobs']` (all lists)<br>`['jobs', 'detail', jobId]`<br>`['jobs', 'counts']` | Moves row to appropriate pipeline stage; updates details status badge. |
| **`useDeleteJob`** | Deletes a job card | `['jobs']` (all lists)<br>`['jobs', 'counts']`<br>`['jobs', 'due-today']` | Removes job row from table; updates dashboard counts. |
| **`useCreateCustomer`** | Registers a customer | `['customers']` | Updates customer list dropdown search. |
| **`useUpdateCustomer`** | Edits customer details | `['customers', 'detail', custId]` | Updates customer card. |
| **`useAddPayment`** | Records a payment entry | `['jobs', 'detail', jobId]` | Re-calculates job balance; adds row to payments history table. |
| **`useAddSparePart`** | Inserts a spare part | `['jobs', 'detail', jobId]` | Re-calculates total charges; adds row to spare parts table. |
| **`useRemoveSparePart`** | Deletes a spare part | `['jobs', 'detail', jobId]` | Re-calculates total charges; removes row from spare parts table. |

---

### 31.4 Real-time PostgreSQL Subscription Updates

When updates occur directly in the database (e.g. from an administrative script or another employee's browser), the Real-time subscriber replicates the changes to the React Query cache:

- **`jobs` Table Changes (INSERT, UPDATE, DELETE)**:
  - Invalidates `['jobs']`.
  - Invalidates `['jobs', 'counts']`.
  - Invalidates `['jobs', 'due-today']`.
  - Invalidates `['reports', 'dashboard']`.
- **`job_status_history` Table Changes (INSERT)**:
  - Invalidates `['jobs']`.
  - Invalidates `['jobs', 'counts']`.
  - Invalidates `['jobs', 'due-today']`.
  - Invalidates `['reports', 'dashboard']`.
- **`payment_transactions` Table Changes (INSERT)**:
  - Invalidates `['jobs']`.
  - Invalidates `['reports', 'dashboard']`.

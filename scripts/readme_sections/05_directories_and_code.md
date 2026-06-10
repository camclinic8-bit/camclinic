## 6. Directory Map & Code Modules

Below is the directory map of the Cam Clinic codebase, followed by explanations of key modules.

```
cam-clinic/
├── scripts/                          # Seeding and utility scripts
│   ├── seed-demo-jobs.ts             # Seeds 120+ jobs, parts, payments, and users
│   └── generate_readme.js            # Consolidates sections into README.md
├── supabase/                         # Supabase backend schema
│   ├── config.toml                   # CLI configuration
│   └── migrations/                   # SQL migration scripts
├── src/
│   ├── app/                          # Next.js App Router root
│   │   ├── (auth)/                   # Public auth routes
│   │   │   └── login/
│   │   │       └── page.tsx          # Login UI with credentials validation
│   │   ├── (dashboard)/              # Protected dashboard pages
│   │   │   ├── branches/
│   │   │   │   └── page.tsx          # Branch settings & management
│   │   │   ├── customers/
│   │   │   │   └── page.tsx          # Customers table & search
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # Main metrics & daily due checklist
│   │   │   ├── inventory/
│   │   │   │   ├── page.tsx          # Spare parts inventory & price sheets
│   │   │   │   └── accessories/
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx          # Main scrollable jobs list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Multi-product intake form
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Job card details & action logs
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx  # Edit charges, status, & items
│   │   │   ├── reports/
│   │   │   │   └── page.tsx          # Financial audits & CSV exports
│   │   │   ├── technicians/
│   │   │   │   └── page.tsx          # Technician task tracking
│   │   │   ├── terms/
│   │   │   │   └── page.tsx          # T&C template editor
│   │   │   └── layout.tsx            # Main shell with sidebar and gate
│   │   ├── api/                      # Backend proxy endpoints
│   │   │   ├── team/                 # Fetches staff list
│   │   │   ├── users/create/         # Admin creation API
│   │   │   └── users/update-password/
│   │   ├── globals.css               # CSS styling configurations
│   │   ├── layout.tsx                # Base page wrapper
│   │   └── providers.tsx             # React-Query, Auth, and Toast providers
│   ├── components/                   # UI and layout component library
│   │   ├── layout/                   # Shell components
│   │   │   ├── Header.tsx            # Dynamic top navbar & branch indicator
│   │   │   ├── Sidebar.tsx           # Navigation links based on RBAC
│   │   │   └── BranchSelector.tsx    # Scope switching selector
│   │   ├── jobs/                     # Job card components
│   │   │   ├── JobCard.tsx           # Standard job card preview
│   │   │   ├── JobStatusBadge.tsx    # Colorful status indicator
│   │   │   ├── JobPriorityBadge.tsx  # Priority indicator
│   │   │   └── ProductWarrantyFields.tsx
│   │   └── ui/                       # Reusable UI primitives
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       ├── Modal.tsx
│   │       ├── Table.tsx             # Customized table layout
│   │       └── ErrorBoundary.tsx     # Prevents UI crashes
│   ├── hooks/                        # Custom React Query custom hooks
│   │   ├── useAuth.ts                # Session state & permission flags
│   │   ├── useJobs.ts                # Infinite lists, counts, and mutations
│   │   ├── useCustomers.ts           # Customer profile management hooks
│   │   ├── useBranches.ts            # Read/write branch details hooks
│   │   ├── useTechnicians.ts         # Technician job queue hooks
│   │   ├── useBilling.ts             # Spare parts & transactions hooks
│   │   └── useReports.ts             # Analytics & dashboard statistics
│   ├── stores/                       # Zustand stores
│   │   ├── authStore.ts              # Session and profile state
│   │   ├── branchStore.ts            # Active branch context
│   │   └── uiStore.ts                # Dialogs & layout toggle states
│   ├── lib/                          # Backend DB & core utility libraries
│   │   ├── db/                       # Supabase client query functions
│   │   │   ├── jobs.ts               # Core job SQL client integrations
│   │   │   ├── branches.ts           # Branch configs database clients
│   │   │   ├── customers.ts          # Customer profile database queries
│   │   │   └── technicians.ts
│   │   ├── supabase/                 # SSR & Client config initializers
│   │   └── utils/                    # Data formatters & algorithms
│   │       ├── currency.ts           # INR formatting utils
│   │       ├── dates.ts              # Date-fns wrapper formatters
│   │       ├── pdf.ts                # PDF Generation & styling engine
│   │       └── initials.ts           # Generates typography initials
│   └── types/                        # Strict TypeScript models
```

---

### 6.1 Zustand State Stores

#### 6.1.1 `authStore.ts`
Manages the active session profile. Hydrates on load using Supabase Auth state changes.
```typescript
interface AuthState {
  user: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: Profile | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  logout: () => void;
}
```

#### 6.1.2 `branchStore.ts`
Holds the currently selected branch scope. If set to `null`, queries fetch data globally across all branches (only accessible by Super Admin and Service Manager roles).
```typescript
interface BranchState {
  selectedBranchId: string | null;
  setSelectedBranchId: (id: string | null) => void;
  clearBranch: () => void;
}
```

---

### 6.2 Core Hooks & Query Keys

#### 6.2.1 `useJobs.ts`
Implements infinite scroll queries and data modification mutations.
- `useJobs(filters, pageSize)`: Uses `useInfiniteQuery` to paginate through `getJobs(...)` using page keys.
- `useCreateJob()`: Mutation that handles job cards creation, triggering invalidation of list caches.
- `useUpdateJob()`: Updates job information.
- `useUpdateJobStatus()`: Specialized mutation to update job statuses and write to `job_status_history`.
- `useDeleteJob()`: Restricted mutation to remove jobs (Super Admin only).

---

### 6.3 PDF Document Generation Utility (`pdf.ts`)

This utility builds print-ready A4 documentation dynamically in the browser. It uses `jspdf` and `jspdf-autotable`.

- **`generateReceipt(job)`**: Generates the initial intake sheet. Contains customer details, product condition checklist, accessories, reported problems, and any advance paid.
- **`generateQuote(job)`**: Generates the cost estimation quote. Formats spare parts prices, GST calculations, and repair timelines for client approval.
- **`generateInvoice(job)`**: Generates the final Tax Invoice. Displays HSN codes, labor fees, GST details, amount paid, and zero-balance status.

#### Structural Layout of the Generated PDFs:
1. **Header Block**: A single rectangle border containing the shop logo on the left and the branch contact info (Address, Email, Phone, and GSTIN) on the right.
2. **Details Card**: A side-by-side split box containing customer details on the left and job/ticket details on the right.
3. **Products Table**: A clean table summarizing equipment model, serial numbers, conditions, and remarks.
4. **Billing Summary**: A right-aligned summary block showing the subtotal, GST (18%), grand total, payments made, and final balance due.
5. **Footer Notes**: Displays term regulations, warranty descriptions, and signature blocks.

const fs = require('fs');
const path = require('path');

const SECTIONS_DIR = path.join(__dirname, 'readme_sections');
const OUTPUT_FILE = path.join(__dirname, '..', 'README.md');

// Read all files in the directory
const files = fs.readdirSync(SECTIONS_DIR)
  .filter(f => f.endsWith('.md'))
  .sort();

console.log(`Found ${files.length} markdown sections to combine.`);

let readmeContent = '';

// Read and append each section
files.forEach((file) => {
  const filePath = path.join(SECTIONS_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  readmeContent += content + '\n\n';
});

// Add exhaustive codebase dictionary section
readmeContent += `
## 29. Exhaustive Codebase Directory Reference (A-Z)

This section provides an alphabetical reference for every file in the project.

---

### 29.1 Application Pages & Routing (src/app/)

#### 1. src/app/layout.tsx
- **Role**: Root layout of the application.
- **Implementation**: Sets up the HTML document structure, embeds fonts, and wraps children in the \`Providers\` component.
- **Design Decisions**: Standardizes global styling resets and ensures base HTML elements align correctly.

#### 2. src/app/providers.tsx
- **Role**: Global providers configuration.
- **Implementation**: Initializes React Query's \`QueryClient\` with a 5-minute stale time. Sets up the Supabase auth listener to synchronize session changes with the Zustand \`authStore\`, and runs the real-time Postgres listener to invalidate caches when changes are detected.
- **Design Decisions**: Implements a safety timeout to prevent infinite loading state skeletons if session restores fail.

#### 3. src/app/globals.css
- **Role**: Global CSS configuration.
- **Implementation**: Imports Tailwind v4 and configures custom theme variables (like HSL colors, scrollbars, and layouts).

#### 4. src/app/page.tsx
- **Role**: Root page router.
- **Implementation**: Redirects authenticated users to \`/dashboard\` and unauthenticated users to \`/login\`.

#### 5. src/app/(auth)/login/page.tsx
- **Role**: Login page interface.
- **Implementation**: Displays email and password inputs validated using Zod. Authenticates users using the Supabase client SDK and triggers error toasts on failure.

#### 6. src/app/(dashboard)/layout.tsx
- **Role**: Shell layout for dashboard pages.
- **Implementation**: Renders the \`Sidebar\` alongside the main content area wrapped in the \`ErrorBoundary\`. Includes the \`AuthGate\` component to restrict access to authenticated users.

#### 7. src/app/(dashboard)/dashboard/page.tsx
- **Role**: Main portal metrics dashboard.
- **Implementation**: Renders metric cards (total jobs, today's jobs, pending jobs, completed jobs, total revenue, pending balance) and displays jobs due today using \`JobCard\`.

#### 8. src/app/(dashboard)/branches/page.tsx
- **Role**: Branch settings dashboard.
- **Implementation**: Displays branch profiles in a table layout and lets managers update address details, landlines, and contact phone numbers.

#### 9. src/app/(dashboard)/customers/page.tsx
- **Role**: Customers management page.
- **Implementation**: Searchable customer directories table. Features a click-through behavior to view a customer's detailed repair histories.

#### 10. src/app/(dashboard)/inventory/page.tsx
- **Role**: Spare parts catalog.
- **Implementation**: Lists spare parts inventory and unit prices, and integrates catalog selections with the billing edit modals.

#### 11. src/app/(dashboard)/jobs/page.tsx
- **Role**: Scrollable active jobs list.
- **Implementation**: Configures the main scroll container to handle horizontal and vertical scrolling, and implements sticky table headers. Includes mouse-drag scrolling and click guarding to prevent accidental redirects during drag gestures.

#### 12. src/app/(dashboard)/jobs/new/page.tsx
- **Role**: Multi-product intake form.
- **Implementation**: Intake panel for registering customers, camera gear, conditions, accessories, and advance payments. Uses database RPCs for transactional saves.

#### 13. src/app/(dashboard)/jobs/[id]/page.tsx
- **Role**: Job Card details view.
- **Implementation**: Displays job details, cosmetic checklists, repair status audit logs, and payment transactions. Provides print actions to download receipt, quote, and invoice PDFs.

#### 14. src/app/(dashboard)/jobs/[id]/edit/page.tsx
- **Role**: Job editor interface.
- **Implementation**: Allows updating labor costs, parts lists, status transitions, and technician assignments.

#### 15. src/app/(dashboard)/reports/page.tsx
- **Role**: Financial reports page.
- **Implementation**: Filters transaction ledgers by date, status, or branch, and supports exporting datasets to CSV formats.

#### 16. src/app/(dashboard)/technicians/page.tsx
- **Role**: Technician task board.
- **Implementation**: Lists tasks assigned to the technician. Hides labor charges and spare parts cost columns for technician roles.

#### 17. src/app/(dashboard)/terms/page.tsx
- **Role**: T&C template manager.
- **Implementation**: Text editor to save the terms disclaimers printed on receipts and invoices.

---

### 29.2 UI & Layout Components (src/components/)

#### 18. src/components/layout/Header.tsx
- **Role**: Dashboard top navigation bar.
- **Implementation**: Renders the active page title, branch selectors, and user profile indicators.

#### 19. src/components/layout/Sidebar.tsx
- **Role**: Dashboard navigation links panel.
- **Implementation**: Renders navigation links dynamically based on role permissions.

#### 20. src/components/layout/BranchSelector.tsx
- **Role**: Dynamic branch scope filter selector.
- **Implementation**: Let's Super Admins and Service Managers switch the active branch context, updating metrics across the dashboard.

#### 21. src/components/jobs/JobCard.tsx
- **Role**: Compact preview card.
- **Implementation**: Displays job number, model name, status badge, priority, and date due.

#### 22. src/components/jobs/JobStatusBadge.tsx
- **Role**: Color-coded status badge.
- **Implementation**: Maps statuses to Tailwind CSS styles (e.g. green for completed, red for disapproved).

#### 23. src/components/jobs/JobPriorityBadge.tsx
- **Role**: Color-coded priority badge.
- **Implementation**: Maps priorities to styles (e.g. red for immediate, gray for low).

#### 24. src/components/jobs/ProductWarrantyFields.tsx
- **Role**: Conditional warranty fields.
- **Implementation**: Monitors the warranty checkbox and displays fields for descriptions, expiry dates, and receipts.

#### 25. src/components/jobs/ProductImagesFields.tsx
- **Role**: Image upload manager.
- **Implementation**: Handles drag-and-drop file uploads and updates product image fields.

#### 26. src/components/ui/Button.tsx
- **Role**: Reusable button primitive.
- **Implementation**: Supports sizes, color variants, and loading spinners.

#### 27. src/components/ui/Input.tsx
- **Role**: Form input field.
- **Implementation**: Extends input attributes with labels and error messages.

#### 28. src/components/ui/Select.tsx
- **Role**: Dropdown select input.
- **Implementation**: Extends select fields with options and validation boundaries.

#### 29. src/components/ui/Card.tsx
- **Role**: Card panel layout.
- **Implementation**: Renders container cards, headers, titles, and body divisions.

#### 30. src/components/ui/Badge.tsx
- **Role**: Small label indicator.
- **Implementation**: Displays status counts and filters.

#### 31. src/components/ui/Modal.tsx
- **Role**: Dialog overlay.
- **Implementation**: Portals the dialog into the DOM tree and supports click-outside closing behaviors.

#### 32. src/components/ui/Table.tsx
- **Role**: Grid table primitive.
- **Implementation**: Custom table component that supports custom container class overrides to control scroll behaviors.

#### 33. src/components/ui/ChipInput.tsx
- **Role**: Dynamic tags input.
- **Implementation**: Translates text values to chips when users press Enter or comma.

#### 34. src/components/ui/ErrorBoundary.tsx
- **Role**: Error catching container.
- **Implementation**: Catches component errors and displays a fallback interface.

---

### 29.3 Core Custom Hooks (src/hooks/)

#### 35. src/hooks/useAuth.ts
- **Role**: Exposes auth session states and permission flags.

#### 36. src/hooks/useJobs.ts
- **Role**: Fetches infinite scroll list pages, counts, and runs job updates.

#### 37. src/hooks/useCustomers.ts
- **Role**: Manages customer profiles, searches, and creation.

#### 38. src/hooks/useBranches.ts
- **Role**: Manages branch lists and configuration updates.

#### 39. src/hooks/useTechnicians.ts
- **Role**: Fetches lists of active technicians and assigned jobs.

#### 40. src/hooks/useBilling.ts
- **Role**: Manages payments ledgers and spare parts updates.

#### 41. src/hooks/useReports.ts
- **Role**: Fetches dashboard analytics and report datasets.

---

### 29.4 Zustand State Stores (src/stores/)

#### 42. src/stores/authStore.ts
- **Role**: Manages global authentication session state.

#### 43. src/stores/branchStore.ts
- **Role**: Manages active branch scope filters.

#### 44. src/stores/uiStore.ts
- **Role**: Manages layout elements (sidebar visibility, modal states).

---

### 29.5 Database Clients (src/lib/db/)

#### 45. src/lib/db/jobs.ts
- **Role**: Query client for jobs table operations.

#### 46. src/lib/db/branches.ts
- **Role**: Query client for branch configuration tables.

#### 47. src/lib/db/customers.ts
- **Role**: Query client for customer profile tables.

#### 48. src/lib/db/technicians.ts
- **Role**: Query client for technician tables.

#### 49. src/lib/db/billing.ts
- **Role**: Query client for payment transaction tables.

#### 50. src/lib/db/reports.ts
- **Role**: Query client for financial reports tables.

---

### 29.6 Core Utilities (src/lib/utils/)

#### 51. src/lib/utils/currency.ts
- **Role**: Currency formatter utility.
- **Implementation**: Formats numbers to Indian Rupee (INR) format (₹).

#### 52. src/lib/utils/dates.ts
- **Role**: Timezone formatter utility.
- **Implementation**: Standardizes timestamp formatting using the date-fns library.

#### 53. src/lib/utils/pdf.ts
- **Role**: jsPDF documentation generator.
- **Implementation**: Generates and formats Receipt, Quote, and Invoice PDFs.

#### 54. src/lib/utils/initials.ts
- **Role**: Profile initials generator.
- **Implementation**: Generates name initials for avatars.

#### 55. src/lib/utils/jobNumber.ts
- **Role**: Client-side temporary job number generator.

#### 56. src/lib/utils/jobProducts.ts
- **Role**: Single-line product details summary formatter.

---

### 29.7 Types Definitions (src/types/)

#### 57. src/types/database.ts
- **Role**: TypeScript mappings generated from the Supabase schema.

#### 58. src/types/enums.ts
- **Role**: Declares system-wide enums (user roles, job status, priority, conditions).

#### 59. src/types/job.ts
- **Role**: Declares models for jobs, products, and parts.

#### 60. src/types/user.ts
- **Role**: Declares models for user profiles and roles.

#### 61. src/types/branch.ts
- **Role**: Declares models for branches.

#### 62. src/types/customer.ts
- **Role**: Declares models for customer accounts.

#### 63. src/types/billing.ts
- **Role**: Declares models for payments.

---

### 29.8 Database SQL Migrations (supabase/migrations/)

#### 64. supabase/migrations/001_initial_schema.sql
- **Role**: Creates core tables (shops, branches, profiles, jobs, parts).

#### 65. supabase/migrations/002_rls_policies.sql
- **Role**: Configures RLS policies based on role permissions.

#### 66. supabase/migrations/003_seed_data.sql
- **Role**: Configures initial shop and branch seed records.

#### 67. supabase/migrations/004_update_rls_policies_safe.sql
- **Role**: Hardens RLS check boundaries.

#### 68. supabase/migrations/005_fix_rls_issues.sql
- **Role**: Resolves infinite recursion errors in profiles policies.

#### 69. supabase/migrations/006_apply_correct_rls.sql
- **Role**: Optimizes RLS selection policies.

#### 70. supabase/migrations/007_profiles_email.sql
- **Role**: Implements triggers to sync auth and profile emails.

#### 71. supabase/migrations/008_backfill_profile_shop_id.sql
- **Role**: Syncs shop UUIDs across existing profiles.

#### 72. supabase/migrations/009_service_manager_shop_wide_access.sql
- **Role**: Grants Service Managers access to all jobs in the shop.

#### 73. supabase/migrations/010_jobs_delete_super_admin_only.sql
- **Role**: Restricts job deletion policies to Super Admins only.

#### 74. supabase/migrations/012_transaction_safe_rpc_functions.sql
- **Role**: Adds PL/pgSQL transaction-safe job creation functions.

#### 75. supabase/migrations/013_transaction_safe_product_billing_rpc.sql
- **Role**: Adds triggers to synchronize product and billing fields.

#### 76. supabase/migrations/015_inventory_management.sql
- **Role**: Creates inventory, brands, and models tables.

#### 77. supabase/migrations/016_add_spare_parts_cost.sql
- **Role**: Adds unit cost fields to spare parts.

#### 78. supabase/migrations/019_add_payment_transactions.sql
- **Role**: Creates payment transactions tables.

#### 79. supabase/migrations/020_update_gst_calculation_to_full_amount.sql
- **Role**: Configures GST calculation logic.

#### 80. supabase/migrations/022_comprehensive_updates.sql
- **Role**: Database updates for warranty and intake features.

#### 81. supabase/migrations/023_add_terms_and_conditions.sql
- **Role**: Database tables for terms configuration templates.

#### 82. supabase/migrations/024_add_warranty_images_to_products.sql
- **Role**: Mappings for warranty card storage locations.

#### 83. supabase/migrations/025_add_product_images_to_job_products.sql
- **Role**: Mappings for product photo storage locations.

#### 84. supabase/migrations/026_add_alternative_contact_to_jobs.sql
- **Role**: Adds alternative contact columns to the jobs table.

#### 85. supabase/migrations/029_add_hsn_code_to_spare_parts.sql
- **Role**: Adds HSN code fields to spare parts.

#### 86. supabase/migrations/030_auto_cleanup_completed_images.sql
- **Role**: Trigger functions to clean up deleted product images.

#### 87. supabase/migrations/031_add_email_landline_to_branches.sql
- **Role**: Adds email and landline fields to branches.
`;

fs.writeFileSync(OUTPUT_FILE, readmeContent, 'utf8');
console.log(`Successfully generated README.md!`);

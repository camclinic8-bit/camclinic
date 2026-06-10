## 42. Chronological Version History & Release Logs

This section documents the version releases, updates, layout improvements, database migrations, and bug fixes applied to the Cam Clinic repository.

---

### 42.1 Release Logs

#### v0.1.0 — Initial Setup & Database Creation
- **Date**: 2026-03-01
- **Focus**: Core schema and tenant isolation setups.
- **Key Changes**:
  - Implemented the initial database schema (shops, branches, profiles, customers, jobs, products, parts).
  - Setup multi-branch data visibility layers.
  - Implemented basic dashboard cards and list grids.
  - Integrated Supabase Auth with RLS policies to restrict data access.

#### v0.1.1 — Job Intake & Product Registration
- **Date**: 2026-03-20
- **Focus**: Multi-product check-ins and intake receipt prints.
- **Key Changes**:
  - Implemented the multi-product job card creation form using React Hook Form and Zod validation.
  - Created the atomic database RPC `create_job_with_products`.
  - Added support for tracking cosmetic conditions, accessories checklists, and custom parts.
  - Added PDF generation utilities to output A4 Job Receipts.

#### v0.1.2 — Technician task board & Assignments
- **Date**: 2026-04-10
- **Focus**: Technician workspaces and RLS data policies.
- **Key Changes**:
  - Created the technician task board to view assigned repair jobs.
  - Hardened profiles select policies to prevent infinite SQL recursion.
  - Added internal notes and diagnostic logs inputs for bench technicians.
  - Restricted billing cost fields to manager roles only.

#### v0.1.3 — Billing, Payments, and PDF Invoicing
- **Date**: 2026-04-30
- **Focus**: Financial transactions loggers and Tax Invoices.
- **Key Changes**:
  - Created the payment transactions ledger to log UPI, Cash, and Card payments.
  - Added labor charges, inspection fees, and spare parts total costs fields.
  - Created automated database triggers to update balances when transactions are modified.
  - Implemented print-ready PDF generators for Quotes and Tax Invoices.
  - Added HSN codes to spare parts for GST compliance.

#### v0.1.4 — Staging Branch & Layout Fixes
- **Date**: 2026-05-15
- **Focus**: GST formulas alignment and error boundaries.
- **Key Changes**:
  - Aligned frontend GST calculations with the database formula (18% GST on labor charges).
  - Implemented robust error handling in database functions to prevent silent write failures.
  - Added database triggers to sync completion dates (`service_date`) automatically when jobs are completed.

#### v0.1.5 — Scrolling, Sticky Headers, & Drag Gestures (Current Release)
- **Date**: 2026-06-10
- **Focus**: Table scrolling usability, sticky headers, and page shimmers.
- **Key Changes**:
  - Updated `Table.tsx` to support custom container overrides, moving horizontal scrollbars to the bottom of the card viewport.
  - Applied individual sticky parameters and solid backgrounds (`bg-gray-50`) to table header cells.
  - Implemented mouse drag-to-scroll gestures with cursor adjustments.
  - Added click guarding to prevent accidental redirects during drag scrolling.
  - Replaced the simple loading spinner with detailed skeleton loading rows.

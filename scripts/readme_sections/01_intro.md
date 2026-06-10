# Cam Clinic — A-Z Camera Service Management System Documentation

## 1. Introduction and Project Overview

### 1.1 Project Genesis
Cam Clinic was conceived to address the operational complexities faced by modern, multi-branch camera service and repair shops in India. The camera service industry is highly specialized, dealing with sensitive optical, mechanical, and electronic systems across various equipment types including DSLRs, mirrorless cameras, cinema cameras, drones, lenses, gimbals, and high-end photographic accessories. 

Traditionally, camera service centers rely on fragmented systems: paper job sheets, isolated Excel sheets, or generic point-of-sale software that fails to capture the intricate lifecycle of a camera repair. A typical camera repair requires tracking:
- **Intake details**: Specific brand, model, serial number, cosmetic condition, and exact accessories brought in by the customer (e.g., specific lens caps, batteries, straps, filters).
- **Inspection**: Technician checkups, diagnostic notes, damage verification (e.g., fungus, impact, liquid damage).
- **Estimates and Approvals**: Multi-stage approval from service charge estimates, parts procurement cost, and final billing.
- **Parts Ledger**: Tracking exact spare parts used (like shutters, LCD ribbons, mounts) and their associated financial impact.
- **Multi-Branch Routing**: Items received at one branch but serviced at another or delivered to a third, necessitating careful custody tracking.
- **GST Compliance**: Standard Indian tax computations where service charges attract GST (18%) but spare parts or inspection fees might be subject to different calculations or tax exemptions depending on branch location or client business registration.

Cam Clinic solves these challenges by providing a unified, real-time, role-based platform designed with Next.js 16, Supabase, and TypeScript.

### 1.2 Targeted Business Model
The platform supports Supportta Solutions Pvt Ltd, managing a network of camera service centers across regions like Goa (Panaji), Karnataka (Bengaluru), and Maharashtra (Mumbai). 

The system handles:
1. **Walk-in Customers**: Quick intake of devices, generating print-ready Job Receipts.
2. **Technician Bench Work**: Assigned technicians get a customized view to update repair states, record bench findings, and request spare parts.
3. **Manager Overviews**: Branch managers and service managers supervise the queue, coordinate approvals with customers, send official Quotes, and generate Tax Invoices.
4. **Super Admin Controls**: Management of branches, global user credentials, system configuration, audit logs, and global performance reports.

---

## 2. Technical Stack Deep-Dive

Cam Clinic is built upon a modern, full-stack, type-safe web architecture. Below is an exhaustive breakdown of the technologies used, their versions, and their functional roles in the codebase.

```
+-----------------------------------------------------------------------+
|                              FRONTEND                                 |
|                                                                       |
|   +-------------------+  +--------------------+  +----------------+   |
|   |   Next.js 16.2    |  |    React 19.2      |  |  TypeScript 5  |   |
|   +---------+---------+  +---------+----------+  +-------+--------+   |
|             |                      |                     |            |
|             v                      v                     v            |
|   +-------------------+  +--------------------+  +----------------+   |
|   |    Zustand 5.0    |  | TanStack Query 5.9 |  |  Tailwind v4   |   |
|   +-------------------+  +--------------------+  +----------------+   |
+------------------------------------+----------------------------------+
                                     |
                                     |  Supabase SSR Client
                                     v
+-----------------------------------------------------------------------+
|                              BACKEND                                  |
|                                                                       |
|   +-------------------+  +--------------------+  +----------------+   |
|   |   Supabase Auth   |  |   PostgreSQL 15    |  |  Supabase RLS  |   |
|   +---------+---------+  +---------+----------+  +-------+--------+   |
|             |                      |                     |            |
|             v                      v                     v            |
|   +-------------------+  +--------------------+  +----------------+   |
|   |  Realtime Engine  |  |    Storage API     |  |   SQL RPC/Trig |   |
|   +-------------------+  +--------------------+  +----------------+   |
+-----------------------------------------------------------------------+
```

### 2.1 Core Framework and Language
- **Next.js 16.2.1 (App Router)**: Leverage React Server Components (RSC) for initial page loading and client-side page routing for the interactive dashboard. Route groups are used to separate authentication (`(auth)`) from the protected dashboard layouts (`(dashboard)`).
- **React 19.2.4**: Utilizes React's latest hooks and concurrent features, ensuring highly responsive user interface state updates.
- **TypeScript 5 (Strict Mode)**: Enforces end-to-end type safety. Database types generated directly from the Supabase schema are mapped to frontend interfaces in `src/types/`, eliminating runtime mismatches between the database structure and client UI code.

### 2.2 Frontend State & Data Flow
- **Zustand 5.0.12**: Lightweight, fast, and devtools-supported state management. Zustand stores are used for:
  - `authStore`: Manages the active session, authenticated user profile, role computation, and authentication state transitions.
  - `branchStore`: Manages the branch context. Allows Service Managers and Super Admins to toggle between physical branch scopes, updating all lists and metrics dynamically.
  - `uiStore`: Manages layout-related UI states like sidebar toggles, modal states, and notification overlays.
- **TanStack Query 5.95.2 (React Query)**: Used for server-state synchronization. React Query handles cache invalidation, parallel fetching, optimistic updates, and background refetching. By segregating cached queries under structured keys (defined in `src/lib/queryKeys.ts`), the application updates components automatically when changes occur.
- **React Hook Form 7.72.0**: Manages the complex multi-step state of forms like the Job Intake Form and Edit Job Form. Provides validation, dirty state checking, and field-level error feedback.
- **Zod 4.3.6**: Declares strict runtime schemas for validation. Zod is paired with React Hook Form's resolver to validate inputs (e.g. validating phone numbers, verifying pricing inputs, checking warranty dates) before they are submitted.

### 2.3 Styling and Icons
- **TailwindCSS v4.0.0**: Used with Vanilla CSS configuration. Tailwind v4 introduces optimized compile-time compilation using PostCSS, utilizing HSL color palettes, native CSS variables, and modern utilities (like scrollbar styling, grid layouts, and advanced flex dynamics).
- **Lucide React 1.7.0**: A consistent, lightweight icon package providing vector icons for status states, navigation, buttons, and user profiles.

### 2.4 Document Generation
- **jsPDF 2.5.1**: Used to generate official receipts, cost quotes, and tax invoices. All documents are dynamically rendered directly in the user's browser, bypassing the need for dedicated PDF generation microservices.
- **jsPDF-autotable 3.8.2**: Extension for rendering tables in PDFs. Used to structure product conditions lists, spare parts tables, GST computations, and payment receipts into structured, A4-friendly invoice layouts.

### 2.5 Database & Serverless Infrastructure
- **Supabase SSR (@supabase/ssr 0.10.0)**: Manages authentication sessions across the client browser, Next.js server components, API routes, and middleware.
- **PostgreSQL 15 (Supabase Hosted)**: Relational database providing transactions, foreign keys, triggers, constraints, and custom SQL functions.
- **Supabase Row-Level Security (RLS)**: Enforces strict data isolation. Ensures technicians can only read or write jobs assigned to them, while Service Incharges see their branch jobs, and Super Admins see all shop data.
- **Supabase Real-time Engine**: Connects via WebSockets to replicate database inserts, updates, and deletes to the frontend client in real time. When a job status changes in the workshop, the dashboard updates instantly for managers.

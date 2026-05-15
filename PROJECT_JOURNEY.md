# Cam Clinic — Project Journey

> Chronological log of major work sessions, decisions, bug fixes, and security notes.

---

## Session: 2026-05-16 (Comprehensive Audit + Critical Fixes)

### 1. Full Project Analysis
Performed a deep-dive analysis of the entire Cam Clinic codebase covering:
- **78 source files** across `src/app/`, `src/components/`, `src/hooks/`, `src/lib/`, `src/stores/`, `src/types/`
- **12 SQL migrations** in `supabase/migrations/`
- **7 AGENTS documentation files** (AGENTS.md + 6 detail files)
- **Tech stack**: Next.js 16.2, React 19.2, TypeScript 5 strict, Tailwind v4, Supabase SSR, TanStack Query 5, Zustand 5, RHF 7, Zod 4, jsPDF, Sonner

Key findings documented in `README.md` Security section and `AGENTS.md`.

---

### 2. Security — CVE-2026-45321 (TanStack Supply-Chain Attack)

**Status**: ✅ **Not affected** — no action required.

On May 11, 2026, a supply-chain attack compromised 84 malicious versions across 42 `@tanstack/*` packages from the **router/start monorepo**.

This project uses `@tanstack/react-query@5.95.2`, which belongs to the **`@tanstack/query*` family** — a completely separate monorepo that was **not affected** by CVE-2026-45321.

**Note added to:**
- `README.md` (Security section)
- `AGENTS.md` (Project Notes)
- `PROJECT_JOURNEY.md` (this file)

Reference: [GitHub Security Advisory GHSA-g7cv-rxg3-hmpx](https://github.com/TanStack/router/security/advisories/GHSA-g7cv-rxg3-hmpx)

---

### 3. Critical Bug Fixes (Commit `7bc5665`)

#### Fix #1: GST Calculation Mismatch (CRITICAL)
**File**: `src/app/(dashboard)/jobs/[id]/edit/page.tsx`

**Problem**: The job edit page's live cost preview calculated GST on the **full subtotal** (`inspection + service + spare_parts`), but the database trigger `calculate_job_totals()` only applies GST to **`service_charges`**. This meant the frontend preview showed a different total than what the DB stored and what the PDF receipt/invoice displayed.

**Root Cause**: Frontend formula was `subtotal * 0.18` instead of `service_charges * 0.18`.

**Fix**:
```ts
// BEFORE (wrong)
const subtotal = watchedInspection + watchedService + sparePartsTotal;
const gstAmount = watchedGst ? subtotal * 0.18 : 0;

// AFTER (correct — matches DB trigger)
const totalCharges = watchedInspection + watchedService + sparePartsTotal;
const gstAmount = watchedGst ? watchedService * 0.18 : 0;
```

**Verification**: `npx tsc --noEmit` passed cleanly.

---

#### Fix #2: Missing Error Handling on Status History Inserts (HIGH)
**File**: `src/lib/db/jobs.ts`

**Problem**: Several database operations silently failed without throwing errors. This meant:
- Status audit trails (`job_status_history`) could fail to write without the user knowing
- Current job fetches could fail silently, leading to incorrect status change logging

**Functions fixed**:

| Function | Missing Check | Fix |
|---|---|---|
| `createJob` | `job_status_history` insert | Added `historyError` check + `throw` |
| `updateJob` | Current job fetch (`select('status')`) | Added `fetchError` check + `throw` |
| `updateJob` | `job_status_history` insert | Added `historyError` check + `throw` |
| `updateJobStatus` | Current job fetch (`select('status')`) | Added `fetchError` check + `throw` |
| `updateJobStatus` | `job_status_history` insert | Added `historyError` check + `throw` |

**Note**: The `job_products`, `product_accessories`, and `product_other_parts` inserts already had proper `throw` checks — these were not changed.

**Verification**: `npx tsc --noEmit` passed cleanly.

---

### 4. Remaining Known Issues (Not Fixed in This Session)

| Priority | Issue | File | Notes |
|---|---|---|---|
| High | No atomic job creation | `lib/db/jobs.ts` | Sequential inserts without transactions; partial job possible if any step fails mid-way |
| Medium | Untyped Supabase client | All `lib/db/*.ts` | Uses `SupabaseClient<any>` instead of `SupabaseClient<Database>` |
| Medium | Fire-and-forget product deletes | `jobs/[id]/edit/page.tsx` | `Promise.all` on deletes swallows individual failures |
| Low | No test files | Entire project | Zero unit/integration test coverage |
| Low | CRLF/LF warnings on Windows | `.md` files | Consider adding `.gitattributes` |

---

### 5. Commits Pushed to `main`

| Commit | Description |
|---|---|
| `5a065db` | `docs:` Add CVE-2026-45321 security note; refactor AGENTS.md into modular detail files |
| `7bc5665` | `fix:` Correct GST calc in edit page to match DB trigger; add missing error handling on status history inserts and job fetches |

---

## Decision Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-05-16 | **Do NOT upgrade TanStack packages** | CVE-2026-45321 did not affect `@tanstack/react-query`; upgrading is unnecessary risk |
| 2026-05-16 | **Fix GST frontend formula, not DB trigger** | DB trigger is the source of truth for PDFs/invoices; changing it would break all existing data |
| 2026-05-16 | **Add error checks, not transactions** | Supabase JS client does not support multi-statement transactions; would need PostgreSQL RPC refactor |

---

## How to Use This File

- **Before starting new work**: Read the latest session to understand recent changes
- **When investigating a bug**: Check if it's listed in Known Issues
- **When onboarding**: Review the Decision Log to understand why things are the way they are

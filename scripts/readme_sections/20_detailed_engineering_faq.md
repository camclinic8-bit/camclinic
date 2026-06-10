## 25. Comprehensive Technical FAQ & Engineering Decisions

This section documents the technical rationale, architectural trade-offs, design decisions, and solutions for edge cases implemented in the Cam Clinic codebase.

---

### Q1: Why did we transition the main table horizontal scroll to the card container instead of using the standard overflow wrapper in `Table.tsx`?
- **Background**: By default, the `Table` component wraps the HTML table in `<div className="overflow-x-auto">`. In pages with long tables (like the Jobs board with 120+ rows), this causes the horizontal scrollbar to render at the absolute bottom of the table content (under all 120+ rows). This makes it invisible and inaccessible unless the user scrolls all the way to the bottom of the page.
- **Decision**: We added a `containerClassName` prop to `Table.tsx` to override or disable the default `overflow-x-auto` wrapper. In `JobsPage`, we set `containerClassName=""` on the `<Table>` component, letting the outer card container (`scrollContainerRef`) handle both vertical and horizontal scroll. This keeps the horizontal scrollbar visible at the bottom of the card viewport on the screen.

---

### Q2: Why do we set solid backgrounds and individual sticky properties on the `TableHead` cells instead of just making the header `tr` sticky?
- **Background**: Making a `tr` element sticky (`sticky top-0`) does not work reliably across all browsers. Under standard HTML table render dynamics, text from scrolled rows below can bleed through the table header if its background is semi-transparent or unset.
- **Decision**: We applied `sticky top-0 bg-gray-50 z-30` directly to each `<TableHead>` cell, and `sticky left-0 top-0 bg-gray-50 z-40` for the first column (**Job**). This ensures that header cells remain fixed, opaque, and stacked above the scrolling body rows.

---

### Q3: How does the drag-to-scroll implementation distinguish between dragging to scroll and clicking to navigate?
- **Background**: Clicking a row navigates to the job details page (`router.push`). If a user clicks and drags to scroll horizontally, the browser still fires a click event on `mouseup`, triggering an accidental redirect.
- **Decision**: We added a mouse displacement tracker. On `mousedown`, we record the mouse coordinates (`clientX`, `clientY`). On `mouseup`, we calculate the distance between the starting and ending points. If the displacement exceeds 5px, we classify the interaction as a drag, prevent the default click action, and cancel navigation.

---

### Q4: Why do we use a custom SQL RPC function (`create_job_with_products`) instead of multiple standard Supabase client calls during job creation?
- **Background**: Creating a job card requires writes across multiple tables (`jobs`, `job_products`, `product_accessories`, and `product_other_parts`). If done using separate client calls, a network interruption or partial write could leave orphaned records.
- **Decision**: We created a transactional SQL RPC function. This ensures that the job creation process is atomic: either all inserts succeed, or the entire transaction is rolled back. It also reduces network round-trips to a single API call.

---

### Q5: Why are technician lists restricted to assigned jobs, and how is this enforced?
- **Background**: Technicians should only see and update jobs assigned to them.
- **Decision**: Enforced using database Row-Level Security (RLS) policies:
  ```sql
  CREATE POLICY select_tech_jobs ON jobs
    FOR SELECT
    TO authenticated
    USING (assigned_technician_id = auth.uid());
  ```
  Additionally, the client-side `useJobs` hook overrides query filters to inject the technician's user ID if their profile role matches `technician`.

---

### Q6: Why does the system calculate GST strictly on labor charges instead of the grand total?
- **Background**: Under Indian GST guidelines for camera repair services, tax is computed at 18% on service (labor) charges, while diagnostic fees and spare parts may follow different tax rules or exemptions depending on the shop's registration and branch locations.
- **Decision**: The GST formula is configured as:
  $$\text{GST Amount} = \text{Service Charges} \times 0.18$$
  This calculation is enforced by database triggers and mirrored on the frontend to maintain financial consistency.

---

### Q7: Why did we replace the single-cell bottom spinner during infinite scroll fetches with detailed row skeletons?
- **Background**: Using a single cell with a merged column span (`colSpan={10}`) to show a loading spinner causes visual layout shifts during page fetches.
- **Decision**: We replaced the spinner with three detailed skeleton rows. These rows match the exact column structure, cell alignments, and widths of the active table, providing a smoother loading transition.

---

### Q8: How are image cleanups handled when products are deleted from job cards?
- **Background**: Deleting products or removing uploaded images leaves orphaned files in Supabase Storage.
- **Decision**: A database trigger logs deleted image paths to a cleanup queue table. A background job reads this queue, compares it with active paths in the database, and deletes orphaned files from storage buckets.

---

### Q9: Why is Zustand used for global app state, while React Query handles server data?
- **Background**: Server state (e.g. database rows) and client state (e.g. UI toggles) have different lifecycles and caching requirements.
- **Decision**: Zustand handles simple client-side state (such as the active branch filter or authentication status). React Query manages server-side state, handling caching, background updates, and automatic synchronization with the database.

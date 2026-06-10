## 12. Exhaustive Code Walkthrough & Component Mechanics

In this section, we dissect the implementation details of the most critical files in the codebase, explaining the state parameters, design constraints, lifecycle hooks, and rendering logic.

### 12.1 Detailed Analysis of `src/app/(dashboard)/jobs/page.tsx`

This page is the central interface for viewing, searching, and managing service tickets. It uses dynamic infinite scrolling, custom viewport-bound intersection observations, and smooth mouse-drag gestures.

#### 12.1.1 State Variables
- `search` / `debouncedSearch`: Tracks search field inputs. A 250ms debounce prevents search requests from firing on every keypress.
- `statusFilter` / `priorityFilter`: Category filters that update the query variables sent to Supabase.
- `sortBy` / `sortOrder`: Sorting columns and order configurations.
- `pageSize`: Number of items loaded per page parameter.
- `isDragging`: Boolean flag indicating whether the user is actively drag-scrolling the table.

#### 12.1.2 Refs
- `scrollContainerRef`: References the card container div. This container handles overflow scrolling and mouse drag gestures.
- `observerTargetRef`: References the sentinel div at the bottom of the table. The `IntersectionObserver` monitors this div to trigger pages fetches.
- `dragStartPos`: Tracks mouse coordinate offsets during `mousedown` to distinguish drags from standard clicks.

#### 12.1.3 Custom Event Handlers
- **`handleMouseDown(e)`**: Triggers on left-click (`e.button === 0`). Captures starting coordinates and scroll offsets, then registers document-level mouse listeners for viewport tracking.
- **`handleDocumentMouseMove(e)`**: Standardizes drag-scrolling offsets and applies them to the container's scroll position, creating a smooth scroll effect.
- **`handleDocumentMouseUp()`**: Cleans up document-level listeners and sets `isDragging` to false.
- **`handleRowClick(jobId, e)`**: Checks click displacement. If the mouse moved more than 5px during mouse-down/up, it blocks the click action, letting users drag-scroll without accidentally opening pages.

---

### 12.2 Detailed Analysis of `src/lib/utils/pdf.ts`

The PDF generation engine compiles customer and invoice details into high-quality A4 document files.

```
+-------------------------------------------------------------+
|                                                             |
|   +-----------------------+     +-----------------------+   |
|   |         LOGO          |     |    Company Address    |   |
|   |                       |  |  |    GSTIN, Contacts    |   |
|   +-----------------------+     +-----------------------+   |
|=============================|===============================|
|   Customer Details          |     Job / Ticket Info         |   |
|   Name, Phone, Email, Addr  |     Job #, Status, Priority   |   |
|-----------------------------+-------------------------------|
|   Item Description          |     Condition & Accessories   |   |
|   Brand, Model, Serial      |     Cosmetics, Intake List    |   |
|-----------------------------+-------------------------------|
|   Billing & Labor           |     GST (18%), Subtotal,      |   |
|   Diagnostic fee, Parts     |     Advance, Balance Due      |   |
|                                                             |
+-------------------------------------------------------------+
```

#### 12.2.1 Core Functions
- **`addHeader(doc, branch)`**:
  - Draws a solid outer border block.
  - Draws a vertical line dividing the logo section and the contact info section.
  - Safely reads the SVG logo from the public directory. If file reading or rendering fails, it falls back to a typographic header.
  - Renders the branch address, email, phone number, and GSTIN (e.g. `30AAGFC6231M1ZN`).
- **`addCustomerAndJobInfo(doc, job)`**:
  - Draws a side-by-side card divided in the middle.
  - The left section contains customer details, and the right section contains job information.
- **`addProductsFullTable(doc, products)`**:
  - Converts product accessories, parts, and remarks into a readable grid.
  - Groups columns like accessories and remarks to keep the table layout clean.
- **`addChargesTable(doc, job)`**:
  - Summarizes billing parameters in a table format.
  - Displays labor fees, parts totals, GST taxes, advance payments, and the remaining balance.
  - Formats payment fields in bold red (if a balance remains) or bold green (if the job is fully paid).

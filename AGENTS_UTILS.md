# Cam Clinic — Utility Functions

## `src/lib/utils/` barrel (`index.ts`)
Re-exports: currency, dates, jobNumber, pdf

## `currency.ts`
- `formatINR(amount)` — ₹1,23,456.78 (Intl.NumberFormat en-IN, 2 decimals)
- `formatINRWhole(amount)` — ₹1,23,456 (no decimals)
- `parseINR(value)` — strips ₹, commas, spaces → number

## `dates.ts` (uses date-fns)
- `formatDate(date)` — "dd MMM yyyy" → "01 Apr 2026"
- `formatDateTime(date)` — "dd MMM yyyy, hh:mm a"
- `formatDateForInput(date)` — "yyyy-MM-dd"
- `isExpired(date)` — before today 00:00
- `isDateToday(date)` — isToday check
- `isFutureDate(date)` — after today 23:59:59
- `getRelativeDate(date)` — "Today" / "Tomorrow" / formatted date

## `jobNumber.ts`
- `generateJobNumber(sequence)` — "CC-NNNNN" global sequential, widens to 6 digits after 99999 (TS utility, DB is source of truth)
- `parseJobNumber(jobNumber)` — { sequence } | null
- `isValidJobNumber(jobNumber)` — regex test /^CC-\d{5,}$/

## `initials.ts`
- `nameInitials(name)` — 2 letters: single word → first 2 chars, multi-word → first+last initial. null/undefined → "?"

## `jobProducts.ts`
- `formatProductName(p)` — "Brand Model" or "Product"
- `truncateChars(text, max)` — truncate with ellipsis
- `summarizeJobProductsLine(products, opts?)` — returns { line (truncated), full (for tooltip) }

## `normalizeJobProduct.ts`
- `coerceHasWarranty(value)` — true for true/"true"/"on"
- `normalizeJobProductWarrantyForDb(p)` — clears warranty fields when no warranty

## `pdf.ts` (jsPDF + jspdf-autotable)
- `generateReceipt(job)` — "SERVICE RECEIPT". Header + job info + customer + products A-Z table + problem description + charges + payment/est dates + signature footer
- `generateQuote(job)` — "SERVICE QUOTATION". Same structure + advisory notes
- `generateInvoice(job)` — "SERVICE INVOICE". Same structure + payment status (PAID IN FULL / Balance Due)
- `downloadPDF(doc, filename)` — doc.save(filename)

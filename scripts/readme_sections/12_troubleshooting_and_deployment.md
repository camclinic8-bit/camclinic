## 17. Troubleshooting & Operational Guide

This section contains guidance for operations, server setups, and debugging typical failure states.

### 17.1 Common Operational Scenarios

#### 17.1.1 Table View Scrolling or Drag Performance Lag
- **Symptom**: Scrolling through 5000+ jobs lists feels slow on standard browsers.
- **Root Cause**: Next.js renders too many DOM rows, triggering garbage collection overhead.
- **Remedy**: Adjust the page size selection from `100` down to `20` or `50` in the toolbar settings. This uses the Infinite Scroll logic to fetch items incrementally, optimizing memory overhead.

#### 17.1.2 Scrolled Text Bleeding Through Headers
- **Symptom**: Table contents show through the header text during vertical scroll.
- **Root Cause**: Table headers are missing solid backgrounds (`bg-gray-50`) or correct stacking orders (`z-30`/`z-40`).
- **Remedy**: Verify that each `TableHead` component in the custom code defines `sticky top-0 bg-gray-50 z-30`. The first column (`Job`) must have `sticky left-0 top-0 bg-gray-50 z-40` to maintain horizontal and vertical stacking context.

#### 17.1.3 PDF Logo Loading Failures
- **Symptom**: Printing Receipts or Invoices fails with a canvas draw or resource resolution error.
- **Root Cause**: The logo image path (`/logo.svg` or `/public/logo.svg`) cannot be resolved during static rendering or browser fetch cycles.
- **Remedy**: The `generateReceipt`, `generateQuote`, and `generateInvoice` functions in `src/lib/utils/pdf.ts` use a try-catch block to wrap the logo image render function. If resolving the image fails, it falls back to a clean text-based typographic logo.

#### 17.1.4 Infinite Dashboard Skeletons
- **Symptom**: The dashboard remains stuck on loading skeletons after page refreshes.
- **Root Cause**: The Supabase Auth initialized state fails to emit the `INITIAL_SESSION` event during Strict Mode mounts, stalling user profile checks.
- **Remedy**: The initializer code in `src/app/providers.tsx` uses a safety timeout that automatically resolves session queries if events are missed, preventing infinite loading screens.

---

### 17.2 Deployment Configuration Checklist

When deploying to environments like Vercel or AWS Amplify:
1. **Supabase Environment Scope**: Add all credentials to the deployment environment configuration, including `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
2. **Server Regions**: Set your hosting server region (e.g. `sin1` Singapore) close to your database cluster region to minimize latency for server-side page checks and API routing.
3. **Storage CORS Settings**: Set your Supabase Storage Bucket CORS configurations to allow access from your deployment domains:
   ```json
   [
     {
       "allowedOrigins": ["https://*.yourdomain.com", "http://localhost:3000"],
       "allowedHeaders": ["*"],
       "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
       "maxAgeSeconds": 3600
     }
   ]
   ```

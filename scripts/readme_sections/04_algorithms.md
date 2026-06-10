## 5. Technical Algorithms & Computational Models

### 5.1 Financial Computation & Trigger Engine
The financial engine ensures consistent pricing metrics across the frontend UI and PostgreSQL backend.

#### 5.1.1 Billing Equations
The financial calculations obey the following constraints:
1. **Subtotal ($S$)**: Sum of inspection fee, service (labor) charges, and spare parts.
   $$S = F_{inspect} + C_{service} + \sum_{i=1}^{n} (Q_{i} \times P_{unit\_i})$$
   Where:
   - $F_{inspect}$ is the diagnostic/inspection fee.
   - $C_{service}$ is the labor/service charge.
   - $Q_i$ is the quantity of the $i$-th spare part.
   - $P_{unit\_i}$ is the unit price of the $i$-th spare part.

2. **Goods and Services Tax ($GST$)**: GST in India is computed at 18%, charged strictly on the service charges (labor), not on spare parts or inspection fees.
   $$GST = \begin{cases} 
     C_{service} \times 0.18 & \text{if gst\_enabled = true} \\
     0.00 & \text{if gst\_enabled = false}
   \end{cases}$$

3. **Grand Total ($T_{grand}$)**:
   $$T_{grand} = S + GST$$

4. **Balance Due ($B_{due}$)**: Represents the remaining payment amount.
   $$B_{due} = T_{grand} - A_{advance} - \sum_{j=1}^{m} P_{trans\_j}$$
   Where:
   - $A_{advance}$ is the initial advance payment.
   - $P_{trans\_j}$ is the amount of the $j$-th ledger transaction recorded in `payment_transactions`.

#### 5.1.2 SQL Trigger Implementation
To prevent mismatches, the calculations are enforced via a PostgreSQL trigger:
```sql
CREATE OR REPLACE FUNCTION update_job_totals_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_parts_cost NUMERIC(10,2) := 0;
  v_payments_sum NUMERIC(10,2) := 0;
BEGIN
  -- 1. Compute spare parts total
  SELECT coalesce(SUM(total_price), 0) INTO v_parts_cost
  FROM spare_parts WHERE job_id = NEW.id;

  -- 2. Compute total payments in transactions
  SELECT coalesce(SUM(amount), 0) INTO v_payments_sum
  FROM payment_transactions WHERE job_id = NEW.id;

  -- 3. Set charges
  NEW.spare_parts_total_cost := v_parts_cost;
  NEW.total_charges := NEW.inspection_fee + NEW.service_charges + v_parts_cost;

  -- 4. Calculate GST
  IF NEW.gst_enabled THEN
    NEW.gst_amount := round(NEW.service_charges * 0.18, 2);
  ELSE
    NEW.gst_amount := 0.00;
  END IF;

  -- 5. Calculate Grand Total & Balance
  NEW.grand_total := NEW.total_charges + NEW.gst_amount;
  NEW.balance_amount := NEW.grand_total - NEW.advance_paid - v_payments_sum;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 5.2 Infinite Scroll & IntersectionObserver Algorithm
The Jobs list uses pagination with an infinite-scroll trigger to load large amounts of data (10,000+ items) without causing browser crashes.

```
[ User Scrolls Down ]
         |
         v
[ Sentinel Element Enters Viewport ]
         |
         v
[ IntersectionObserver callback triggered ]
         |
         +-----> (Is not currently loading? AND hasNextPage = true?)
                      |
                      v
         [ Call fetchNextPage() from useJobs ]
                      |
                      v
         [ React Query fetches page params `pageParam = pageParam + 1` ]
                      |
                      v
         [ DB returns range: from (page-1)*limit TO page*limit - 1 ]
                      |
                      v
         [ Cache appends pages array -> flatData rebuilds -> UI renders ]
```

- **Viewport-Relative Sentinel**: A `<div ref={observerTargetRef} className="h-10 shrink-0" />` is rendered at the bottom of the scroll container.
- **Root Element Scope**: The observer is configured with `root: scrollContainerRef.current`. This restricts intersection checking to the table container's viewport, preventing page-level scroll conflicts.
- **Debounced Search Integration**: Keypresses in the search field trigger a 250ms debounce before refetching, preventing database query thrashing.

---

### 5.3 Mouse Drag-to-Scroll & Click-Guarding Algorithm
To allow desktop users using standard mice to drag the table horizontally, the scroll container supports mouse gestures.

#### 5.3.1 Scroll Vector Calculations
Let $P_{down} = (x_{down}, y_{down})$ be the mouse coordinates at `mousedown` and $S_{down} = (scrollLeft_{down}, scrollTop_{down})$ be the initial scroll positions.
For any movement event `mousemove` at $P_{move} = (x_{move}, y_{move})$, the new scroll vectors are computed as:
$$dx = x_{move} - x_{down}$$
$$dy = y_{move} - y_{down}$$
$$scrollLeft_{new} = scrollLeft_{down} - dx$$
$$scrollTop_{new} = scrollTop_{down} - dy$$

To make dragging smooth, document-level listeners are dynamically registered on `mousedown` and cleaned up on `mouseup` or `mouseleave`.

#### 5.3.2 Click Guard Threshold (Click vs Drag)
Because entire table rows are clickable links that trigger router navigation, dragging would trigger accidental page redirects. To prevent this, a click-displacement threshold algorithm is evaluated in the row click handler:

$$Displacement(D) = \sqrt{(x_{up} - x_{down})^2 + (y_{up} - y_{down})^2}$$

In practice, we use a fast Manhattan-distance approximation to avoid square root calculations:
$$D_{manhattan} = |x_{up} - x_{down}| + |y_{up} - y_{down}|$$

- If $D_{manhattan} > 5$ pixels, the interaction is classified as a **drag**. The click callback is cancelled, preventing navigation.
- If $D_{manhattan} \leq 5$ pixels, the interaction is classified as a **click**. Router navigation continues.

---

### 5.4 Automatic Image Cleanup & Storage Lifecycle
To prevent orphaned images (e.g. upload files left over after user cancels a job creation or removes product photos from the edit page), a cron trigger runs periodically.
- Storage paths are structured as: `shop_id/job_id/product_id/filename.jpg`.
- When a `job_products` record is updated or deleted, an database event trigger logs the file paths to a cleanup queue.
- A background serverless routine fetches the queue, compares it with active paths in `job_products` columns (`warranty_images`, `product_images`), and deletes orphaned objects using the Supabase Storage Admin API.

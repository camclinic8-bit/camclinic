## 41. PostgreSQL Database Indexing & Performance Tuning

This section documents the database indexing strategies, query performance tuning, and optimization techniques.

---

### 41.1 Query Optimization using Indexes

To ensure fast query response times with large datasets (10,000+ jobs), we created database indexes for frequently queried columns:

1. **Job Number Searches (`idx_jobs_job_number`)**:
   - **Type**: B-Tree index.
   - **SQL**:
     ```sql
     CREATE INDEX IF NOT EXISTS idx_jobs_job_number ON jobs(job_number);
     ```
   - **Role**: Optimizes search queries when looking up specific job cards by job number.

2. **Branch Filter Queries (`idx_jobs_service_branch_id` & `idx_jobs_delivery_branch_id`)**:
   - **Type**: B-Tree indexes.
   - **SQL**:
     ```sql
     CREATE INDEX IF NOT EXISTS idx_jobs_service_branch_id ON jobs(service_branch_id);
     CREATE INDEX IF NOT EXISTS idx_jobs_delivery_branch_id ON jobs(delivery_branch_id);
     ```
   - **Role**: Optimizes data queries when filtering by branch, especially for Service Managers and Incharges.

3. **Technician Task Board Queries (`idx_jobs_assigned_technician_id`)**:
   - **Type**: B-Tree index.
   - **SQL**:
     ```sql
     CREATE INDEX IF NOT EXISTS idx_jobs_assigned_technician_id ON jobs(assigned_technician_id);
     ```
   - **Role**: Speeds up query response times for the technician task board.

4. **Date Filter Queries (`idx_payment_transactions_date`)**:
   - **Type**: Descending B-Tree index.
   - **SQL**:
     ```sql
     CREATE INDEX IF NOT EXISTS idx_payment_transactions_date ON payment_transactions(payment_date DESC);
     ```
   - **Role**: Speeds up transaction history queries when displaying payments sorted by date.

---

### 41.2 Query Diagnostics & Execution Analysis

To verify index efficiency:
- Run queries with the `EXPLAIN ANALYZE` prefix in the Supabase SQL editor:
  ```sql
  EXPLAIN ANALYZE SELECT * FROM jobs WHERE assigned_technician_id = 'your-tech-id';
  ```
- Look for `Index Scan` rather than `Seq Scan` (sequential scan) in the execution plan to confirm that indexes are being utilized.
- Confirm that the total execution time is under 15ms.

## 7. Backend APIs & Real-time Integration

### 7.1 Server-Side Proxy Routes
While most database queries occur directly from the browser client via Supabase client SDKs (protected by RLS), certain administrative operations bypass RLS or require secure backend credentials. These operations are proxied through Next.js API Routes:

#### 7.1.1 `POST /api/users/create`
- **Purpose**: Allows Super Admins to create new staff accounts (Service Managers, Incharges, Technicians) and assign them to branches.
- **Security**: Verifies that the requesting user's session profile is a `super_admin` before calling the Supabase Auth Admin API (`signUp` with `service_role` privileges).
- **Request Body**:
  ```json
  {
    "email": "staff@camclinic.com",
    "password": "Password123!",
    "fullName": "Meera Joshi",
    "role": "technician",
    "branchId": "uuid-branch-id"
  }
  ```

#### 7.1.2 `POST /api/users/update-password`
- **Purpose**: Admin password resets for employees who forget credentials.
- **Security**: Restricts password reset permissions to Super Admin role validations.

#### 7.1.3 `GET /api/team`
- **Purpose**: Fetches the directory of active staff profiles to populate dropdowns in the Job Card edit forms.

---

### 7.2 Real-time Postgres Change Listeners
To keep the dashboard updated for managers, the application subscribes to PostgreSQL changes via WebSockets.

In [providers.tsx](file:///e:/PROJECTS/camclinic/src/app/providers.tsx), the `RealtimeInitializer` effect manages this subscription:
- It listens for updates to the `jobs` and `job_status_history` tables.
- When an update event occurs, it invalidates affected React Query keys (like `['jobs']`, `['jobs', 'counts']`, `['jobs', 'due-today']`).
- This triggers background updates across the UI without forcing full page refreshes.

---

## 8. Theoretical Principles & System Design

### 8.1 ACID Database Compliance
Camera service centers handle active transactions, billing invoices, and parts inventories. Database consistency is maintained by adhering to ACID properties:
1. **Atomicity**: Complex database operations (like creating a job card with multiple products and accessories) are written inside SQL transaction blocks (using RPC PL/pgSQL routines). If any insert fails, the entire transaction is rolled back.
2. **Consistency**: Database schema constraints (like foreign key checks, non-null requirements, check constraints) prevent invalid states.
3. **Isolation**: Supabase PostgreSQL uses the default `Read Committed` isolation level, preventing uncommitted data from leaking to other sessions.
4. **Durability**: Databases are backed up periodically, and write-ahead logs (WAL) guarantee data recovery in case of hardware failures.

### 8.2 Relational Database Normalization
The database schema is designed according to normalization rules to eliminate redundancy and prevent anomalies:
- **First Normal Form (1NF)**: All columns contain atomic values. Product conditions are handled via a robust PostgreSQL Enum Array (`product_condition[]`).
- **Second Normal Form (2NF)**: All non-key attributes are fully dependent on the primary keys. Tables like `job_products` and `spare_parts` have their own primary keys and reference `jobs` via foreign keys.
- **Third Normal Form (3NF)**: Transient dependencies are eliminated. Branch phone numbers, addresses, and landlines are stored in the `branches` table, rather than repeating them inside individual `jobs` records.

---

## 9. Installation, Configuration, & Development Setup

### 9.1 Local Development Setup

#### 9.1.1 System Prerequisites
- Node.js version 18.0.0 or higher.
- npm version 9.0.0 or higher (or Yarn/pnpm equivalent).
- A running Supabase PostgreSQL database instance.

#### 9.1.2 Environment Variables Configuration
Create a `.env.local` file in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 9.1.3 Dependency Installation
Install all package dependencies:
```bash
npm install
```

#### 9.1.4 Database Migrations Setup
Apply SQL migrations to your Supabase instance. Run the migration files located in `supabase/migrations/` in chronological order:
```bash
# Example using Supabase CLI
supabase db push
```

#### 9.1.5 Seeding Demo Data
To seed 120+ jobs, customer ledgers, mock parts, payment histories, and employee accounts for testing, run the seed script:
```bash
npm run seed:demo
# To clean up previous seed jobs first:
npm run seed:demo -- --clean
```

#### 9.1.6 Running the Dev Server
Launch the local development environment:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the application.

---

### 9.2 Build and Lint Procedures

#### 9.2.1 Static Compilation
Before deploying, check that the static build and code compilation works:
```bash
npm run build
```

#### 9.2.2 Running Code Linter
Ensure that the code matches the project rules and styling guidelines:
```bash
npm run lint
```

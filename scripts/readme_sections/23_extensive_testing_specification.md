## 28. Exhaustive Testing Specifications & QA Checklists

This section documents the testing strategies, unit tests, integration validation schemas, and manual role-specific checklists to verify system integrity.

---

### 28.1 Unit Testing Guidelines

Unit tests verify the correctness of pure helper functions in isolation.

#### 28.1.1 Currency Formatter (`currency.ts`)
- **Test Scenarios**:
  - Input: `5000` -> Expected Output: `"₹5,000.00"`
  - Input: `"12500.5"` -> Expected Output: `"₹12,500.50"`
  - Input: `0` -> Expected Output: `"₹0.00"`
  - Input: `NaN` or invalid string -> Expected Output: `"₹0.00"`
- **Assertion Framework**: Use Jest or Vitest to mock formatting contexts and assert outputs.

#### 28.1.2 Date Formatter (`dates.ts`)
- **Test Scenarios**:
  - Input: ISO string `"2026-06-10T17:31:00Z"` -> Expected Output: `"10-Jun-2026"` (or configured local date formats).
  - Verify boundary checks for leap years and timezone offsets.

#### 28.1.3 Initials Generator (`initials.ts`)
- **Test Scenarios**:
  - Input: `"Arjun Mehta"` -> Expected Output: `"AM"`
  - Input: `"Priya"` -> Expected Output: `"P"`
  - Input: `""` or `undefined` -> Expected Output: `"—"`

#### 28.1.4 Product Summary Line Formatter (`jobProducts.ts`)
- **Test Scenarios**:
  - Input: `[{ brand: "Sony", model: "A7IV" }, { brand: "Canon", model: "R6" }]` -> Expected Output: `"Sony A7IV, Canon R6"`.
  - Verify that summary lines truncate correctly if they exceed the character limit (e.g. 72 characters), appending `"..."` safely.

---

### 28.2 Integration Testing Guidelines

Integration tests verify interactions between React components, Zustand stores, and the Supabase database.

#### 28.2.1 Authentication Gate & Session Restoration
- **Procedure**:
  - Mock the Supabase Auth listener using different events (`SIGNED_IN`, `SIGNED_OUT`, `TOKEN_REFRESHED`).
  - Verify that the `authStore` updates its state correctly in response to these events.
  - Verify that the `AuthGate` component in the layout redirects users to `/login` when the session is null, and allows access when the session is valid.

#### 28.2.2 Branch Selector & List Filtering
- **Procedure**:
  - Log in as a Service Manager.
  - Change the active branch scope using the branch selector.
  - Verify that the new branch ID is saved in the `branchStore`.
  - Verify that React Query refetches data and updates lists to reflect the selected branch.

---

### 28.3 Role-Specific Manual Testing Checklists

QA teams should follow these checklists to verify role-based permissions and interface safety:

#### 28.3.1 Super Admin Checklist
1. **User Onboarding**: Navigate to `/technicians`, create a new manager account, and verify that the user can log in.
2. **Branch Management**: Register a new branch, update its landline, and verify that the changes appear on printed invoices.
3. **Deletions**: Open a job card, click **Delete**, confirm the prompt, and verify that the record and its associated data are removed.

#### 28.3.2 Service Manager Checklist
1. **Branch Visibility**: Verify that you can view and edit jobs across all branches within your shop.
2. **Employee Management**: Verify that you can view employee lists but cannot create new user accounts.
3. **Deletions**: Open a job card and verify that the **Delete** button is hidden or disabled.

#### 28.3.3 Service Incharge Checklist
1. **Branch Scoping**: Verify that you can only view jobs associated with your assigned branch.
2. **Job Intake**: Register a new job card, assign a technician, and verify that the job appears in their task list.
3. **Status Override**: Verify that you cannot bypass diagnostic states when updating a job's status.

#### 28.3.4 Technician Checklist
1. **Queue Isolation**: Verify that you can only view jobs assigned directly to you.
2. **Billing Fields**: Open a job card and verify that labor cost and spare parts fields are read-only.
3. **Status Updates**: Verify that you can update job statuses to `inspected` or `in_progress`, but cannot approve estimates or change billing details.

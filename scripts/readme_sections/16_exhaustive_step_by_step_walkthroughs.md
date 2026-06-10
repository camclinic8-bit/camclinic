## 21. Exhaustive Operational Walkthroughs & User Guides

This section provides a step-by-step guide for administrators, managers, and technicians on how to perform key operations in the Cam Clinic system.

---

### 21.1 Onboarding and System Setup

#### 21.1.1 Shop (Tenant) Creation
1. **Goal**: Configure a new parent organization in the database (typically done during initial onboarding).
2. **Steps**:
   - Access the Supabase SQL editor or run a database seed script.
   - Run an insert command on the `shops` table:
     ```sql
     INSERT INTO shops (name) VALUES ('Your Camera Service Pvt Ltd');
     ```
   - Record the returned shop UUID (`shop_id`).
3. **Validation**: Verify the record is visible by selecting from the `shops` table.

#### 21.1.2 Branch Registration
1. **Goal**: Register physical branches for the shop.
2. **Steps**:
   - Log in to the application as a **Super Admin** or **Service Manager**.
   - Navigate to `/branches` in the dashboard.
   - Click **Add Branch**.
   - Enter the branch name, physical address, email, telephone, and optional landline.
   - Click **Save**.
3. **Expected Outcome**: The new branch appears in the branch selector at the top of the dashboard.

#### 21.1.3 Staff Onboarding
1. **Goal**: Add and configure accounts for employees (managers, in-charges, and technicians).
2. **Steps**:
   - Log in as a **Super Admin**.
   - Navigate to the `/technicians` page (which contains the user management interface).
   - Scroll to the **Users Directory** section.
   - Click **Add Employee**.
   - Enter the employee's name, email, password, role (e.g. `technician`), and assign them to a branch.
   - Click **Save**.
3. **Validation**:
   - The system calls the backend API `/api/users/create`, which registers the user in Supabase Auth and updates the `public.profiles` table.
   - Verify that the employee can now log in using their credentials.

---

### 21.2 Service Job Lifecycle Walkthrough

#### 21.2.1 Customer Intake
1. **Goal**: Register a customer's walk-in and document their equipment details.
2. **Steps**:
   - Navigate to the `/jobs` page.
   - Click **New Job**.
   - Under **Customer Information**, search for the customer by phone or name. If they are not in the system, click **New Customer**, fill in their details (name, phone, address, alternate contact), and click **Create Customer**.
   - Under **Job Details**, select the service and delivery branches, priority, assigned manager, and technician.
   - Under **Products**, click **Add Product** for each piece of equipment they are checking in:
     - Enter the brand, model, and serial number.
     - Check the cosmetic condition boxes (e.g., `good`, `scratches`, `dusty`).
     - Select accessories left with the device (e.g., lens cap, battery, strap).
     - Enter the problem description and optional remarks.
     - If the item is under warranty, toggle **Warranty Details** and enter the warranty description and expiry date. Upload photos of the warranty card or receipt if available.
     - Take and upload intake photos of the equipment to document its condition.
   - Enter any optional diagnostic fee or advance payment made by the customer.
   - Click **Create Job**.
3. **Expected Outcome**: The job card is saved, a sequential job number (e.g., `CC-YYYYMMDD-0001`) is generated, and you are redirected to the job's details page.

#### 21.2.2 Handing Over the Intake Receipt
1. **Steps**:
   - On the job details page, click **Download Receipt**.
   - The browser generates and downloads the A4 Job Receipt PDF containing intake details, accessories checklist, and the advance payment ledger.
   - Print or email/WhatsApp the PDF to the customer as proof of custody.

#### 21.2.3 Diagnostic Inspection
1. **Goal**: The technician inspects the device on the bench and records their findings.
2. **Steps**:
   - The assigned **Technician** logs in and navigates to the `/technicians` task board.
   - Click on the assigned job.
   - Perform the physical inspection (e.g., diagnosing a shutter failure).
   - Click **Edit Job** or **Update Status**.
   - Set the status to `inspected` and log findings in the **Technician Notes** field (e.g., "Shutter blades worn out; requires shutter mechanism replacement").
   - Click **Save**.
3. **Expected Outcome**: The job status is updated, and the manager is notified in real time via the dashboard.

#### 21.2.4 Preparing the Estimate and Quote
1. **Goal**: Prepare a price estimate and send it to the customer for approval.
2. **Steps**:
   - The **Service Incharge** or **Service Manager** navigates to the job card.
   - Click **Edit Job**.
   - Enter the estimated labor cost in the **Service Charges** field.
   - Under **Spare Parts**, click **Add Part**:
     - Enter the part name (e.g., "OEM Shutter Unit").
     - Enter the quantity, unit price, and HSN code.
     - Click **Save Part**.
   - Toggle **GST (18%)** on or off (the system automatically calculates GST on labor charges).
   - Set the status to `quote_sent`.
   - Click **Save**.
   - On the details page, click **Download Quote**.
   - Send the generated Quote PDF to the customer.

#### 21.2.5 Recording Customer Approval
1. **Steps**:
   - Once the customer approves the estimate, log in and open the job card.
   - Click **Edit Job**.
   - Change the status to `approved`.
   - Click **Save**.
2. **Validation**: The job moves to the `approved` list, allowing the technician to begin repairs. If rejected, set the status to `disapproved`, and the system will update the balance due to reflect only the diagnostic inspection fee.

#### 21.2.6 Executing Repairs & Inventory Allocations
1. **Steps**:
   - The technician opens the job on their dashboard.
   - If waiting for parts, set the status to `spare_parts_pending`.
   - Once parts arrive, set the status to `in_progress` and perform the repair.
   - After completing the repair and passing quality checks, set the status to `completed`.
2. **Expected Outcome**: The system automatically logs the completion timestamp (`service_date`), and the customer is notified that their device is ready for pickup.

#### 21.2.7 Final Payment & Pickup
1. **Goal**: Hand over the device, collect the remaining balance, and issue a Tax Invoice.
2. **Steps**:
   - The customer arrives at the pickup branch.
   - The manager opens the job card.
   - Under **Payments Ledger**, click **Record Payment**:
     - Enter the payment amount (the system pre-fills the remaining balance).
     - Select the payment method (UPI, Cash, or Card).
     - Click **Submit**.
   - Click **Download Invoice** to generate and print the Tax Invoice.
   - Hand over the equipment and invoice to the customer.
3. **Expected Outcome**: The job balance is updated to zero, and the transaction is logged in the reports ledger.

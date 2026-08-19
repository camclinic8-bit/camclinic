## 4. User Roles, Permissions, & Workflows

### 4.1 Role Matrix
Cam Clinic enforces strict role-based access control (RBAC). A user's role determines which routes they can access, what data they can see, and what actions they can perform.

| Feature / Permission | Super Admin | Service Manager | Service Incharge | Technician |
|---|:---:|:---:|:---:|:---:|
| **Read All Branches Data** | ✅ Yes | ✅ Yes | ❌ Home Branch Only | ❌ Assigned Jobs Only |
| **Manage Branches** | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Manage Staff Users** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Create Jobs / Customers** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Assign Incharge / Technician** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| **Edit Billing Details** | ✅ Yes | ✅ Yes | ✅ Yes | ❌ Read-Only |
| **Delete Jobs** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Override Job Status (Any)** | ✅ Yes | ✅ Yes | ❌ Pipeline Order | ❌ Limited Options |

---

### 4.2 Job Status Pipeline
A service job transitions through a structured set of states to represent its real-world status. The state transitions are audited in `job_status_history`.

```
    [new]
      |
      v
 [inspected]
      |
      +------> [pending_approval]
      |              |
      |              +-------> [quote_sent]
      |                             |
      |              +--------------+
      |              v
      +------> [approved] <----+
      |              |         |
      |              v         |
      +------> [disapproved] --+
      |              |
      |              +-------> [spare_parts_pending]
      |                             |
      |              +--------------+
      |              v
      +------> [in_progress]
      |              |
      v              v
 [cancelled]    [completed]
```

#### Status Descriptions:
1. **`new`**: Job card created at intake. Diagnostic/inspection pending.
2. **`inspected`**: Bench diagnostics completed by the assigned technician. Issue identified and logged.
3. **`pending_approval`**: Diagnostics done; estimate prepared. Waiting for manager review.
4. **`quote_sent`**: Estimate shared with customer (Quote PDF generated). Waiting for customer response.
5. **`approved`**: Customer approved charges and estimated completion timeline.
6. **`disapproved`**: Customer rejected estimation. Preparing device for return with diagnostic fee.
7. **`spare_parts_pending`**: Approved repair is stalled waiting for external parts supply.
8. **`in_progress`**: Repair actively being worked on by the bench technician.
9. **`completed`**: Repair successfully done, final quality checks passed. Ready for pickup.
10. **`cancelled`**: Job cancelled due to return-without-repair or other cancellation reasons.

---

### 4.3 Process Flows & Diagrams

#### 4.3.1 DFD Level 0 (Context Diagram)
The Context Diagram represents the core interface boundaries of the Cam Clinic system.

```mermaid
graph TD
    Customer([Customer])
    Staff([Branch Staff / Tech / Incharge / Manager])
    Sys[[Cam Clinic System]]
    SAdmin([Super Admin])

    Customer -- Device Intake / Details --> Sys
    Customer -- Cash/UPI Payment --> Sys
    Sys -- Print Job Receipt / Quote / Invoice --> Customer
    
    Staff -- Diagnostic Notes / Parts Status --> Sys
    Sys -- Real-time Job Queue / Notifications --> Staff

    SAdmin -- User Creation / Branch Settings / SQL Migrations --> Sys
    Sys -- Global Audit Log / Financial Analytics --> SAdmin
```

#### 4.3.2 DFD Level 1 (Intake, Diagnostic, and Billing Operations)
Shows process transformations and data store interactions inside the system.

```mermaid
graph TD
    subgraph PROCESSES
        P1[1. Customer Intake]
        P2[2. Device Diagnostics]
        P3[3. Financial Approvals]
        P4[4. Repair Execution]
        P5[5. Billing & Return]
    end

    subgraph DATA_STORES
        D1[(customers)]
        D2[(jobs)]
        D3[(job_products)]
        D4[(spare_parts)]
        D5[(payment_transactions)]
    end

    %% Intake
    Cust([Customer]) -- 1. Personal & Device Info --> P1
    P1 -- Create/Update --> D1
    P1 -- Create Job Header --> D2
    P1 -- Create Linked Items --> D3

    %% Diagnostics
    Tech([Technician]) -- 2. Update Inspection Details --> P2
    P2 -- Read Details --> D3
    P2 -- Update Status, Notes --> D2

    %% Approvals
    Mgr([Manager]) -- 3. Review Estimate & Send Quote --> P3
    P3 -- Read Job & Charges --> D2
    P3 -- Create Spare Parts Request --> D4
    P3 -- Write Status Update --> D2

    %% Execution
    Tech -- 4. Repair & Pull Parts --> P4
    P4 -- Fetch Spare Parts Status --> D4
    P4 -- Complete Repair Status --> D2

    %% Billing & Delivery
    Mgr -- 5. Collect Payments & Close --> P5
    P5 -- Write Payment Entry --> D5
    P5 -- Calculate Balance --> D2
    P5 -- Generate Invoice PDF --> Cust
```

#### 4.3.3 Detailed User Flow Sequence Diagram
Illustrates step-by-step sequencing for a standard mirrorless camera repair.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer
    actor Incharge as Service Incharge
    actor Tech as Technician
    actor Manager as Service Manager
    participant DB as Supabase DB

    Note over Customer, Incharge: Intake Phase
    Customer->>Incharge: Walks in with faulty Sony A7IV & lens
    Incharge->>DB: Check/Create Customer Record
    DB-->>Incharge: Customer ID returned
    Incharge->>DB: Submit Job & Products (create_job_with_products RPC)
    DB-->>Incharge: Job Saved, Job ID & CC-NNNNN returned
    Incharge->>Customer: Print & hand over Job Receipt PDF

    Note over Incharge, Tech: Diagnostics Phase
    Manager->>DB: Assign Technician to Job ID
    DB-->>Tech: Real-time update (via web sockets) on Tech list
    Tech->>DB: Fetch detailed job products list
    Tech->>Tech: Bench inspection (diagnoses shutter failure)
    Tech->>DB: Update status to 'inspected', log shutter repair notes

    Note over Manager, Customer: Quotation & Approval Phase
    Manager->>DB: Fetch Job & diagnostic notes
    Manager->>DB: Insert Spare Part: Shutter Unit (total: 8900 INR)
    Manager->>DB: Set Labor charges to 2500 INR, Enable GST
    DB-->>Manager: Trigger auto-updates Grand Total & Balance
    Manager->>DB: Update status to 'quote_sent'
    Manager->>Customer: Download & email/WhatsApp Quote PDF
    Customer->>Manager: Gives permission/approves estimate
    Manager->>DB: Update status to 'approved'

    Note over Tech, Manager: Repair & Delivery Phase
    Tech->>DB: Update status to 'in_progress'
    Tech->>Tech: Replaces shutter unit, cleans sensor
    Tech->>DB: Update status to 'completed', log completion date
    DB-->>Manager: Real-time update showing job is ready for pickup
    Customer->>Manager: Comes to collect device
    Manager->>DB: Insert final Payment transaction (UPI/Cash)
    DB-->>Manager: Trigger updates Balance to 0
    Manager->>Customer: Generate & print Tax Invoice PDF, hand over camera
```

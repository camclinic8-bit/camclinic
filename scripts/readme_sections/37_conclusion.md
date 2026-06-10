## 43. Future Roadmap & Planned Features

This section documents the planned feature expansions, system scalability improvements, and project milestones for the next major releases (v0.2.0 and beyond).

---

### 43.1 Planned Feature Roadmap

#### 43.1.1 Real-Time Customer Notifications
- **Goal**: Automatically notify customers when repair milestones are met (such as diagnostic updates, approval requests, or ready-for-pickup notifications).
- **Implementation**:
  - Integrate a messaging proxy API (e.g. Twilio SMS, WhatsApp Business API).
  - Add database triggers to call external webhooks when the `jobs.status` field changes.
  - Implement email notification templates using email clients like SendGrid.

#### 43.1.2 Self-Intake Customer Kiosk
- **Goal**: Allow walk-in customers to register themselves, enter camera details, check condition boxes, and queue themselves, reducing staff intake overhead.
- **Implementation**:
  - Create a public-facing self-service kiosk page.
  - Use restricted RLS rules to allow only INSERT operations from kiosk devices.

#### 43.1.3 Technician Efficiency Dashboard
- **Goal**: Provide managers with metrics on technician repair times, diagnostic accuracies, parts allocations, and monthly volumes.
- **Implementation**:
  - Aggregate status logs from the `job_status_history` table (measuring the duration between `approved` and `completed` states).
  - Display efficiency charts on the reports dashboard.

#### 43.1.4 Central Inventory Routing
- **Goal**: Support transfer processes where parts are shipped between branches.
- **Implementation**:
  - Create inventory transfer ledgers.
  - Update spare parts logic to track shipment and receipt states across branches.

---

### 43.2 Conclusion & System Scalability

The Cam Clinic codebase has been built from the ground up to be scalable, robust, and performant. 
- Using **Next.js 16 App Router** and **React 19** ensures fast page loads and responsive user interfaces.
- The **Supabase (PostgreSQL 15)** database layer handles tenant isolation via strict Row-Level Security (RLS) policies and transaction safety using stored procedures.
- Data fetching, caching, and state synchronization are managed using **React Query 5** and **Zustand 5**, ensuring components remain decoupled and clean.
- Custom viewport-relative infinite scrolling and mouse-drag gestures provide a premium user experience when browsing thousands of records.

This system is ready to scale from a single camera service center to a national repair network.

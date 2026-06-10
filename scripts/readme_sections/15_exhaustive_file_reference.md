## 20. Comprehensive Codebase Type Signatures & API References

This section lists the exact TypeScript type definitions, enums, utility signatures, and component interfaces used across the frontend application.

---

### 20.1 Core Database Enums (`src/types/enums.ts`)

System-wide statuses and priorities are declared as strict TypeScript types:

```typescript
export type UserRole = 'super_admin' | 'service_manager' | 'service_incharge' | 'technician';

export type JobStatus =
  | 'new'
  | 'inspected'
  | 'pending_approval'
  | 'quote_sent'
  | 'approved'
  | 'disapproved'
  | 'spare_parts_pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type JobPriority = 'immediate' | 'high' | 'medium' | 'low';

export type ProductCondition =
  | 'good'
  | 'dusty'
  | 'scratches'
  | 'damage'
  | 'not_working'
  | 'dead'
  | 'liquid_damage';
```

---

### 20.2 Main Interface Definitions (`src/types/job.ts`)

These models map directly to Postgres schema columns:

```typescript
export interface Job {
  id: string;
  shop_id: string;
  job_number: string;
  customer_id: string;
  service_branch_id: string;
  delivery_branch_id: string;
  assigned_incharge_id: string | null;
  assigned_technician_id: string | null;
  status: JobStatus;
  priority: JobPriority;
  description: string | null;
  technician_notes: string | null;
  cam_clinic_advisory_notes: string | null;
  inspection_fee: number;
  service_charges: number;
  spare_parts_total_cost: number;
  total_charges: number;
  gst_enabled: boolean;
  gst_amount: number;
  grand_total: number;
  advance_paid: number;
  advance_paid_date: string | null;
  balance_amount: number;
  estimate_delivery_date: string | null;
  service_date: string | null;
  alternative_contact: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobProduct {
  id: string;
  job_id: string;
  brand: string;
  model: string;
  serial_number: string;
  condition: ProductCondition[];
  description: string | null;
  remarks: string | null;
  has_warranty: boolean;
  warranty_description: string | null;
  warranty_expiry_date: string | null;
  repeat_job_number: string | null;
  other_job_number: string | null;
  warranty_images: string[];
  product_images: string[];
  accessories?: { id: string; name: string }[];
  other_parts?: { id: string; name: string }[];
}

export interface SparePart {
  id: string;
  job_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  hsn_code: string | null;
}

export interface PaymentTransaction {
  id: string;
  job_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}
```

---

### 20.3 Utility Functions Implementations

#### 20.3.1 Indian Rupee Formatting (`src/lib/utils/currency.ts`)
```typescript
/**
 * Formats a numeric value into the Indian Rupee (INR) currency format (₹).
 * Handles rounding parameters and matches standard Indian numbering groupings (e.g. 1,00,000).
 */
export function formatINR(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '₹0.00';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}
```

#### 20.3.2 Sequential Date-Based Job Numbers (`src/lib/utils/jobNumber.ts`)
```typescript
/**
 * Generates temporary client-side job numbers.
 * Enforces consistency before the database RPC assigns the final sequence.
 */
export function generateTempJobNumber(branchCode: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randSeq = Math.floor(1000 + Math.random() * 9000);
  return `CC-${dateStr}-${randSeq}-TEMP`;
}
```

---

### 20.4 Component Interfaces (`src/components/ui/`)

#### 20.4.1 Button Component Interface
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}
```

#### 20.4.2 Modal Dialog Component Interface
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

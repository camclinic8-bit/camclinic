## 23. Complete Database Types, Mappings, & API Request Schemas

This section lists the TypeScript type mappings and interfaces generated for the database, matching the schema definitions of Supabase and Next.js server components.

---

### 23.1 Supabase Schema Type Definitions (`src/types/database.ts`)

These definitions represent the shape of the database tables, views, and functions.

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      branches: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          address: string;
          phone: string | null;
          email: string | null;
          landline: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          name: string;
          address: string;
          phone?: string | null;
          email?: string | null;
          landline?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          name?: string;
          address?: string;
          phone?: string | null;
          email?: string | null;
          landline?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          shop_id: string;
          branch_id: string | null;
          email: string;
          full_name: string;
          phone: string | null;
          role: 'super_admin' | 'service_manager' | 'service_incharge' | 'technician';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          shop_id: string;
          branch_id?: string | null;
          email: string;
          full_name: string;
          phone?: string | null;
          role?: 'super_admin' | 'service_manager' | 'service_incharge' | 'technician';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          branch_id?: string | null;
          email?: string;
          full_name?: string;
          phone?: string | null;
          role?: 'super_admin' | 'service_manager' | 'service_incharge' | 'technician';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          phone: string;
          alternative_phone: string | null;
          email: string | null;
          address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          name: string;
          phone: string;
          alternative_phone?: string | null;
          email?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          name?: string;
          phone?: string;
          alternative_phone?: string | null;
          email?: string | null;
          address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      jobs: {
        Row: {
          id: string;
          shop_id: string;
          job_number: string;
          customer_id: string;
          service_branch_id: string;
          delivery_branch_id: string;
          assigned_incharge_id: string | null;
          assigned_technician_id: string | null;
          status: 'new' | 'inspected' | 'pending_approval' | 'quote_sent' | 'approved' | 'disapproved' | 'spare_parts_pending' | 'in_progress' | 'completed' | 'cancelled';
          priority: 'immediate' | 'high' | 'medium' | 'low';
          description: string | null;
          technician_notes: string | null;
          cam_clinic_advisory_notes: string | null;
          alternative_contact: string | null;
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
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          job_number: string;
          customer_id: string;
          service_branch_id: string;
          delivery_branch_id: string;
          assigned_incharge_id?: string | null;
          assigned_technician_id?: string | null;
          status?: 'new' | 'inspected' | 'pending_approval' | 'quote_sent' | 'approved' | 'disapproved' | 'spare_parts_pending' | 'in_progress' | 'completed' | 'cancelled';
          priority?: 'immediate' | 'high' | 'medium' | 'low';
          description?: string | null;
          technician_notes?: string | null;
          cam_clinic_advisory_notes?: string | null;
          alternative_contact?: string | null;
          inspection_fee?: number;
          service_charges?: number;
          spare_parts_total_cost?: number;
          total_charges?: number;
          gst_enabled?: boolean;
          gst_amount?: number;
          grand_total?: number;
          advance_paid?: number;
          advance_paid_date?: string | null;
          balance_amount?: number;
          estimate_delivery_date?: string | null;
          service_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          job_number?: string;
          customer_id?: string;
          service_branch_id?: string;
          delivery_branch_id?: string;
          assigned_incharge_id?: string | null;
          assigned_technician_id?: string | null;
          status?: 'new' | 'inspected' | 'pending_approval' | 'quote_sent' | 'approved' | 'disapproved' | 'spare_parts_pending' | 'in_progress' | 'completed' | 'cancelled';
          priority?: 'immediate' | 'high' | 'medium' | 'low';
          description?: string | null;
          technician_notes?: string | null;
          cam_clinic_advisory_notes?: string | null;
          alternative_contact?: string | null;
          inspection_fee?: number;
          service_charges?: number;
          spare_parts_total_cost?: number;
          total_charges?: number;
          gst_enabled?: boolean;
          gst_amount?: number;
          grand_total?: number;
          advance_paid?: number;
          advance_paid_date?: string | null;
          balance_amount?: number;
          estimate_delivery_date?: string | null;
          service_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
```

---

### 23.2 Query Filter Mappings (`src/types/job.ts`)

Defines the payload structure for fetching filtered job sets:

```typescript
export interface JobFilters {
  search?: string;
  status?: JobStatus | JobStatus[];
  priority?: JobPriority | JobPriority[];
  branch_id?: string;
  technician_id?: string;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'updated_at' | 'estimate_delivery_date' | 'job_number' | 'grand_total' | 'balance_amount';
  sort_order?: 'asc' | 'desc';
}

export interface JobCreateInput {
  customer_id: string;
  service_branch_id: string;
  delivery_branch_id: string;
  assigned_incharge_id?: string | null;
  assigned_technician_id?: string | null;
  priority: JobPriority;
  description?: string | null;
  inspection_fee?: number;
  advance_paid?: number;
  advance_paid_date?: string | null;
  estimate_delivery_date?: string | null;
  spare_parts_total_cost?: number;
  spare_parts_private_details?: {
    name: string;
    quantity: number;
    unit_cost: number;
    hsn_code?: string | null;
  }[];
  products: {
    brand: string | null;
    model: string | null;
    serial_number: string | null;
    condition: ProductCondition | null;
    description: string | null;
    remarks: string | null;
    has_warranty: boolean;
    warranty_description: string | null;
    warranty_expiry_date: string | null;
    repeat_job_number?: string | null;
    other_job_number?: string | null;
    warranty_images?: string[];
    product_images?: string[];
    accessories?: string[];
    other_parts?: string[];
  }[];
  alternative_contact?: string | null;
}
```
---

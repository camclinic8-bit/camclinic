import { JobStatus, JobPriority, ProductCondition } from './enums';
import { Customer } from './customer';
import { Branch } from './branch';
import { Profile } from './user';
import { SparePart } from './billing';

export interface JobProduct {
  id: string;
  job_id: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  condition: ProductCondition | null;
  description: string | null;
  remarks: string | null;
  has_warranty: boolean;
  warranty_description: string | null;
  warranty_expiry_date: string | null;
  created_at: string;
  updated_at: string;
  accessories?: ProductAccessory[];
  other_parts?: ProductOtherPart[];
}

export interface ProductAccessory {
  id: string;
  job_product_id: string;
  name: string;
  created_at: string;
}

export interface ProductOtherPart {
  id: string;
  job_product_id: string;
  name: string;
  created_at: string;
}

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
  advance_paid: number;
  advance_paid_date: string | null;
  gst_enabled: boolean;
  gst_amount: number;
  total_charges: number;
  grand_total: number;
  balance_amount: number;
  estimate_delivery_date: string | null;
  service_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface JobWithRelations extends Job {
  customer?: Customer | null;
  service_branch?: Branch | null;
  delivery_branch?: Branch | null;
  assigned_incharge?: Profile | null;
  assigned_technician?: Profile | null;
  created_by_user?: Profile | null;
  products?: JobProduct[];
  spare_parts?: SparePart[];
  status_history?: JobStatusHistory[];
}

export interface JobStatusHistory {
  id: string;
  job_id: string;
  from_status: JobStatus | null;
  to_status: JobStatus;
  changed_by: string;
  notes: string | null;
  created_at: string;
  changed_by_user?: Profile | null;
}

export interface JobDocument {
  id: string;
  job_id: string;
  document_type: 'receipt' | 'quote' | 'invoice';
  generated_at: string;
  generated_by: string;
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
  products: JobProductInput[];
}

export interface JobProductInput {
  brand?: string | null;
  model?: string | null;
  serial_number?: string | null;
  condition?: ProductCondition | null;
  description?: string | null;
  remarks?: string | null;
  has_warranty?: boolean;
  warranty_description?: string | null;
  warranty_expiry_date?: string | null;
  accessories?: string[];
  other_parts?: string[];
}

export interface JobUpdateInput {
  status?: JobStatus;
  priority?: JobPriority;
  assigned_incharge_id?: string | null;
  assigned_technician_id?: string | null;
  description?: string | null;
  technician_notes?: string | null;
  cam_clinic_advisory_notes?: string | null;
  inspection_fee?: number;
  service_charges?: number;
  advance_paid?: number;
  advance_paid_date?: string | null;
  gst_enabled?: boolean;
  estimate_delivery_date?: string | null;
}

export interface JobFilters {
  status?: JobStatus | JobStatus[];
  priority?: JobPriority | JobPriority[];
  branch_id?: string;
  technician_id?: string;
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

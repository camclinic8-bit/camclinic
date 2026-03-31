export interface SparePart {
  id: string;
  job_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface JobBilling {
  inspection_fee: number;
  service_charges: number;
  spare_parts_total: number;
  total_charges: number;
  gst_enabled: boolean;
  gst_amount: number;
  grand_total: number;
  advance_paid: number;
  advance_paid_date: string | null;
  balance_amount: number;
}

export interface SparePartInput {
  name: string;
  quantity: number;
  unit_price: number;
}

import { 
  UserRole, 
  JobStatus, 
  JobPriority, 
  ProductCondition 
} from './enums';

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
          address: string | null;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          name?: string;
          address?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          shop_id: string | null;
          branch_id: string | null;
          full_name: string;
          email: string | null;
          phone: string | null;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          shop_id?: string | null;
          branch_id?: string | null;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          role?: UserRole;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string | null;
          branch_id?: string | null;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          role?: UserRole;
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
          status?: JobStatus;
          priority?: JobPriority;
          description?: string | null;
          technician_notes?: string | null;
          cam_clinic_advisory_notes?: string | null;
          inspection_fee?: number;
          service_charges?: number;
          advance_paid?: number;
          advance_paid_date?: string | null;
          gst_enabled?: boolean;
          gst_amount?: number;
          total_charges?: number;
          grand_total?: number;
          balance_amount?: number;
          estimate_delivery_date?: string | null;
          service_date?: string | null;
          created_by: string;
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
          status?: JobStatus;
          priority?: JobPriority;
          description?: string | null;
          technician_notes?: string | null;
          cam_clinic_advisory_notes?: string | null;
          inspection_fee?: number;
          service_charges?: number;
          advance_paid?: number;
          advance_paid_date?: string | null;
          gst_enabled?: boolean;
          gst_amount?: number;
          total_charges?: number;
          grand_total?: number;
          balance_amount?: number;
          estimate_delivery_date?: string | null;
          service_date?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      job_products: {
        Row: {
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
        };
        Insert: {
          id?: string;
          job_id: string;
          brand?: string | null;
          model?: string | null;
          serial_number?: string | null;
          condition?: ProductCondition | null;
          description?: string | null;
          remarks?: string | null;
          has_warranty?: boolean;
          warranty_description?: string | null;
          warranty_expiry_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          brand?: string | null;
          model?: string | null;
          serial_number?: string | null;
          condition?: ProductCondition | null;
          description?: string | null;
          remarks?: string | null;
          has_warranty?: boolean;
          warranty_description?: string | null;
          warranty_expiry_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_accessories: {
        Row: {
          id: string;
          job_product_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_product_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_product_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      product_other_parts: {
        Row: {
          id: string;
          job_product_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_product_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_product_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      spare_parts: {
        Row: {
          id: string;
          job_id: string;
          name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          name: string;
          quantity?: number;
          unit_price?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          name?: string;
          quantity?: number;
          unit_price?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      job_status_history: {
        Row: {
          id: string;
          job_id: string;
          from_status: JobStatus | null;
          to_status: JobStatus;
          changed_by: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          from_status?: JobStatus | null;
          to_status: JobStatus;
          changed_by: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          from_status?: JobStatus | null;
          to_status?: JobStatus;
          changed_by?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      job_documents: {
        Row: {
          id: string;
          job_id: string;
          document_type: string;
          generated_at: string;
          generated_by: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          document_type: string;
          generated_at?: string;
          generated_by: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          document_type?: string;
          generated_at?: string;
          generated_by?: string;
        };
      };
    };
    Enums: {
      user_role: UserRole;
      job_status: JobStatus;
      job_priority: JobPriority;
      product_condition: ProductCondition;
    };
  };
}

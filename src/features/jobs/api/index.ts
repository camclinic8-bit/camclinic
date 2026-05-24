/**
 * Jobs API - Centralized Job Operations
 * 
 * All job-related database operations should go through this module.
 * No direct Supabase queries should exist outside of this layer.
 */

import { getClient } from '@/lib/supabase/singleton';
import { handleSupabaseError, NotFoundError, DatabaseError } from '@/lib/errors';
import type { Job, JobWithRelations, JobCreateInput, JobUpdateInput, JobFilters, JobStatusHistory } from '@/types/job';
import type { JobStatus } from '@/types/enums';

/**
 * Get paginated list of jobs with optional filters
 * Optimized for list view - only selects necessary columns
 */
export async function getJobs(filters?: JobFilters, page = 1, pageSize = 20): Promise<{
  data: JobWithRelations[];
  count: number;
}> {
  try {
    const supabase = getClient();
    
    // Use explicit foreign key hints to avoid ambiguity (matching original working query)
    let query = supabase
      .from('jobs')
      .select(`
        *,
        customer:customers(id, name, phone, email),
        service_branch:branches!jobs_service_branch_id_fkey(id, name),
        delivery_branch:branches!jobs_delivery_branch_id_fkey(id, name),
        assigned_incharge:profiles!jobs_assigned_incharge_id_fkey(id, full_name, phone),
        assigned_technician:profiles!jobs_assigned_technician_id_fkey(id, full_name, phone),
        created_by_user:profiles!jobs_created_by_fkey(id, full_name),
        products:job_products(id, brand, model)
      `, { count: 'exact' });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters?.branch_id) {
      query = query.eq('service_branch_id', filters.branch_id);
    }

    if (filters?.technician_id) {
      query = query.eq('assigned_technician_id', filters.technician_id);
    }

    if (filters?.sort_by) {
      const order = filters.sort_order || 'desc';
      query = query.order(filters.sort_by, { ascending: order === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) throw handleSupabaseError(error);

    let jobs = (data as JobWithRelations[]) || [];
    
    // Client-side filtering for search (job number, customer name, phone)
    if (filters?.search && jobs.length > 0) {
      const term = filters.search.trim().toLowerCase();
      jobs = jobs.filter(job => 
        job.customer?.name?.toLowerCase().includes(term) ||
        job.customer?.phone?.toLowerCase().includes(term) ||
        job.job_number?.toLowerCase().includes(term)
      );
    }

    return { data: jobs, count: count || 0 };
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Get a single job by ID with all relations
 */
export async function getJobById(id: string): Promise<JobWithRelations> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        customer:customers(id, name, phone, email, address),
        service_branch:branches!jobs_service_branch_id_fkey(id, name),
        delivery_branch:branches!jobs_delivery_branch_id_fkey(id, name),
        assigned_incharge:profiles!jobs_assigned_incharge_id_fkey(id, full_name),
        assigned_technician:profiles!jobs_assigned_technician_id_fkey(id, full_name),
        products:job_products(
          id,
          job_id,
          brand,
          model,
          serial_number,
          condition,
          description,
          remarks,
          has_warranty,
          warranty_description,
          warranty_expiry_date,
          accessories:product_accessories(id, job_product_id, name),
          other_parts:product_other_parts(id, job_product_id, name)
        ),
        spare_parts:spare_parts(id, job_id, name, quantity, unit_price, total_price),
        status_history:job_status_history(
          id,
          job_id,
          from_status,
          to_status,
          changed_by,
          notes,
          created_at,
          changed_by_user:profiles(id, full_name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Job with ID ${id} not found`);
      }
      throw handleSupabaseError(error);
    }

    return data as JobWithRelations;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Create a new job with products (transaction-safe via RPC)
 */
export async function createJob(
  input: JobCreateInput,
  shopId: string,
  createdBy: string
): Promise<Job> {
  try {
    const supabase = getClient();
    
    const productsJson = input.products.map(p => ({
      brand: p.brand,
      model: p.model,
      serial_number: p.serial_number,
      condition: p.condition,
      description: p.description,
      remarks: p.remarks,
      has_warranty: p.has_warranty,
      warranty_description: p.warranty_description,
      warranty_expiry_date: p.warranty_expiry_date,
      accessories: p.accessories || [],
      other_parts: p.other_parts || [],
    }));

    const { data, error } = await supabase
      .rpc('create_job_with_products', {
        p_shop_id: shopId,
        p_customer_id: input.customer_id,
        p_service_branch_id: input.service_branch_id,
        p_delivery_branch_id: input.delivery_branch_id,
        p_created_by: createdBy,
        p_assigned_incharge_id: input.assigned_incharge_id || null,
        p_assigned_technician_id: input.assigned_technician_id || null,
        p_priority: input.priority,
        p_description: input.description || null,
        p_inspection_fee: input.inspection_fee ?? 0,
        p_advance_paid: input.advance_paid ?? 0,
        p_advance_paid_date: input.advance_paid && input.advance_paid > 0
          ? input.advance_paid_date?.trim() || null
          : null,
        p_estimate_delivery_date: input.estimate_delivery_date?.trim() || null,
        p_products: productsJson,
      } as any);

    if (error) throw handleSupabaseError(error);

    // Fetch the complete job
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', (data as { id: string }).id)
      .single();

    if (fetchError) throw handleSupabaseError(fetchError);

    return job as Job;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Update a job (transaction-safe via RPC)
 */
export async function updateJob(
  id: string,
  input: JobUpdateInput,
  userId: string
): Promise<Job> {
  try {
    const supabase = getClient();
    
    const { data, error } = await supabase
      .rpc('update_job_with_products', {
        p_job_id: id,
        p_user_id: userId,
        p_status: input.status || null,
        p_priority: input.priority || null,
        p_service_branch_id: input.service_branch_id || null,
        p_delivery_branch_id: input.delivery_branch_id || null,
        p_assigned_incharge_id: input.assigned_incharge_id || null,
        p_assigned_technician_id: input.assigned_technician_id || null,
        p_description: input.description || null,
        p_technician_notes: input.technician_notes || null,
        p_cam_clinic_advisory_notes: input.cam_clinic_advisory_notes || null,
        p_inspection_fee: input.inspection_fee || null,
        p_service_charges: input.service_charges || null,
        p_advance_paid: input.advance_paid || null,
        p_advance_paid_date: input.advance_paid_date || null,
        p_gst_enabled: input.gst_enabled || null,
        p_estimate_delivery_date: input.estimate_delivery_date || null,
        p_products: null,
      } as any);

    if (error) throw handleSupabaseError(error);

    // Fetch the complete job
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw handleSupabaseError(fetchError);

    return job as Job;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Update job status with history logging (transaction-safe via RPC)
 */
export async function updateJobStatus(
  id: string,
  status: JobStatus,
  userId: string,
  notes?: string
): Promise<Job> {
  try {
    const supabase = getClient();
    
    const { data, error } = await supabase
      .rpc('update_job_status_with_history', {
        p_job_id: id,
        p_status: status,
        p_user_id: userId,
        p_notes: notes || null,
      } as any);

    if (error) throw handleSupabaseError(error);

    // Fetch the complete job
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw handleSupabaseError(fetchError);

    return job as Job;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Delete a job
 */
export async function deleteJob(id: string): Promise<void> {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id);

    if (error) throw handleSupabaseError(error);
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Get job status history
 */
export async function getJobStatusHistory(jobId: string): Promise<JobStatusHistory[]> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('job_status_history')
      .select(`
        *,
        changed_by_user:profiles(*)
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw handleSupabaseError(error);

    return (data as JobStatusHistory[]) || [];
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Get job counts by status
 */
export async function getJobCounts(): Promise<Record<string, number>> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('jobs')
      .select('status')
      .throwOnError();

    if (error) throw handleSupabaseError(error);

    const counts: Record<string, number> = {};
    (data as Job[]).forEach((job) => {
      counts[job.status] = (counts[job.status] || 0) + 1;
    });

    return counts;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Get jobs due today
 */
export async function getJobsDueToday(): Promise<Job[]> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('estimate_delivery_date', new Date().toISOString().split('T')[0])
      .in('status', ['new', 'inspected', 'pending_approval', 'approved', 'in_progress'])
      .order('priority', { ascending: false });

    if (error) throw handleSupabaseError(error);

    return (data as Job[]) || [];
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

import { SupabaseClient } from '@supabase/supabase-js';
import { handleSupabaseError } from '@/lib/errors';
import { normalizeJobProductWarrantyForDb } from '@/lib/utils/normalizeJobProduct';
import { getLocalToday } from '@/lib/utils/dates';
import { 
  Job, 
  JobWithRelations, 
  JobCreateInput, 
  JobUpdateInput, 
  JobFilters,
  JobStatusHistory,
  PaymentTransaction
} from '@/types/job';
import { JobStatus } from '@/types/enums';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypedSupabaseClient = SupabaseClient<any>;

/** Trim search; avoid commas (break PostgREST .or) and stray % in ilike patterns. */
function sanitizeJobSearchTerm(raw: string): string {
  return raw.trim().replace(/,/g, ' ').replace(/%/g, '');
}

export async function getJobs(
  supabase: TypedSupabaseClient,
  filters?: JobFilters,
  page = 1,
  pageSize = 20
): Promise<{ data: JobWithRelations[]; count: number }> {
  const sortBy = filters?.sort_by || 'created_at';
  const sortOrder = filters?.sort_order || 'desc';

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
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters?.priority) {
    if (Array.isArray(filters.priority)) {
      query = query.in('priority', filters.priority);
    } else {
      query = query.eq('priority', filters.priority);
    }
  }

  if (filters?.branch_id) {
    query = query.or(`service_branch_id.eq.${filters.branch_id},delivery_branch_id.eq.${filters.branch_id}`);
  }

  if (filters?.technician_id) {
    query = query.eq('assigned_technician_id', filters.technician_id);
  }

  if (filters?.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }

  if (filters?.date_from) {
    query = query.gte('created_at', filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  if (filters?.search) {
    const term = sanitizeJobSearchTerm(filters.search);
    if (term.length > 0) {
      // Match jobs by job # / description, or by linked customer name / phone (RLS-scoped).
      const digitsOnly = term.replace(/\D/g, '');
      const customerOr = [
        `name.ilike.%${term}%`,
        `phone.ilike.%${term}%`,
        ...(digitsOnly.length >= 4 && digitsOnly !== term ? [`phone.ilike.%${digitsOnly}%`] : []),
      ].join(',');

      const { data: matchingCustomers } = await supabase.from('customers').select('id').or(customerOr);

      const orParts = [`job_number.ilike.%${term}%`, `description.ilike.%${term}%`];
      const ids = matchingCustomers?.map((c) => c.id) ?? [];
      if (ids.length > 0) {
        // Use subquery approach to avoid IN clause limit
        // Split into batches to avoid URL length limits
        const batchSize = 100;
        for (let i = 0; i < ids.length; i += batchSize) {
          const batch = ids.slice(i, i + batchSize);
          orParts.push(`customer_id.in.(${batch.join(',')})`);
        }
      }
      query = query.or(orParts.join(','));
    }
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order(sortBy, { ascending: sortOrder === 'asc', nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return { 
    data: (data as unknown as JobWithRelations[]) || [], 
    count: count || 0 
  };
}

export async function getJobById(
  supabase: TypedSupabaseClient,
  id: string
): Promise<JobWithRelations | null> {
  const { data, error } = await supabase
    .from('jobs')
    .select(
      `
      *,
      customer:customers(id, name, phone, email, address),
      service_branch:branches!jobs_service_branch_id_fkey(id, name),
      delivery_branch:branches!jobs_delivery_branch_id_fkey(id, name),
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
        repeat_job_number,
        other_job_number,
        warranty_images,
        product_images,
        accessories:product_accessories(id, job_product_id, name),
        other_parts:product_other_parts(id, job_product_id, name)
      ),
      spare_parts(id, job_id, name, quantity, unit_price, total_price, hsn_code),
      status_history:job_status_history(
        id,
        job_id,
        from_status,
        to_status,
        changed_by,
        notes,
        created_at,
        changed_by_user:profiles!job_status_history_changed_by_fkey(id, full_name)
      ),
      payment_transactions:payment_transactions(
        id,
        job_id,
        amount,
        payment_date,
        payment_method,
        notes,
        created_by,
        created_at,
        created_by_user:profiles!payment_transactions_created_by_fkey(id, full_name)
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  const row = data as unknown as JobWithRelations;
  if (row.status_history?.length) {
    row.status_history = [...row.status_history].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }
  return row;
}

export async function createJob(
  supabase: TypedSupabaseClient,
  input: JobCreateInput,
  shopId: string,
  createdBy: string
): Promise<Job> {
  // Use transaction-safe RPC function
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
    repeat_job_number: p.repeat_job_number,
    other_job_number: p.other_job_number,
    warranty_images: p.warranty_images || [],
    product_images: p.product_images || [],
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
      p_assigned_incharge_id: input.assigned_incharge_id ?? null,
      p_assigned_technician_id: input.assigned_technician_id ?? null,
      p_priority: input.priority,
      p_description: input.description ?? null,
      p_inspection_fee: input.inspection_fee ?? 0,
      p_advance_paid: input.advance_paid ?? 0,
      p_advance_paid_date: input.advance_paid && input.advance_paid > 0
        ? input.advance_paid_date?.trim() || null
        : null,
      p_estimate_delivery_date: input.estimate_delivery_date?.trim() || null,
      p_spare_parts_total_cost: input.spare_parts_total_cost ?? 0,
      p_spare_parts_private_details: input.spare_parts_private_details || [],
      p_products: productsJson,
      p_alternative_contact: input.alternative_contact?.trim() || null,
    });

  if (error) throw handleSupabaseError(error);

  // Fetch the complete job with relations
  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', (data as { id: string }).id)
    .single();

  if (fetchError) throw fetchError;

  return job as Job;
}

export async function updateJob(
  supabase: TypedSupabaseClient,
  id: string,
  input: JobUpdateInput,
  userId: string
): Promise<Job> {
  // Use transaction-safe RPC function for basic job update
  // Note: Products are handled separately in the edit page for now
  // This could be consolidated in a future refactor
  const { data, error } = await supabase
    .rpc('update_job_with_products', {
      p_job_id: id,
      p_status: input.status ?? null,
      p_priority: input.priority ?? null,
      p_service_branch_id: input.service_branch_id ?? null,
      p_delivery_branch_id: input.delivery_branch_id ?? null,
      p_assigned_incharge_id: input.assigned_incharge_id ?? null,
      p_assigned_technician_id: input.assigned_technician_id ?? null,
      p_description: input.description ?? null,
      p_technician_notes: input.technician_notes ?? null,
      p_cam_clinic_advisory_notes: input.cam_clinic_advisory_notes ?? null,
      p_inspection_fee: input.inspection_fee ?? null,
      p_service_charges: input.service_charges ?? null,
      p_advance_paid: input.advance_paid ?? null,
      p_advance_paid_date: input.advance_paid_date ?? null,
      p_gst_enabled: input.gst_enabled ?? null,
      p_estimate_delivery_date: input.estimate_delivery_date ?? null,
      p_spare_parts_total_cost: input.spare_parts_total_cost ?? null,
      p_spare_parts_private_details: input.spare_parts_private_details ?? null,
      p_user_id: userId,
      p_products: null, // Products handled separately in edit page
      p_alternative_contact: input.alternative_contact?.trim() || null,
    });

  if (error) throw error;

  // Fetch the complete job with relations
  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  return job as Job;
}

export async function addPaymentTransaction(
  supabase: TypedSupabaseClient,
  jobId: string,
  amount: number,
  userId: string,
  paymentMethod: string = 'cash',
  notes?: string
): Promise<PaymentTransaction> {
  const { data, error } = await supabase
    .from('payment_transactions')
    .insert({
      job_id: jobId,
      amount,
      payment_method: paymentMethod,
      notes: notes || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  return data as PaymentTransaction;
}

export async function getPaymentTransactions(
  supabase: TypedSupabaseClient,
  jobId: string
): Promise<PaymentTransaction[]> {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select(`
      *,
      created_by_user:profiles!payment_transactions_created_by_fkey(id, full_name)
    `)
    .eq('job_id', jobId)
    .order('payment_date', { ascending: false });

  if (error) throw error;

  return (data as unknown as PaymentTransaction[]) || [];
}

export async function updateJobStatus(
  supabase: TypedSupabaseClient,
  id: string,
  status: JobStatus,
  userId: string,
  notes?: string
): Promise<Job> {
  // Use transaction-safe RPC function
  const { data, error } = await supabase
    .rpc('update_job_status_with_history', {
      p_job_id: id,
      p_status: status,
      p_user_id: userId,
      p_notes: notes || null,
    });

  if (error) throw error;

  // Fetch the complete job with relations
  const { data: job, error: fetchError } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  return job as Job;
}

export async function deleteJob(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { data, error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) {
    throw new Error(error.message || 'Failed to delete job');
  }
  if (!data?.length) {
    throw new Error(
      'Job was not deleted. You may need super admin access, or apply the latest database migrations.'
    );
  }
}

export async function getJobStatusHistory(
  supabase: TypedSupabaseClient,
  jobId: string
): Promise<JobStatusHistory[]> {
  const { data, error } = await supabase
    .from('job_status_history')
    .select(`
      *,
      changed_by_user:profiles(*)
    `)
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data as unknown as JobStatusHistory[]) || [];
}

export async function getJobCounts(
  supabase: TypedSupabaseClient,
  branchId?: string
): Promise<Record<JobStatus, number>> {
  let query = supabase
    .from('jobs')
    .select('status');

  if (branchId) {
    query = query.or(`service_branch_id.eq.${branchId},delivery_branch_id.eq.${branchId}`);
  }

  const { data, error } = await query;

  if (error) throw error;

  const counts: Record<JobStatus, number> = {
    new: 0,
    inspected: 0,
    pending_approval: 0,
    quote_sent: 0,
    approved: 0,
    disapproved: 0,
    spare_parts_pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  };

  data?.forEach(job => {
    counts[job.status as JobStatus]++;
  });

  return counts;
}

export async function getJobsDueToday(
  supabase: TypedSupabaseClient,
  branchId?: string
): Promise<JobWithRelations[]> {
  const today = getLocalToday();

  let query = supabase
    .from('jobs')
    .select(`
      *,
      customer:customers(*),
      service_branch:branches!jobs_service_branch_id_fkey(*),
      assigned_technician:profiles!jobs_assigned_technician_id_fkey(*),
      products:job_products(id, brand, model)
    `)
    .eq('estimate_delivery_date', today)
    .not('status', 'in', '("completed","cancelled")');

  if (branchId) {
    query = query.or(`service_branch_id.eq.${branchId},delivery_branch_id.eq.${branchId}`);
  }

  const { data, error } = await query.order('priority');

  if (error) throw error;

  return (data as unknown as JobWithRelations[]) || [];
}

import { SupabaseClient } from '@supabase/supabase-js';
import { normalizeJobProductWarrantyForDb } from '@/lib/utils/normalizeJobProduct';
import { 
  Job, 
  JobWithRelations, 
  JobCreateInput, 
  JobUpdateInput, 
  JobFilters,
  JobStatusHistory 
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
        const maxIn = 200;
        orParts.push(`customer_id.in.(${ids.slice(0, maxIn).join(',')})`);
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
        accessories:product_accessories(id, job_product_id, name),
        other_parts:product_other_parts(id, job_product_id, name)
      ),
      spare_parts(id, job_id, name, quantity, unit_price, total_price),
      status_history:job_status_history(
        id,
        job_id,
        from_status,
        to_status,
        changed_by,
        notes,
        created_at,
        changed_by_user:profiles!job_status_history_changed_by_fkey(id, full_name)
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
  // Get next job number
  const { data: jobNumberData, error: jobNumberError } = await supabase
    .rpc('get_next_job_number');

  if (jobNumberError) throw jobNumberError;

  const jobNumber = jobNumberData as string;

  // Create the job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      shop_id: shopId,
      job_number: jobNumber,
      customer_id: input.customer_id,
      service_branch_id: input.service_branch_id,
      delivery_branch_id: input.delivery_branch_id,
      assigned_incharge_id: input.assigned_incharge_id,
      assigned_technician_id: input.assigned_technician_id,
      priority: input.priority,
      description: input.description,
      inspection_fee: input.inspection_fee ?? 0,
      advance_paid: input.advance_paid ?? 0,
      advance_paid_date:
        input.advance_paid && input.advance_paid > 0
          ? input.advance_paid_date?.trim() || null
          : null,
      estimate_delivery_date: input.estimate_delivery_date?.trim() || null,
      created_by: createdBy,
      status: 'new',
    })
    .select()
    .single();

  if (jobError) throw jobError;

  // Create job products
  for (const product of input.products) {
    const w = normalizeJobProductWarrantyForDb(product);
    const { data: jobProduct, error: productError } = await supabase
      .from('job_products')
      .insert({
        job_id: job.id,
        brand: product.brand,
        model: product.model,
        serial_number: product.serial_number,
        condition: product.condition,
        description: product.description,
        remarks: product.remarks,
        has_warranty: w.has_warranty,
        warranty_description: w.warranty_description,
        warranty_expiry_date: w.warranty_expiry_date,
      })
      .select()
      .single();

    if (productError) throw productError;

    // Create accessories
    if (product.accessories && product.accessories.length > 0) {
      const accessories = product.accessories.map(name => ({
        job_product_id: jobProduct.id,
        name,
      }));
      const { error: accError } = await supabase
        .from('product_accessories')
        .insert(accessories);
      if (accError) throw accError;
    }

    // Create other parts
    if (product.other_parts && product.other_parts.length > 0) {
      const otherParts = product.other_parts.map(name => ({
        job_product_id: jobProduct.id,
        name,
      }));
      const { error: partsError } = await supabase
        .from('product_other_parts')
        .insert(otherParts);
      if (partsError) throw partsError;
    }
  }

  // Create initial status history
  await supabase
    .from('job_status_history')
    .insert({
      job_id: job.id,
      from_status: null,
      to_status: 'new',
      changed_by: createdBy,
      notes: 'Job created',
    });

  return job as Job;
}

export async function updateJob(
  supabase: TypedSupabaseClient,
  id: string,
  input: JobUpdateInput,
  userId: string
): Promise<Job> {
  // Get current job to check status change
  const { data: currentJob } = await supabase
    .from('jobs')
    .select('status')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('jobs')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log status change if status was updated
  if (input.status && currentJob && input.status !== currentJob.status) {
    await supabase
      .from('job_status_history')
      .insert({
        job_id: id,
        from_status: currentJob.status,
        to_status: input.status,
        changed_by: userId,
      });
  }

  return data as Job;
}

export async function updateJobStatus(
  supabase: TypedSupabaseClient,
  id: string,
  status: JobStatus,
  userId: string,
  notes?: string
): Promise<Job> {
  const { data: currentJob } = await supabase
    .from('jobs')
    .select('status')
    .eq('id', id)
    .single();

  const updateData: Partial<Job> = { status };
  
  // Set service_date when status becomes completed
  if (status === 'completed') {
    updateData.service_date = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('jobs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Log status change
  if (currentJob) {
    await supabase
      .from('job_status_history')
      .insert({
        job_id: id,
        from_status: currentJob.status,
        to_status: status,
        changed_by: userId,
        notes,
      });
  }

  return data as Job;
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
  const today = new Date().toISOString().split('T')[0];

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

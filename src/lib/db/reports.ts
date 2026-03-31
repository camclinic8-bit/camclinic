import { SupabaseClient } from '@supabase/supabase-js';
import { JobStatus } from '@/types/enums';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypedSupabaseClient = SupabaseClient<any>;

export interface ReportFilters {
  branch_id?: string;
  technician_id?: string;
  status?: JobStatus | JobStatus[];
  date_from?: string;
  date_to?: string;
}

export interface JobReport {
  id: string;
  job_number: string;
  customer_name: string;
  customer_phone: string;
  status: JobStatus;
  priority: string;
  service_branch: string;
  delivery_branch: string;
  technician_name: string | null;
  grand_total: number;
  balance_amount: number;
  created_at: string;
  completed_at: string | null;
}

export interface DashboardStats {
  total_jobs: number;
  jobs_today: number;
  pending_jobs: number;
  completed_jobs: number;
  total_revenue: number;
  pending_balance: number;
}

export async function getJobsReport(
  supabase: TypedSupabaseClient,
  filters?: ReportFilters
): Promise<JobReport[]> {
  let query = supabase
    .from('jobs')
    .select(`
      id,
      job_number,
      status,
      priority,
      grand_total,
      balance_amount,
      created_at,
      service_date,
      customer:customers(name, phone),
      service_branch:branches!jobs_service_branch_id_fkey(name),
      delivery_branch:branches!jobs_delivery_branch_id_fkey(name),
      assigned_technician:profiles!jobs_assigned_technician_id_fkey(full_name)
    `);

  if (filters?.branch_id) {
    query = query.or(`service_branch_id.eq.${filters.branch_id},delivery_branch_id.eq.${filters.branch_id}`);
  }

  if (filters?.technician_id) {
    query = query.eq('assigned_technician_id', filters.technician_id);
  }

  if (filters?.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters?.date_from) {
    query = query.gte('created_at', filters.date_from);
  }

  if (filters?.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((job: Record<string, unknown>) => ({
    id: job.id as string,
    job_number: job.job_number as string,
    customer_name: (job.customer as Record<string, unknown>)?.name as string || '-',
    customer_phone: (job.customer as Record<string, unknown>)?.phone as string || '-',
    status: job.status as JobStatus,
    priority: job.priority as string,
    service_branch: (job.service_branch as Record<string, unknown>)?.name as string || '-',
    delivery_branch: (job.delivery_branch as Record<string, unknown>)?.name as string || '-',
    technician_name: (job.assigned_technician as Record<string, unknown>)?.full_name as string || null,
    grand_total: job.grand_total as number,
    balance_amount: job.balance_amount as number,
    created_at: job.created_at as string,
    completed_at: job.service_date as string | null,
  }));
}

export async function getDashboardStats(
  supabase: TypedSupabaseClient,
  branchId?: string
): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0];

  // Run all queries in parallel for faster loading
  const queries = [];

  // Total jobs query
  let totalQuery = supabase.from('jobs').select('*', { count: 'exact', head: true });
  if (branchId) totalQuery = totalQuery.or(`service_branch_id.eq.${branchId},delivery_branch_id.eq.${branchId}`);
  queries.push(totalQuery);

  // Jobs today query
  let todayQuery = supabase.from('jobs').select('*', { count: 'exact', head: true })
    .gte('created_at', `${today}T00:00:00`).lte('created_at', `${today}T23:59:59`);
  if (branchId) todayQuery = todayQuery.or(`service_branch_id.eq.${branchId},delivery_branch_id.eq.${branchId}`);
  queries.push(todayQuery);

  // Pending jobs query
  let pendingQuery = supabase.from('jobs').select('*', { count: 'exact', head: true })
    .not('status', 'in', '("completed","cancelled")');
  if (branchId) pendingQuery = pendingQuery.or(`service_branch_id.eq.${branchId},delivery_branch_id.eq.${branchId}`);
  queries.push(pendingQuery);

  // Completed jobs query
  let completedQuery = supabase.from('jobs').select('*', { count: 'exact', head: true })
    .eq('status', 'completed');
  if (branchId) completedQuery = completedQuery.or(`service_branch_id.eq.${branchId},delivery_branch_id.eq.${branchId}`);
  queries.push(completedQuery);

  // Revenue query
  let revenueQuery = supabase.from('jobs').select('grand_total, balance_amount')
    .eq('status', 'completed');
  if (branchId) revenueQuery = revenueQuery.or(`service_branch_id.eq.${branchId},delivery_branch_id.eq.${branchId}`);
  queries.push(revenueQuery);

  const [totalResult, todayResult, pendingResult, completedResult, revenueResult] = await Promise.all(queries);

  const revenueData = (revenueResult.data || []) as Array<{ grand_total: number; balance_amount: number }>;
  const totalRevenue = revenueData.reduce((sum: number, job) => sum + (job.grand_total || 0), 0);
  const pendingBalance = revenueData.reduce((sum: number, job) => sum + (job.balance_amount || 0), 0);

  return {
    total_jobs: totalResult.count || 0,
    jobs_today: todayResult.count || 0,
    pending_jobs: pendingResult.count || 0,
    completed_jobs: completedResult.count || 0,
    total_revenue: totalRevenue,
    pending_balance: pendingBalance,
  };
}

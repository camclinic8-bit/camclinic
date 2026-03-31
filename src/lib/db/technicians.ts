import { SupabaseClient } from '@supabase/supabase-js';
import { Profile } from '@/types/user';
import { Technician } from '@/types/technician';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypedSupabaseClient = SupabaseClient<any>;

export async function getTechnicians(
  supabase: TypedSupabaseClient,
  branchId?: string
): Promise<Profile[]> {
  let query = supabase
    .from('profiles')
    .select('*')
    .in('role', ['technician', 'service_incharge'])
    .eq('is_active', true);

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  const { data, error } = await query.order('full_name');

  if (error) throw error;

  return (data as Profile[]) || [];
}

export async function getServiceIncharges(
  supabase: TypedSupabaseClient,
  branchId?: string
): Promise<Profile[]> {
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('role', 'service_incharge')
    .eq('is_active', true);

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  const { data, error } = await query.order('full_name');

  if (error) throw error;

  return (data as Profile[]) || [];
}

export async function getTechnicianById(
  supabase: TypedSupabaseClient,
  id: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as Profile;
}

export async function getTechnicianWithJobCounts(
  supabase: TypedSupabaseClient,
  id: string
): Promise<Technician | null> {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (profileError) {
    if (profileError.code === 'PGRST116') return null;
    throw profileError;
  }

  const { count: assignedCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_technician_id', id)
    .not('status', 'in', '("completed","cancelled")');

  const { count: completedCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_technician_id', id)
    .eq('status', 'completed');

  return {
    ...(profile as Profile),
    assigned_jobs_count: assignedCount || 0,
    completed_jobs_count: completedCount || 0,
  };
}

export async function getAllUsers(
  supabase: TypedSupabaseClient
): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name');

  if (error) throw error;

  return (data as Profile[]) || [];
}

export async function updateUserRole(
  supabase: TypedSupabaseClient,
  userId: string,
  role: Profile['role'],
  branchId?: string | null
): Promise<Profile> {
  const updateData: Record<string, unknown> = { role };
  if (branchId !== undefined) {
    updateData.branch_id = branchId;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;

  return data as Profile;
}

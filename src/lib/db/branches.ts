import { SupabaseClient } from '@supabase/supabase-js';
import { Branch } from '@/types/branch';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypedSupabaseClient = SupabaseClient<any>;

export async function getBranches(
  supabase: TypedSupabaseClient
): Promise<Branch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;

  return (data as Branch[]) || [];
}

export async function getAllBranches(
  supabase: TypedSupabaseClient
): Promise<Branch[]> {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .order('name');

  if (error) throw error;

  return (data as Branch[]) || [];
}

export async function getBranchById(
  supabase: TypedSupabaseClient,
  id: string
): Promise<Branch | null> {
  const { data, error } = await supabase
    .from('branches')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as Branch;
}

export async function createBranch(
  supabase: TypedSupabaseClient,
  input: {
    name: string;
    address?: string | null;
    phone?: string | null;
  },
  shopId: string
): Promise<Branch> {
  const { data, error } = await supabase
    .from('branches')
    .insert({
      shop_id: shopId,
      name: input.name,
      address: input.address,
      phone: input.phone,
    })
    .select()
    .single();

  if (error) throw error;

  return data as Branch;
}

export async function updateBranch(
  supabase: TypedSupabaseClient,
  id: string,
  input: {
    name?: string;
    address?: string | null;
    phone?: string | null;
    is_active?: boolean;
  }
): Promise<Branch> {
  const { data, error } = await supabase
    .from('branches')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data as Branch;
}

export async function deleteBranch(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('branches')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

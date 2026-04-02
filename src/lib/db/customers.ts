import { SupabaseClient } from '@supabase/supabase-js';
import { Customer, CustomerWithJobCount } from '@/types/customer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypedSupabaseClient = SupabaseClient<any>;

/** Trim and require non-empty phone (DB column is NOT NULL). */
function normalizeRequiredPhone(phone: string): string {
  const t = phone.trim();
  if (!t) {
    throw new Error('Phone number is required');
  }
  return t;
}

export async function getCustomers(
  supabase: TypedSupabaseClient,
  search?: string,
  page = 1,
  pageSize = 20
): Promise<{ data: Customer[]; count: number }> {
  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return { data: (data as Customer[]) || [], count: count || 0 };
}

export async function getCustomerById(
  supabase: TypedSupabaseClient,
  id: string
): Promise<Customer | null> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as Customer;
}

export async function searchCustomers(
  supabase: TypedSupabaseClient,
  query: string,
  limit = 10
): Promise<Customer[]> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(limit);

  if (error) throw error;

  return (data as Customer[]) || [];
}

export async function createCustomer(
  supabase: TypedSupabaseClient,
  input: {
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
  },
  shopId: string
): Promise<Customer> {
  const phone = normalizeRequiredPhone(input.phone);
  const name = input.name.trim();
  if (!name) {
    throw new Error('Customer name is required');
  }
  const { data, error } = await supabase
    .from('customers')
    .insert({
      shop_id: shopId,
      name,
      phone,
      email: input.email,
      address: input.address,
    })
    .select()
    .single();

  if (error) throw error;

  return data as Customer;
}

export async function updateCustomer(
  supabase: TypedSupabaseClient,
  id: string,
  input: {
    name?: string;
    phone?: string;
    email?: string | null;
    address?: string | null;
  }
): Promise<Customer> {
  const payload = { ...input };
  if (payload.phone !== undefined) {
    payload.phone = normalizeRequiredPhone(payload.phone);
  }
  if (payload.name !== undefined) {
    payload.name = payload.name.trim();
    if (!payload.name) {
      throw new Error('Customer name is required');
    }
  }
  const { data, error } = await supabase
    .from('customers')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data as Customer;
}

export async function getCustomerWithJobCount(
  supabase: TypedSupabaseClient,
  id: string
): Promise<CustomerWithJobCount | null> {
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single();

  if (customerError) {
    if (customerError.code === 'PGRST116') return null;
    throw customerError;
  }

  const { count, error: countError } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', id);

  if (countError) throw countError;

  return {
    ...(customer as Customer),
    job_count: count || 0,
  };
}

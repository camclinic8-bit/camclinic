/**
 * Customers API - Centralized Customer Operations
 */

import { getClient } from '@/lib/supabase/singleton';
import { handleSupabaseError, NotFoundError } from '@/lib/errors';
import type { Customer, CustomerWithJobCount } from '@/types/customer';

/**
 * Get paginated list of customers with optional search
 */
export async function getCustomers(
  search?: string,
  page = 1,
  pageSize = 20
): Promise<{ data: Customer[]; count: number }> {
  try {
    const supabase = getClient();
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' });

    if (search) {
      const term = search.trim().replace(/,/g, ' ').replace(/%/g, '');
      if (term.length > 0) {
        query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`);
      }
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw handleSupabaseError(error);

    return { data: (data as Customer[]) || [], count: count || 0 };
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Get a single customer by ID
 */
export async function getCustomerById(id: string): Promise<Customer> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Customer with ID ${id} not found`);
      }
      throw handleSupabaseError(error);
    }

    return data as Customer;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Search customers (for autocomplete/dropdowns)
 */
export async function searchCustomers(query: string, limit = 10): Promise<Customer[]> {
  try {
    const supabase = getClient();
    const term = query.trim().replace(/,/g, ' ').replace(/%/g, '');
    
    if (term.length === 0) return [];

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${term}%,phone.ilike.%${term}%`)
      .limit(limit);

    if (error) throw handleSupabaseError(error);

    return (data as Customer[]) || [];
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Create a new customer
 */
export async function createCustomer(
  input: {
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
  },
  shopId: string
): Promise<Customer> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('customers')
      .insert({
        shop_id: shopId,
        name: input.name,
        phone: input.phone,
        email: input.email,
        address: input.address,
      } as any)
      .select()
      .single();

    if (error) throw handleSupabaseError(error);

    return data as Customer;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Update a customer
 */
export async function updateCustomer(
  id: string,
  input: {
    name?: string;
    phone?: string;
    email?: string | null;
    address?: string | null;
  }
): Promise<Customer> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('customers')
      .update(input as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw handleSupabaseError(error);

    return data as Customer;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Get customer with job count
 */
export async function getCustomerWithJobCount(id: string): Promise<CustomerWithJobCount> {
  try {
    const supabase = getClient();
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (customerError) {
      if (customerError.code === 'PGRST116') {
        throw new NotFoundError(`Customer with ID ${id} not found`);
      }
      throw handleSupabaseError(customerError);
    }

    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', id);

    if (countError) throw handleSupabaseError(countError);

    return {
      ...(customer as Customer),
      job_count: count || 0,
    };
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Products API - Centralized Product Operations
 */

import { getClient } from '@/lib/supabase/singleton';
import { handleSupabaseError, NotFoundError } from '@/lib/errors';
import type { JobProduct } from '@/types/job';

/**
 * Get products for a job
 */
export async function getJobProducts(jobId: string): Promise<JobProduct[]> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('job_products')
      .select(`
        *,
        accessories:product_accessories(*),
        other_parts:product_other_parts(*)
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw handleSupabaseError(error);

    return (data as JobProduct[]) || [];
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<JobProduct> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('job_products')
      .select(`
        *,
        accessories:product_accessories(*),
        other_parts:product_other_parts(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Product with ID ${id} not found`);
      }
      throw handleSupabaseError(error);
    }

    return data as JobProduct;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Update a product
 */
export async function updateProduct(
  id: string,
  input: {
    brand?: string | null;
    model?: string | null;
    serial_number?: string | null;
    condition?: string | null;
    description?: string | null;
    remarks?: string | null;
    has_warranty?: boolean;
    warranty_description?: string | null;
    warranty_expiry_date?: string | null;
  }
): Promise<JobProduct> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('job_products')
      .update(input as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw handleSupabaseError(error);

    return data as unknown as JobProduct;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Create a product
 */
export async function createProduct(
  input: {
    job_id: string;
    brand?: string | null;
    model?: string | null;
    serial_number?: string | null;
    condition?: string | null;
    description?: string | null;
    remarks?: string | null;
    has_warranty?: boolean;
    warranty_description?: string | null;
    warranty_expiry_date?: string | null;
  }
): Promise<JobProduct> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('job_products')
      .insert(input as any)
      .select()
      .single();

    if (error) throw handleSupabaseError(error);

    return data as unknown as JobProduct;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from('job_products')
      .delete()
      .eq('id', id);

    if (error) throw handleSupabaseError(error);
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Sync all products for a job (transaction-safe via RPC)
 */
export async function syncJobProducts(
  jobId: string,
  products: Array<{
    id?: string;
    brand?: string | null;
    model?: string | null;
    serial_number?: string | null;
    condition?: string | null;
    description?: string | null;
    remarks?: string | null;
    has_warranty?: boolean;
    warranty_description?: string | null;
    warranty_expiry_date?: string | null;
    accessories?: string[];
    other_parts?: string[];
  }>
): Promise<void> {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .rpc('sync_job_products', {
        p_job_id: jobId,
        p_products: products,
      } as any);

    if (error) throw handleSupabaseError(error);
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Add accessories to a product
 */
export async function addAccessoriesBulk(
  productId: string,
  accessories: string[]
): Promise<void> {
  try {
    const supabase = getClient();
    if (accessories.length === 0) return;

    const { error } = await supabase
      .from('product_accessories')
      .insert(
        accessories.map(name => ({
          job_product_id: productId,
          name,
        })) as any
      );

    if (error) throw handleSupabaseError(error);
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Add other parts to a product
 */
export async function addOtherPartsBulk(
  productId: string,
  otherParts: string[]
): Promise<void> {
  try {
    const supabase = getClient();
    if (otherParts.length === 0) return;

    const { error } = await supabase
      .from('product_other_parts')
      .insert(
        otherParts.map(name => ({
          job_product_id: productId,
          name,
        })) as any
      );

    if (error) throw handleSupabaseError(error);
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Clear all accessories for a product
 */
export async function clearAccessoriesByProductId(productId: string): Promise<void> {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from('product_accessories')
      .delete()
      .eq('job_product_id', productId);

    if (error) throw handleSupabaseError(error);
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Clear all other parts for a product
 */
export async function clearOtherPartsByProductId(productId: string): Promise<void> {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from('product_other_parts')
      .delete()
      .eq('job_product_id', productId);

    if (error) throw handleSupabaseError(error);
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

import { SupabaseClient } from '@supabase/supabase-js';
import { JobProduct, ProductAccessory, ProductOtherPart } from '@/types/job';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypedSupabaseClient = SupabaseClient<any>;

export async function getJobProducts(
  supabase: TypedSupabaseClient,
  jobId: string
): Promise<JobProduct[]> {
  const { data, error } = await supabase
    .from('job_products')
    .select(`
      *,
      accessories:product_accessories(*),
      other_parts:product_other_parts(*)
    `)
    .eq('job_id', jobId)
    .order('created_at');

  if (error) throw error;

  return (data as unknown as JobProduct[]) || [];
}

export async function getProductById(
  supabase: TypedSupabaseClient,
  id: string
): Promise<JobProduct | null> {
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
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as unknown as JobProduct;
}

export async function updateProduct(
  supabase: TypedSupabaseClient,
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
  const { data, error } = await supabase
    .from('job_products')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data as unknown as JobProduct;
}

export async function addAccessory(
  supabase: TypedSupabaseClient,
  productId: string,
  name: string
): Promise<ProductAccessory> {
  const { data, error } = await supabase
    .from('product_accessories')
    .insert({
      job_product_id: productId,
      name,
    })
    .select()
    .single();

  if (error) throw error;

  return data as ProductAccessory;
}

export async function removeAccessory(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('product_accessories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function addOtherPart(
  supabase: TypedSupabaseClient,
  productId: string,
  name: string
): Promise<ProductOtherPart> {
  const { data, error } = await supabase
    .from('product_other_parts')
    .insert({
      job_product_id: productId,
      name,
    })
    .select()
    .single();

  if (error) throw error;

  return data as ProductOtherPart;
}

export async function removeOtherPart(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('product_other_parts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

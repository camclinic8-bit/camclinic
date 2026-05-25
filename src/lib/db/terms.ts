import { SupabaseClient } from '@supabase/supabase-js';
import { TermsAndConditions } from '@/types/job';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypedSupabaseClient = SupabaseClient<any>;

export async function getActiveTermsAndConditions(
  supabase: TypedSupabaseClient,
  shopId: string
): Promise<TermsAndConditions | null> {
  const { data, error } = await supabase
    .from('terms_and_conditions')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .single();

  if (error) throw error;
  return data as TermsAndConditions;
}

export async function getAllTermsAndConditions(
  supabase: TypedSupabaseClient,
  shopId: string
): Promise<TermsAndConditions[]> {
  const { data, error } = await supabase
    .from('terms_and_conditions')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as TermsAndConditions[];
}

export async function createTermsAndConditions(
  supabase: TypedSupabaseClient,
  input: {
    shop_id: string;
    title: string;
    content: string;
    is_active?: boolean;
    created_by: string;
  }
): Promise<TermsAndConditions> {
  console.log('Creating terms and conditions with input:', input);
  
  // First check if the shop exists
  const { data: shop, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('id', input.shop_id)
    .single();
  
  if (shopError || !shop) {
    console.error('Shop not found:', input.shop_id, shopError);
    throw new Error(`Shop with ID ${input.shop_id} not found`);
  }
  
  const { data, error } = await supabase
    .from('terms_and_conditions')
    .insert({
      shop_id: input.shop_id,
      title: input.title,
      content: input.content,
      is_active: input.is_active ?? true,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating terms and conditions:', error);
    throw error;
  }
  return data as TermsAndConditions;
}

export async function updateTermsAndConditions(
  supabase: TypedSupabaseClient,
  id: string,
  input: {
    title?: string;
    content?: string;
    is_active?: boolean;
  }
): Promise<TermsAndConditions> {
  const { data, error } = await supabase
    .from('terms_and_conditions')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as TermsAndConditions;
}

export async function deleteTermsAndConditions(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from('terms_and_conditions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

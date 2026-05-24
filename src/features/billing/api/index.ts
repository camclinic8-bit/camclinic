/**
 * Billing API - Centralized Billing/Spare Parts Operations
 */

import { getClient } from '@/lib/supabase/singleton';
import { handleSupabaseError, NotFoundError } from '@/lib/errors';
import type { SparePart } from '@/types/billing';

/**
 * Get spare parts for a job
 */
export async function getSpareParts(jobId: string): Promise<SparePart[]> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('spare_parts')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw handleSupabaseError(error);

    return (data as SparePart[]) || [];
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Add a spare part (transaction-safe via RPC)
 */
export async function addSparePart(
  jobId: string,
  input: {
    name: string;
    quantity: number;
    unit_price: number;
  }
): Promise<SparePart> {
  try {
    const supabase = getClient();
    
    const { data, error } = await supabase
      .rpc('add_spare_part_with_job_update', {
        p_job_id: jobId,
        p_name: input.name,
        p_quantity: input.quantity,
        p_unit_price: input.unit_price,
      } as any);

    if (error) throw handleSupabaseError(error);

    // Fetch the complete spare part
    const { data: sparePart, error: fetchError } = await supabase
      .from('spare_parts')
      .select('*')
      .eq('id', (data as { id: string }).id)
      .single();

    if (fetchError) throw handleSupabaseError(fetchError);

    return sparePart as SparePart;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Update a spare part (transaction-safe via RPC)
 */
export async function updateSparePart(
  id: string,
  input: {
    name?: string;
    quantity?: number;
    unit_price?: number;
  }
): Promise<SparePart> {
  try {
    const supabase = getClient();
    
    const { data, error } = await supabase
      .rpc('update_spare_part_with_job_update', {
        p_spare_part_id: id,
        p_name: input.name,
        p_quantity: input.quantity,
        p_unit_price: input.unit_price,
      } as any);

    if (error) throw handleSupabaseError(error);

    // Fetch the complete spare part
    const { data: sparePart, error: fetchError } = await supabase
      .from('spare_parts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw handleSupabaseError(fetchError);

    return sparePart as SparePart;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Delete a spare part (transaction-safe via RPC)
 */
export async function deleteSparePart(id: string): Promise<void> {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .rpc('delete_spare_part_with_job_update', {
        p_spare_part_id: id,
      } as any);

    if (error) throw handleSupabaseError(error);
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

/**
 * Update job charges
 */
export async function updateJobCharges(
  jobId: string,
  charges: {
    inspection_fee?: number;
    service_charges?: number;
    gst_enabled?: boolean;
    advance_paid?: number;
    advance_paid_date?: string;
  }
): Promise<void> {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from('jobs')
      .update(charges as any)
      .eq('id', jobId);

    if (error) throw handleSupabaseError(error);
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

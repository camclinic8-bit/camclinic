import { SupabaseClient } from '@supabase/supabase-js';
import { SparePart, SparePartInput } from '@/types/billing';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TypedSupabaseClient = SupabaseClient<any>;

export async function getSpareParts(
  supabase: TypedSupabaseClient,
  jobId: string
): Promise<SparePart[]> {
  const { data, error } = await supabase
    .from('spare_parts')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at');

  if (error) throw error;

  return (data as SparePart[]) || [];
}

export async function addSparePart(
  supabase: TypedSupabaseClient,
  jobId: string,
  input: SparePartInput
): Promise<SparePart> {
  // Use transaction-safe RPC function
  const { data, error } = await supabase
    .rpc('add_spare_part_with_job_update', {
      p_job_id: jobId,
      p_name: input.name,
      p_quantity: input.quantity,
      p_unit_price: input.unit_price,
      p_hsn_code: input.hsn_code?.trim() || null,
    });

  if (error) throw error;

  // Fetch the complete spare part
  const { data: sparePart, error: fetchError } = await supabase
    .from('spare_parts')
    .select('*')
    .eq('id', (data as { id: string }).id)
    .single();

  if (fetchError) throw fetchError;

  return sparePart as SparePart;
}

export async function updateSparePart(
  supabase: TypedSupabaseClient,
  id: string,
  input: Partial<SparePartInput>
): Promise<SparePart> {
  // Use transaction-safe RPC function
  const { data, error } = await supabase
    .rpc('update_spare_part_with_job_update', {
      p_spare_part_id: id,
      p_name: input.name,
      p_quantity: input.quantity,
      p_unit_price: input.unit_price,
      p_hsn_code: input.hsn_code?.trim() || null,
    });

  if (error) throw error;

  // Fetch the complete spare part
  const { data: sparePart, error: fetchError } = await supabase
    .from('spare_parts')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  return sparePart as SparePart;
}

export async function deleteSparePart(
  supabase: TypedSupabaseClient,
  id: string,
  jobId: string
): Promise<void> {
  // Use transaction-safe RPC function
  const { error } = await supabase
    .rpc('delete_spare_part_with_job_update', {
      p_spare_part_id: id,
    });

  if (error) throw error;
}

export async function updateJobCharges(
  supabase: TypedSupabaseClient,
  jobId: string,
  charges: {
    inspection_fee?: number;
    service_charges?: number;
    gst_enabled?: boolean;
    advance_paid?: number;
    advance_paid_date?: string | null;
  }
): Promise<void> {
  if (charges.advance_paid !== undefined) {
    const { data: row, error: fetchError } = await supabase
      .from('jobs')
      .select('grand_total')
      .eq('id', jobId)
      .single();
    if (fetchError) throw fetchError;
    const grandTotal = Number(row?.grand_total ?? 0);
    const advance = Number(charges.advance_paid);
    if (advance > grandTotal + 0.005) {
      throw new Error('Total amount collected cannot exceed the grand total for this job.');
    }
  }

  const { error } = await supabase
    .from('jobs')
    .update(charges)
    .eq('id', jobId);

  if (error) throw error;
}

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
  const { data, error } = await supabase
    .from('spare_parts')
    .insert({
      job_id: jobId,
      name: input.name,
      quantity: input.quantity,
      unit_price: input.unit_price,
    })
    .select()
    .single();

  if (error) throw error;

  // Trigger job totals recalculation by updating the job
  await supabase
    .from('jobs')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', jobId);

  return data as SparePart;
}

export async function updateSparePart(
  supabase: TypedSupabaseClient,
  id: string,
  input: Partial<SparePartInput>
): Promise<SparePart> {
  const { data, error } = await supabase
    .from('spare_parts')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Get job_id to trigger recalculation
  const sparePart = data as SparePart;
  await supabase
    .from('jobs')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', sparePart.job_id);

  return sparePart;
}

export async function deleteSparePart(
  supabase: TypedSupabaseClient,
  id: string,
  jobId: string
): Promise<void> {
  const { error } = await supabase
    .from('spare_parts')
    .delete()
    .eq('id', id);

  if (error) throw error;

  // Trigger job totals recalculation
  await supabase
    .from('jobs')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', jobId);
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

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  getSpareParts,
  addSparePart,
  updateSparePart,
  deleteSparePart,
  updateJobCharges,
} from '@/lib/db/billing';
import { SparePartInput } from '@/types/billing';
import { toast } from 'sonner';

export function useSpareParts(jobId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['spareParts', jobId],
    queryFn: () => getSpareParts(supabase, jobId),
    staleTime: 30 * 1000,
    enabled: !!jobId,
  });
}

export function useAddSparePart(jobId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: (input: SparePartInput) => addSparePart(supabase, jobId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spareParts', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast.success('Part added');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add part');
    },
  });
}

export function useUpdateSparePart(jobId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SparePartInput> }) =>
      updateSparePart(supabase, id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spareParts', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update part');
    },
  });
}

export function useDeleteSparePart(jobId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: (id: string) => deleteSparePart(supabase, id, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spareParts', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast.success('Part removed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove part');
    },
  });
}

export function useUpdateJobCharges(jobId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: (charges: Parameters<typeof updateJobCharges>[2]) =>
      updateJobCharges(supabase, jobId, charges),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Payment recorded');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record payment');
    },
  });
}

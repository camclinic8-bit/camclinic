'use client';

import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  getSpareParts,
  addSparePart,
  updateSparePart,
  deleteSparePart,
  updateJobCharges,
} from '@/lib/db/billing';
import { queryKeys } from '@/lib/queryKeys';
import type { SparePart, SparePartInput } from '@/types/billing';
import type { JobWithRelations } from '@/types/job';
import { toast } from 'sonner';
import { isAppError } from '@/lib/errors';

function syncJobSparePartsInCache(queryClient: QueryClient, jobId: string, spareParts: SparePart[]) {
  queryClient.setQueryData<JobWithRelations>(queryKeys.jobs.detail(jobId), (old) =>
    old ? { ...old, spare_parts: spareParts } : old
  );
}

export function useSpareParts(jobId: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.billing.spareParts(jobId),
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
    onSuccess: (newPart) => {
      queryClient.setQueryData<SparePart[]>(queryKeys.billing.spareParts(jobId), (old) => {
        const next = old ? [...old, newPart] : [newPart];
        return next.sort((a, b) => a.created_at.localeCompare(b.created_at));
      });
      const list = queryClient.getQueryData<SparePart[]>(queryKeys.billing.spareParts(jobId));
      if (list) syncJobSparePartsInCache(queryClient, jobId, list);
      toast.success('Part added');
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to add part';
      toast.error(message);
    },
  });
}

export function useUpdateSparePart(jobId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SparePartInput> }) =>
      updateSparePart(supabase, id, input),
    onSuccess: (updated) => {
      queryClient.setQueryData<SparePart[]>(queryKeys.billing.spareParts(jobId), (old) =>
        old ? old.map((p) => (p.id === updated.id ? updated : p)) : [updated]
      );
      const list = queryClient.getQueryData<SparePart[]>(queryKeys.billing.spareParts(jobId));
      if (list) syncJobSparePartsInCache(queryClient, jobId, list);
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to update part';
      toast.error(message);
    },
  });
}

export function useDeleteSparePart(jobId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: (id: string) => deleteSparePart(supabase, id, jobId),
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData<SparePart[]>(queryKeys.billing.spareParts(jobId), (old) =>
        old ? old.filter((p) => p.id !== deletedId) : []
      );
      const list = queryClient.getQueryData<SparePart[]>(queryKeys.billing.spareParts(jobId));
      if (list) syncJobSparePartsInCache(queryClient, jobId, list);
      toast.success('Part removed');
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to remove part';
      toast.error(message);
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
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      toast.success('Payment recorded');
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to record payment';
      toast.error(message);
    },
  });
}

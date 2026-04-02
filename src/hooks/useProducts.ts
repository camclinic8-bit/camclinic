'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  updateProduct,
  addAccessory,
  removeAccessory,
  addOtherPart,
  removeOtherPart,
} from '@/lib/db/products';
import { toast } from 'sonner';

export function useUpdateProduct(jobId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof updateProduct>[2];
    }) => updateProduct(supabase, id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update product');
    },
  });
}

export function useAddAccessory(jobId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: ({ productId, name }: { productId: string; name: string }) =>
      addAccessory(supabase, productId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add accessory');
    },
  });
}

export function useRemoveAccessory(jobId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: (id: string) => removeAccessory(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove accessory');
    },
  });
}

export function useAddOtherPart(jobId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: ({ productId, name }: { productId: string; name: string }) =>
      addOtherPart(supabase, productId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add part');
    },
  });
}

export function useRemoveOtherPart(jobId: string) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: (id: string) => removeOtherPart(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove part');
    },
  });
}

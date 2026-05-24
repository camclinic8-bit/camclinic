'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateProduct,
  addAccessoriesBulk,
  addOtherPartsBulk,
  clearAccessoriesByProductId,
  clearOtherPartsByProductId,
} from '@/features/products/api';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';
import { isAppError } from '@/lib/errors';

export function useUpdateProduct(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Parameters<typeof updateProduct>[1];
    }) => updateProduct(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to update product';
      toast.error(message);
    },
  });
}

export function useAddAccessory(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, name }: { productId: string; name: string }) =>
      addAccessoriesBulk(productId, [name]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to add accessory';
      toast.error(message);
    },
  });
}

export function useRemoveAccessory(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clearAccessoriesByProductId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to remove accessory';
      toast.error(message);
    },
  });
}

export function useAddOtherPart(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, name }: { productId: string; name: string }) =>
      addOtherPartsBulk(productId, [name]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to add part';
      toast.error(message);
    },
  });
}

export function useRemoveOtherPart(jobId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clearOtherPartsByProductId(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(jobId) });
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to remove part';
      toast.error(message);
    },
  });
}

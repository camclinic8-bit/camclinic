'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAccessories,
  getAccessoryById,
  createAccessory,
  updateAccessory,
  deleteAccessory,
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  getModels,
  getModelById,
  createModel,
  updateModel,
  deleteModel,
} from '@/features/inventory/api';
import { queryKeys } from '@/lib/queryKeys';
import type { AccessoryInput, BrandInput, ModelInput } from '@/types/inventory';
import { toast } from 'sonner';
import { isAppError } from '@/lib/errors';

// ─── Accessories ─────────────────────────────────────────────────────────────

export function useAccessories() {
  return useQuery({
    queryKey: queryKeys.inventory.accessories(),
    queryFn: () => getAccessories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAccessory(id: string) {
  return useQuery({
    queryKey: queryKeys.inventory.accessory(id),
    queryFn: () => getAccessoryById(id),
    enabled: !!id,
  });
}

export function useCreateAccessory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AccessoryInput) => createAccessory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.accessories() });
      toast.success('Accessory created successfully');
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to create accessory';
      toast.error(message);
    },
  });
}

export function useUpdateAccessory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AccessoryInput> }) =>
      updateAccessory(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.accessories() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.accessory(variables.id) });
      toast.success('Accessory updated successfully');
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to update accessory';
      toast.error(message);
    },
  });
}

export function useDeleteAccessory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAccessory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.accessories() });
      toast.success('Accessory deleted');
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to delete accessory';
      toast.error(message);
    },
  });
}

// ─── Brands ─────────────────────────────────────────────────────────────────

export function useBrands() {
  return useQuery({
    queryKey: queryKeys.inventory.brands(),
    queryFn: () => getBrands(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBrand(id: string) {
  return useQuery({
    queryKey: queryKeys.inventory.brand(id),
    queryFn: () => getBrandById(id),
    enabled: !!id,
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BrandInput) => createBrand(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.brands() });
      toast.success('Brand created successfully');
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to create brand';
      toast.error(message);
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BrandInput> }) =>
      updateBrand(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.brands() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.brand(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.models() });
      toast.success('Brand updated successfully');
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to update brand';
      toast.error(message);
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.brands() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.models() });
      toast.success('Brand deleted');
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to delete brand';
      toast.error(message);
    },
  });
}

// ─── Models ─────────────────────────────────────────────────────────────────

export function useModels(brandId?: string) {
  return useQuery({
    queryKey: queryKeys.inventory.models(brandId),
    queryFn: () => getModels(brandId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useModel(id: string) {
  return useQuery({
    queryKey: queryKeys.inventory.model(id),
    queryFn: () => getModelById(id),
    enabled: !!id,
  });
}

export function useCreateModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ModelInput) => createModel(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.models() });
      toast.success('Model created successfully');
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to create model';
      toast.error(message);
    },
  });
}

export function useUpdateModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ModelInput> }) =>
      updateModel(id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.models() });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.model(variables.id) });
      toast.success('Model updated successfully');
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to update model';
      toast.error(message);
    },
  });
}

export function useDeleteModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.models() });
      toast.success('Model deleted');
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to delete model';
      toast.error(message);
    },
  });
}

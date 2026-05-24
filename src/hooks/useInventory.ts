'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import type { AccessoryInput, BrandInput, ModelInput } from '@/types/inventory';
import { toast } from 'sonner';
import { isAppError } from '@/lib/errors';

// ─── Accessories ─────────────────────────────────────────────────────────────

export function useAccessories() {
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.inventory.accessories(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accessories')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAccessory() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: AccessoryInput) => {
      // @ts-ignore - Supabase types not yet generated for new inventory tables (run migration first)
      const { data, error } = await supabase
        .from('accessories')
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
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
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<AccessoryInput> }) => {
      // @ts-ignore - Supabase types not yet generated for new inventory tables (run migration first)
      const { data, error } = await supabase
        .from('accessories')
        .update(input as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.accessories() });
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
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accessories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
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
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.inventory.brands(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: BrandInput) => {
      // @ts-ignore - Supabase types not yet generated for new inventory tables (run migration first)
      const { data, error } = await supabase
        .from('brands')
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
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
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<BrandInput> }) => {
      // @ts-ignore - Supabase types not yet generated for new inventory tables (run migration first)
      const { data, error } = await supabase
        .from('brands')
        .update(input as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.brands() });
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
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
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
  const supabase = createClient();
  return useQuery({
    queryKey: queryKeys.inventory.models(brandId),
    queryFn: async () => {
      let query = supabase
        .from('models')
        .select('*, brand:brands(id, name)')
        .order('name', { ascending: true });

      if (brandId) {
        query = query.eq('brand_id', brandId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateModel() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (input: ModelInput) => {
      // @ts-ignore - Supabase types not yet generated for new inventory tables (run migration first)
      const { data, error } = await supabase
        .from('models')
        .insert(input as any)
        .select('*, brand:brands(id, name)')
        .single();
      if (error) throw error;
      return data;
    },
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
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<ModelInput> }) => {
      // @ts-ignore - Supabase types not yet generated for new inventory tables (run migration first)
      const { data, error } = await supabase
        .from('models')
        .update(input as any)
        .eq('id', id)
        .select('*, brand:brands(id, name)')
        .single();
      if (error) throw error;
      return data;
    },
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
  const supabase = createClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
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

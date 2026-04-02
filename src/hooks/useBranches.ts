'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { 
  getBranches, 
  getAllBranches, 
  getBranchById, 
  createBranch, 
  updateBranch, 
  deleteBranch 
} from '@/lib/db/branches';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export function useBranches() {
  const supabase = createClient();
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['branches', user?.role, user?.branch_id],
    queryFn: () => getBranches(supabase),
    enabled: !!user,
  });
}

export function useAllBranches() {
  const supabase = createClient();
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['allBranches', user?.role, user?.branch_id],
    queryFn: () => getAllBranches(supabase),
    enabled: !!user && (user?.role === 'super_admin' || user?.role === 'service_manager' || user?.role === 'service_incharge'),
  });
}

export function useBranch(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['branch', id],
    queryFn: () => getBranchById(supabase, id),
    enabled: !!id,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (input: { name: string; address?: string | null; phone?: string | null }) => {
      if (!user?.shop_id) {
        throw new Error('User not authenticated');
      }
      return createBranch(supabase, input, user.shop_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['allBranches'] });
      toast.success('Branch created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create branch');
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { name?: string; address?: string | null; phone?: string | null; is_active?: boolean } }) => {
      return updateBranch(supabase, id, input);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['allBranches'] });
      queryClient.invalidateQueries({ queryKey: ['branch', variables.id] });
      toast.success('Branch updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update branch');
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: (id: string) => deleteBranch(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      queryClient.invalidateQueries({ queryKey: ['allBranches'] });
      toast.success('Branch deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deactivate branch');
    },
  });
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  getTechnicians,
  getServiceIncharges,
  getTechnicianWithJobCounts,
  getAllUsers,
  updateUserProfile,
} from '@/lib/db/technicians';
import { UserRole } from '@/types/enums';
import { Profile } from '@/types/user';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export function useTechnicians(branchId?: string) {
  const supabase = createClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['technicians', branchId],
    queryFn: () => getTechnicians(supabase, branchId),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });
}

export function useServiceIncharges(branchId?: string) {
  const supabase = createClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['serviceIncharges', branchId],
    queryFn: () => getServiceIncharges(supabase, branchId),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });
}

export function useTechnician(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['technician', id],
    queryFn: () => getTechnicianWithJobCounts(supabase, id),
    staleTime: 60 * 1000, // 1 minute
    enabled: !!id,
  });
}

export function useAllUsers() {
  const supabase = createClient();
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['allUsers', user?.role, user?.shop_id, user?.branch_id],
    queryFn: () => getAllUsers(supabase),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    enabled: !!user && (user?.role === 'super_admin'), // Only super admin can see all users
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/** Team page: loads via GET /api/team (merges emails from Auth when profiles.email is empty). */
export function useTeamMembers() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const fullShopTeamList =
    user?.role === 'super_admin' || user?.role === 'service_manager';

  return useQuery({
    queryKey: ['teamMembers', fullShopTeamList ? 'all' : 'tech', user?.shop_id],
    queryFn: async () => {
      const res = await fetch('/api/team', { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Failed to load team');
      }
      return data as Profile[];
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated && !!user,
  });
}

export type UpdateUserProfileVars = {
  userId: string;
  role?: UserRole;
  branchId?: string | null;
  is_active?: boolean;
};

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: ({ userId, role, branchId, is_active }: UpdateUserProfileVars) => {
      return updateUserProfile(supabase, userId, {
        ...(role !== undefined ? { role } : {}),
        ...(branchId !== undefined ? { branch_id: branchId } : {}),
        ...(is_active !== undefined ? { is_active } : {}),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      queryClient.invalidateQueries({ queryKey: ['serviceIncharges'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      toast.success('User updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user');
    },
  });
}

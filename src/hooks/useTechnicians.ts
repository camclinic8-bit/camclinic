'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { 
  getTechnicians, 
  getServiceIncharges, 
  getTechnicianById,
  getTechnicianWithJobCounts,
  getAllUsers,
  updateUserRole
} from '@/lib/db/technicians';
import { UserRole } from '@/types/enums';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export function useTechnicians(branchId?: string) {
  const supabase = createClient();
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['technicians', branchId, user?.role, user?.branch_id],
    queryFn: () => getTechnicians(supabase, branchId),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    enabled: !!user && (user?.role === 'super_admin' || user?.role === 'service_manager' || user?.role === 'service_incharge'),
  });
}

export function useServiceIncharges(branchId?: string) {
  const supabase = createClient();
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['serviceIncharges', branchId],
    queryFn: () => getServiceIncharges(supabase, branchId),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    enabled: !!user,
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

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: ({ userId, role, branchId }: { userId: string; role: UserRole; branchId?: string | null }) => {
      return updateUserRole(supabase, userId, role, branchId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      queryClient.invalidateQueries({ queryKey: ['serviceIncharges'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('User role updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user role');
    },
  });
}

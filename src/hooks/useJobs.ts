'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { 
  getJobs, 
  getJobById, 
  createJob, 
  updateJob, 
  updateJobStatus,
  getJobCounts,
  getJobsDueToday 
} from '@/lib/db/jobs';
import { JobFilters, JobCreateInput, JobUpdateInput } from '@/types/job';
import { JobStatus } from '@/types/enums';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export function useJobs(filters?: JobFilters, page = 1, pageSize = 20) {
  const supabase = createClient();
  const user = useAuthStore((state) => state.user);

  // For technicians, override filters to only show their assigned jobs
  const actualFilters = user?.role === 'technician' 
    ? { ...filters, assignedTechnicianId: user.id }
    : filters;

  return useQuery({
    queryKey: ['jobs', actualFilters, page.toString(), pageSize.toString(), user?.role, user?.id],
    queryFn: () => getJobs(supabase, actualFilters, page, pageSize),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    enabled: !!user,
  });
}

export function useJob(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['job', id],
    queryFn: () => getJobById(supabase, id),
    staleTime: 60 * 1000, // 1 minute
    enabled: !!id,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (input: JobCreateInput) => {
      if (!user?.shop_id || !user?.id) {
        throw new Error('User not authenticated');
      }
      return createJob(supabase, input, user.shop_id, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobCounts'] });
      toast.success('Job created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create job');
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: JobUpdateInput }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return updateJob(supabase, id, input, user.id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['jobCounts'] });
      toast.success('Job updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update job');
    },
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: JobStatus; notes?: string }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return updateJobStatus(supabase, id, status, user.id, notes);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['jobCounts'] });
      toast.success('Status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });
}

export function useJobCounts(branchId?: string) {
  const supabase = createClient();
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['jobCounts', branchId, user?.role, user?.id],
    queryFn: () => getJobCounts(supabase, branchId),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    enabled: !!user,
  });
}

export function useJobsDueToday(branchId?: string) {
  const supabase = createClient();
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['jobsDueToday', branchId, user?.role, user?.id],
    queryFn: () => getJobsDueToday(supabase, branchId),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    enabled: !!user,
  });
}

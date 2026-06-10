'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getJobs, 
  getJobById, 
  createJob, 
  updateJob, 
  updateJobStatus,
  deleteJob,
  getJobCounts,
  getJobsDueToday 
} from '@/lib/db/jobs';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/queryKeys';
import { JobFilters, JobCreateInput, JobUpdateInput } from '@/types/job';
import { JobStatus } from '@/types/enums';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { isAppError } from '@/lib/errors';

export function useJobs(filters?: JobFilters, pageSize = 20) {
  const supabase = createClient();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // For technicians, override filters to only show their assigned jobs
  const actualFilters = user?.role === 'technician'
    ? { ...filters, technician_id: user.id }
    : filters;

  return useInfiniteQuery({
    queryKey: queryKeys.jobs.list(actualFilters),
    queryFn: ({ pageParam = 1 }) => getJobs(supabase, actualFilters, pageParam, pageSize),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const totalLoaded = allPages.reduce((sum, page) => sum + page.data.length, 0);
      if (totalLoaded < lastPage.count) {
        return lastPageParam + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });
}

export function useJob(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: queryKeys.jobs.detail(id),
    queryFn: () => getJobById(supabase, id),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.counts() });
      toast.success('Job created successfully');
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to create job';
      toast.error(message);
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
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.counts() });
      toast.success('Job updated successfully');
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to update job';
      toast.error(message);
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
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.counts() });
      toast.success('Status updated successfully');
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to update status';
      toast.error(message);
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: (id: string) => deleteJob(supabase, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.counts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.jobs.dueToday() });
      toast.success('Job deleted');
    },
    onError: (error: Error) => {
      const message = isAppError(error) ? error.message : 'Failed to delete job';
      toast.error(message);
    },
  });
}

export function useJobCounts(branchId?: string) {
  const supabase = createClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.jobs.counts(branchId),
    queryFn: () => getJobCounts(supabase, branchId),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });
}

export function useJobsDueToday(branchId?: string) {
  const supabase = createClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.jobs.dueToday(branchId),
    queryFn: () => getJobsDueToday(supabase, branchId),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });
}

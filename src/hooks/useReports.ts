'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { getJobsReport, getDashboardStats, ReportFilters } from '@/lib/db/reports';
import { useAuthStore } from '@/stores/authStore';

export function useJobsReport(filters?: ReportFilters) {
  const supabase = createClient();
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['jobsReport', filters],
    queryFn: () => getJobsReport(supabase, filters),
    staleTime: 0,
    refetchOnWindowFocus: false,
    enabled: !!user,
  });
}

export function useDashboardStats(branchId?: string) {
  const supabase = createClient();
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['dashboardStats', branchId],
    queryFn: () => getDashboardStats(supabase, branchId),
    staleTime: 0,
    refetchOnWindowFocus: false,
    enabled: !!user,
  });
}

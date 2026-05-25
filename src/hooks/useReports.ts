'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { getJobsReport, getDashboardStats, ReportFilters } from '@/lib/db/reports';
import { useAuthStore } from '@/stores/authStore';

export function useJobsReport(filters?: ReportFilters) {
  const supabase = createClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['jobsReport', filters],
    queryFn: () => getJobsReport(supabase, filters),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });
}

export function useDashboardStats(branchId?: string) {
  const supabase = createClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['dashboardStats', branchId],
    queryFn: () => getDashboardStats(supabase, branchId),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
    enabled: isAuthenticated,
  });
}

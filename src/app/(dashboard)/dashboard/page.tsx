'use client';

import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  IndianRupee
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { JobCard } from '@/components/jobs/JobCard';
import { useDashboardStats, useJobsReport } from '@/hooks/useReports';
import { useJobsDueToday, useJobCounts } from '@/hooks/useJobs';
import { useBranchStore } from '@/stores/branchStore';
import { formatINR } from '@/lib/utils/currency';
import { JOB_STATUS_LABELS, JobStatus } from '@/types/enums';

export default function DashboardPage() {
  const { selectedBranchId } = useBranchStore();
  const { data: stats, isLoading: statsLoading } = useDashboardStats(selectedBranchId || undefined);
  const { data: jobsDueToday, isLoading: dueTodayLoading } = useJobsDueToday(selectedBranchId || undefined);
  const { data: jobCounts, isLoading: countsLoading } = useJobCounts(selectedBranchId || undefined);

  const statCards = [
    {
      title: 'Total Jobs',
      value: stats?.total_jobs || 0,
      icon: Briefcase,
      color: 'bg-blue-500',
    },
    {
      title: 'Jobs Today',
      value: stats?.jobs_today || 0,
      icon: Clock,
      color: 'bg-purple-500',
    },
    {
      title: 'Pending Jobs',
      value: stats?.pending_jobs || 0,
      icon: AlertCircle,
      color: 'bg-orange-500',
    },
    {
      title: 'Completed',
      value: stats?.completed_jobs || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      title: 'Total Revenue',
      value: formatINR(stats?.total_revenue || 0),
      icon: TrendingUp,
      color: 'bg-emerald-500',
      isAmount: true,
    },
    {
      title: 'Pending Balance',
      value: formatINR(stats?.pending_balance || 0),
      icon: IndianRupee,
      color: 'bg-red-500',
      isAmount: true,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="Dashboard" />
      
      <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{stat.title}</p>
                    <p className={`font-semibold text-gray-900 ${stat.isAmount ? 'text-sm' : 'text-lg'}`}>
                      {statsLoading ? '-' : stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Jobs by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {countsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 bg-gray-100 animate-pulse rounded" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(jobCounts || {}).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm text-gray-600">
                        {JOB_STATUS_LABELS[status as JobStatus]}
                      </span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jobs Due Today</CardTitle>
            </CardHeader>
            <CardContent>
              {dueTodayLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-gray-100 animate-pulse rounded" />
                  ))}
                </div>
              ) : jobsDueToday && jobsDueToday.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {jobsDueToday.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No jobs due today
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

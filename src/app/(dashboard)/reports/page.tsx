'use client';

import { useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge';
import { useJobsReport } from '@/hooks/useReports';
import { useBranches } from '@/hooks/useBranches';
import { useBranchStore } from '@/stores/branchStore';
import { formatDate } from '@/lib/utils/dates';
import { formatINR } from '@/lib/utils/currency';
import { JOB_STATUS_LABELS, JobStatus } from '@/types/enums';

export default function ReportsPage() {
  const { selectedBranchId } = useBranchStore();
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: branches } = useBranches();
  const { data: jobs, isLoading } = useJobsReport({
    branch_id: selectedBranchId || undefined,
    status: statusFilter || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.entries(JOB_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const totalRevenue = jobs?.reduce((sum, job) => sum + job.grand_total, 0) || 0;
  const totalBalance = jobs?.reduce((sum, job) => sum + job.balance_amount, 0) || 0;

  const handleExport = () => {
    if (!jobs || jobs.length === 0) return;

    const headers = ['Job Number', 'Customer', 'Phone', 'Status', 'Branch', 'Total', 'Balance', 'Date'];
    const rows = jobs.map(job => [
      job.job_number,
      job.customer_name,
      job.customer_phone,
      JOB_STATUS_LABELS[job.status],
      job.service_branch,
      job.grand_total.toString(),
      job.balance_amount.toString(),
      formatDate(job.created_at),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jobs-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="Reports" />
      
      <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <Select
                label="Status"
                options={statusOptions}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as JobStatus | '')}
              />
              <Input
                type="date"
                label="From Date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <Input
                type="date"
                label="To Date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
              <div className="flex items-end">
                <Button variant="outline" onClick={handleExport} disabled={!jobs || jobs.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Total Jobs</p>
              <p className="text-2xl font-bold">{jobs?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">{formatINR(totalRevenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">Pending Balance</p>
              <p className="text-2xl font-bold text-red-600">{formatINR(totalBalance)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Jobs Report</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 bg-gray-100 animate-pulse rounded" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs && jobs.length > 0 ? (
                    jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.job_number}</TableCell>
                        <TableCell>
                          <div>
                            <p>{job.customer_name}</p>
                            <p className="text-xs text-gray-500">{job.customer_phone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <JobStatusBadge status={job.status} />
                        </TableCell>
                        <TableCell>{job.service_branch}</TableCell>
                        <TableCell className="text-right">{formatINR(job.grand_total)}</TableCell>
                        <TableCell className="text-right">
                          <span className={job.balance_amount > 0 ? 'text-red-600' : ''}>
                            {formatINR(job.balance_amount)}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(job.created_at)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableEmpty message="No jobs found for the selected filters" />
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

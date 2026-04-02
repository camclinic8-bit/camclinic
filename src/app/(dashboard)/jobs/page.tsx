'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge';
import { JobPriorityBadge } from '@/components/jobs/JobPriorityBadge';
import { useJobs } from '@/hooks/useJobs';
import { useBranchStore } from '@/stores/branchStore';
import { JobStatus, JobPriority, JOB_STATUS_LABELS, JOB_PRIORITY_LABELS } from '@/types/enums';
import { formatDate } from '@/lib/utils/dates';
import { formatINR } from '@/lib/utils/currency';

export default function JobsPage() {
  const router = useRouter();
  const { selectedBranchId } = useBranchStore();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<JobPriority | ''>('');
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'estimate_delivery_date' | 'job_number' | 'grand_total' | 'balance_amount'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  // When global branch filter changes (sidebar), reset pagination — not driven by local handlers
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync page to external branch filter
    setPage(1);
  }, [selectedBranchId]);

  const { data, isLoading } = useJobs(
    {
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      branch_id: selectedBranchId || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    },
    page,
    pageSize
  );

  const totalCount = data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const paginationNumbers = useMemo(() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    const pages: number[] = [];
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [page, totalPages]);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...Object.entries(JOB_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    ...Object.entries(JOB_PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const sortByOptions = [
    { value: 'created_at', label: 'Newest Created' },
    { value: 'updated_at', label: 'Recently Updated' },
    { value: 'estimate_delivery_date', label: 'Delivery Date' },
    { value: 'job_number', label: 'Job Number' },
    { value: 'grand_total', label: 'Grand Total' },
    { value: 'balance_amount', label: 'Balance Due' },
  ];

  const pageSizeOptions = [
    { value: '20', label: '20 / page' },
    { value: '50', label: '50 / page' },
    { value: '100', label: '100 / page' },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="Jobs" />
      
      <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto">
        {/* Toolbar: filters flex with content; button stays usable on desktop (not squeezed by w-full grid) */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-h-[42px] pl-9"
              />
            </div>
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as JobStatus | '');
                setPage(1);
              }}
              className="w-full min-h-[42px]"
            />
            <Select
              options={priorityOptions}
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value as JobPriority | '');
                setPage(1);
              }}
              className="w-full min-h-[42px]"
            />
            <Select
              options={sortByOptions}
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as typeof sortBy);
                setPage(1);
              }}
              className="w-full min-h-[42px]"
            />
            <Select
              options={[
                { value: 'desc', label: 'Descending' },
                { value: 'asc', label: 'Ascending' },
              ]}
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as 'asc' | 'desc');
                setPage(1);
              }}
              className="w-full min-h-[42px]"
            />
          </div>
          <div className="flex shrink-0 justify-stretch sm:justify-end xl:justify-start xl:pt-0.5">
            <Link href="/jobs/new" className="block w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full min-h-[44px] gap-0 shadow-sm sm:min-w-[152px] sm:px-8"
              >
                <Plus className="mr-2 h-5 w-5 shrink-0" aria-hidden />
                New Job
              </Button>
            </Link>
          </div>
        </div>

        {isLoading && !data ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-14 bg-gray-100 animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : data?.data && data.data.length > 0 ? (
          <>
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full min-w-[1000px] text-sm lg:text-xs">
                  <thead className="bg-gray-50 border-b">
                    <tr className="text-left text-gray-600">
                      <th className="px-3 lg:px-4 py-2 lg:py-2.5 font-medium">Job</th>
                      <th className="px-3 lg:px-4 py-2 lg:py-2.5 font-medium">Customer</th>
                      <th className="px-3 lg:px-4 py-2 lg:py-2.5 font-medium">Products</th>
                      <th className="px-3 lg:px-4 py-2 lg:py-2.5 font-medium">Status</th>
                      <th className="px-3 lg:px-4 py-2 lg:py-2.5 font-medium">Priority</th>
                      <th className="px-3 lg:px-4 py-2 lg:py-2.5 font-medium">Technician</th>
                      <th className="px-3 lg:px-4 py-2 lg:py-2.5 font-medium">Branch</th>
                      <th className="px-3 lg:px-4 py-2 lg:py-2.5 font-medium">Created</th>
                      <th className="px-3 lg:px-4 py-2 lg:py-2.5 font-medium text-right">Grand Total</th>
                      <th className="px-3 lg:px-4 py-2 lg:py-2.5 font-medium text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.data.map((job) => (
                      <tr
                        key={job.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/jobs/${job.id}`)}
                      >
                        <td className="px-3 lg:px-4 py-2 lg:py-2.5 font-semibold text-gray-900">{job.job_number}</td>
                        <td className="px-3 lg:px-4 py-2 lg:py-2.5">
                          <div className="font-medium text-gray-900">{job.customer?.name || '—'}</div>
                          <div className="text-gray-600 mt-0.5 tabular-nums">
                            {job.customer?.phone?.trim() || '—'}
                          </div>
                        </td>
                        <td className="px-3 lg:px-4 py-2 lg:py-2.5 text-gray-700 max-w-[240px] truncate">
                          {job.products && job.products.length > 0
                            ? job.products
                                .map((p) => [p.brand, p.model].filter(Boolean).join(' ').trim())
                                .filter(Boolean)
                                .join(', ')
                            : '-'}
                        </td>
                        <td className="px-3 lg:px-4 py-2 lg:py-2.5"><JobStatusBadge status={job.status} /></td>
                        <td className="px-3 lg:px-4 py-2 lg:py-2.5"><JobPriorityBadge priority={job.priority} /></td>
                        <td className="px-3 lg:px-4 py-2 lg:py-2.5">{job.assigned_technician?.full_name || '-'}</td>
                        <td className="px-3 lg:px-4 py-2 lg:py-2.5">{job.service_branch?.name || '-'}</td>
                        <td className="px-3 lg:px-4 py-2 lg:py-2.5 text-gray-600">{formatDate(job.created_at)}</td>
                        <td className="px-3 lg:px-4 py-2 lg:py-2.5 text-right">{formatINR(job.grand_total || 0)}</td>
                        <td className={`px-3 lg:px-4 py-2 lg:py-2.5 text-right font-medium ${(job.balance_amount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatINR(job.balance_amount || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-sm text-gray-600">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} jobs
              </div>
              <div className="flex items-center gap-2">
                <Select
                  options={pageSizeOptions}
                  value={String(pageSize)}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="w-[120px]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                {paginationNumbers.map((num) => (
                  <Button
                    key={num}
                    variant={num === page ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No jobs found</p>
              <Link href="/jobs/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Job
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

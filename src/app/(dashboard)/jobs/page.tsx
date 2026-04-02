'use client';

import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Briefcase,
  Calendar,
  User,
  MapPin,
  Phone,
  ChevronRight,
  ChevronLeft,
  Trash2,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge';
import { JobPriorityBadge } from '@/components/jobs/JobPriorityBadge';
import { useJobs, useDeleteJob } from '@/hooks/useJobs';
import { useAuth } from '@/hooks/useAuth';
import { useBranchStore } from '@/stores/branchStore';
import { JobStatus, JobPriority, JOB_STATUS_LABELS, JOB_PRIORITY_LABELS } from '@/types/enums';
import { formatDate } from '@/lib/utils/dates';
import { formatINR } from '@/lib/utils/currency';
import { summarizeJobProductsLine } from '@/lib/utils/jobProducts';
import { nameInitials } from '@/lib/utils/initials';

const PAGE_SIZES = [20, 50, 100] as const;

const PRIORITY_ROW_BORDER: Record<JobPriority, string> = {
  immediate: 'border-l-[3px] border-l-red-500',
  high: 'border-l-[3px] border-l-orange-500',
  medium: 'border-l-[3px] border-l-blue-500',
  low: 'border-l-[3px] border-l-gray-400',
};

export default function JobsPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuth();
  const deleteJobMutation = useDeleteJob();
  const { selectedBranchId, setSelectedBranch } = useBranchStore();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<JobPriority | ''>('');
  const [sortBy, setSortBy] = useState<
    'created_at' | 'updated_at' | 'estimate_delivery_date' | 'job_number' | 'grand_total' | 'balance_amount'
  >('created_at');
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

  const hasActiveFilters =
    !!debouncedSearch || !!statusFilter || !!priorityFilter || !!selectedBranchId;

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

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="Jobs" />

      <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto text-sm sm:text-[15px] leading-normal">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
          <Card className="flex-1 min-w-0 border-gray-200/80 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-2">Filters</p>
              <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search phone, customer name, job #…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full min-h-[40px] pl-8 text-sm"
                  />
                </div>
                <Select
                  options={statusOptions}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as JobStatus | '');
                    setPage(1);
                  }}
                  className="w-full min-h-[40px] text-sm"
                />
                <Select
                  options={priorityOptions}
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value as JobPriority | '');
                    setPage(1);
                  }}
                  className="w-full min-h-[40px] text-sm"
                />
                <Select
                  options={sortByOptions}
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as typeof sortBy);
                    setPage(1);
                  }}
                  className="w-full min-h-[40px] text-sm"
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
                  className="w-full min-h-[40px] text-sm"
                />
              </div>
            </CardContent>
          </Card>
          <div className="flex shrink-0 justify-stretch sm:justify-end xl:pt-1">
            <Link href="/jobs/new" className="block w-full sm:w-auto">
              <Button
                size="md"
                className="w-full min-h-[38px] gap-1.5 text-xs shadow-sm sm:min-w-[140px] sm:px-5"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                New Job
              </Button>
            </Link>
          </div>
        </div>

        {isLoading && !data ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-14 bg-gray-50/80 animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : data?.data && data.data.length > 0 ? (
          <>
            <Card className="border-gray-200/80 shadow-sm overflow-hidden">
              <CardContent className="p-0 overflow-x-auto [&_table]:text-sm sm:[&_table]:text-[15px] [&_table]:leading-snug [&_td]:!px-3 [&_td]:!py-2.5 sm:[&_td]:!px-3.5 sm:[&_td]:!py-3 [&_th]:!px-3 [&_th]:!py-2.5 sm:[&_th]:!px-3.5 sm:[&_th]:!py-3 [&_th]:!text-xs sm:[&_th]:!text-sm [&_th]:!font-semibold [&_th]:!normal-case [&_th]:!tracking-normal">
                <Table className="min-w-[1040px]">
                  <TableHeader>
                    <tr className="border-b border-gray-200 bg-gray-50/90">
                      <TableHead className="pl-3 lg:pl-4 !text-left text-gray-600 min-w-[200px]">
                        Job
                      </TableHead>
                      <TableHead className="min-w-[150px]">Customer</TableHead>
                      <TableHead className="min-w-[180px] hidden md:table-cell">Products</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Priority</TableHead>
                      <TableHead className="hidden lg:table-cell min-w-[108px]">Technician</TableHead>
                      <TableHead className="hidden xl:table-cell">Branch</TableHead>
                      <TableHead className="hidden md:table-cell whitespace-nowrap">Created</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Total</TableHead>
                      <TableHead className="pr-3 lg:pr-4 text-right whitespace-nowrap min-w-[7.5rem]">
                        Balance
                      </TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((job) => {
                      const productsSummary = summarizeJobProductsLine(job.products, {
                        maxEach: 32,
                        maxLine: 72,
                      });
                      const borderClass = PRIORITY_ROW_BORDER[job.priority];
                      return (
                        <tr
                          key={job.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(`/jobs/${job.id}`)}
                          onKeyDown={(e: KeyboardEvent<HTMLTableRowElement>) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              router.push(`/jobs/${job.id}`);
                            }
                          }}
                          className={`group cursor-pointer border-0 border-b border-gray-100 last:border-0 hover:!bg-blue-50/60 transition-colors ${borderClass}`}
                        >
                          <TableCell className="pl-3 lg:pl-4 align-top">
                            <div className="flex items-start gap-2 min-w-0">
                              <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-[11px] font-bold text-white shadow-sm ring-1 ring-white"
                                aria-hidden
                              >
                                {nameInitials(job.customer?.name)}
                              </div>
                              <div className="min-w-0 pt-0.5">
                                <p className="font-semibold text-gray-900 tabular-nums text-sm sm:text-[15px]">{job.job_number}</p>
                                <p className="text-xs text-gray-500 mt-0.5 md:hidden line-clamp-2" title={productsSummary.full}>
                                  {productsSummary.line === '—' ? 'No products' : productsSummary.line}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="font-medium text-gray-900 truncate max-w-[200px] text-sm sm:text-[15px]">
                              {job.customer?.name || '—'}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5 tabular-nums">
                              <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                              <span className="truncate">{job.customer?.phone?.trim() || '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="align-top text-gray-700 max-w-[min(260px,26vw)] hidden md:table-cell">
                            <span className="line-clamp-2 break-words" title={productsSummary.full || undefined}>
                              {productsSummary.line}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle">
                            <JobStatusBadge status={job.status} size="md" />
                          </TableCell>
                          <TableCell className="align-middle hidden sm:table-cell">
                            <JobPriorityBadge priority={job.priority} size="md" />
                          </TableCell>
                          <TableCell className="align-middle text-gray-800 hidden lg:table-cell">
                            <span className="inline-flex items-center gap-1.5 min-w-0">
                              <User className="h-4 w-4 shrink-0 text-gray-400" />
                              <span className="truncate">{job.assigned_technician?.full_name || '—'}</span>
                            </span>
                          </TableCell>
                          <TableCell className="align-middle text-gray-700 hidden xl:table-cell max-w-[130px]">
                            <span className="inline-flex items-start gap-1.5 min-w-0">
                              <MapPin className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                              <span className="line-clamp-2 break-words">{job.service_branch?.name || '—'}</span>
                            </span>
                          </TableCell>
                          <TableCell className="align-middle text-gray-600 whitespace-nowrap hidden md:table-cell">
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {formatDate(job.created_at)}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle text-right tabular-nums text-gray-800 hidden sm:table-cell">
                            {formatINR(job.grand_total || 0)}
                          </TableCell>
                          <TableCell className="pr-3 lg:pr-4 text-right align-middle">
                            <div className="flex items-center justify-end gap-1">
                              <span
                                className={`tabular-nums font-semibold text-sm sm:text-[15px] ${(job.balance_amount || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}
                              >
                                {formatINR(job.balance_amount || 0)}
                              </span>
                              {isSuperAdmin && (
                                <button
                                  type="button"
                                  title="Delete job"
                                  disabled={
                                    deleteJobMutation.isPending &&
                                    deleteJobMutation.variables === job.id
                                  }
                                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:opacity-40"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                      !window.confirm(
                                        `Delete job ${job.job_number}? This cannot be undone.`
                                      )
                                    ) {
                                      return;
                                    }
                                    deleteJobMutation.mutate(job.id);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                </button>
                              )}
                              <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-600 transition-colors shrink-0" aria-hidden />
                            </div>
                          </TableCell>
                        </tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex flex-col items-start gap-2 pt-2 text-xs sm:text-sm text-gray-600">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="tabular-nums text-gray-600">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of{' '}
                  {totalCount}
                </span>
                <div
                  className="inline-flex items-center rounded-md border border-gray-200/90 bg-white p-0.5 shadow-sm"
                  role="group"
                  aria-label="Rows per page"
                >
                  {PAGE_SIZES.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setPageSize(n);
                        setPage(1);
                      }}
                      className={`min-w-[2rem] rounded px-2 py-1 text-xs font-semibold tabular-nums transition-colors ${
                        pageSize === n
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="inline-flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                {paginationNumbers.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPage(num)}
                    className={`min-w-[2rem] rounded-md px-2 py-1 text-xs font-semibold tabular-nums transition-colors ${
                      num === page
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <Card className="border-dashed border-2 border-gray-200 bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <Briefcase className="h-7 w-7 text-gray-400" />
              </div>
              <p className="text-gray-700 font-medium text-sm">No jobs match your criteria</p>
              <p className="text-xs text-gray-500 mt-1 mb-6">
                {hasActiveFilters
                  ? 'Try clearing filters or adjusting search.'
                  : 'Create a job to get started.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch('');
                      setDebouncedSearch('');
                      setStatusFilter('');
                      setPriorityFilter('');
                      setSelectedBranch(null);
                      setPage(1);
                    }}
                  >
                    Clear filters
                  </Button>
                )}
                <Link href="/jobs/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Job
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

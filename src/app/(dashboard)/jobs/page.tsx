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
import { useJobs } from '@/hooks/useJobs';
import { useBranchStore } from '@/stores/branchStore';
import { JobStatus, JobPriority, JOB_STATUS_LABELS, JOB_PRIORITY_LABELS } from '@/types/enums';
import { formatDate } from '@/lib/utils/dates';
import { formatINR } from '@/lib/utils/currency';
import { summarizeJobProductsLine } from '@/lib/utils/jobProducts';
import { nameInitials } from '@/lib/utils/initials';

const PAGE_SIZE_OPTIONS = [
  { value: '20', label: '20 / page' },
  { value: '50', label: '50 / page' },
  { value: '100', label: '100 / page' },
];

const PRIORITY_ROW_BORDER: Record<JobPriority, string> = {
  immediate: 'border-l-[3px] border-l-red-500',
  high: 'border-l-[3px] border-l-orange-500',
  medium: 'border-l-[3px] border-l-blue-500',
  low: 'border-l-[3px] border-l-gray-400',
};

export default function JobsPage() {
  const router = useRouter();
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

      <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between xl:gap-6">
          <Card className="flex-1 min-w-0 border-gray-200/80 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Filters</p>
              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search job #, description…"
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
            </CardContent>
          </Card>
          <div className="flex shrink-0 justify-stretch sm:justify-end xl:pt-1">
            <Link href="/jobs/new" className="block w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full min-h-[44px] gap-2 shadow-sm sm:min-w-[168px] sm:px-8"
              >
                <Plus className="h-5 w-5 shrink-0" aria-hidden />
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
                  <div key={i} className="h-16 bg-gray-50/80 animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : data?.data && data.data.length > 0 ? (
          <>
            <Card className="border-gray-200/80 shadow-sm overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <Table className="min-w-[1100px] text-sm lg:text-xs">
                  <TableHeader>
                    <tr className="border-b border-gray-200 bg-gray-50/90">
                      <TableHead className="pl-4 lg:pl-5 py-3 text-left text-gray-600 normal-case tracking-normal font-semibold text-xs min-w-[220px]">
                        Job
                      </TableHead>
                      <TableHead className="py-3 text-gray-600 normal-case tracking-normal font-semibold text-xs min-w-[160px]">
                        Customer
                      </TableHead>
                      <TableHead className="py-3 text-gray-600 normal-case tracking-normal font-semibold text-xs min-w-[200px] hidden md:table-cell">
                        Products
                      </TableHead>
                      <TableHead className="py-3 text-gray-600 normal-case tracking-normal font-semibold text-xs whitespace-nowrap">
                        Status
                      </TableHead>
                      <TableHead className="py-3 text-gray-600 normal-case tracking-normal font-semibold text-xs whitespace-nowrap hidden sm:table-cell">
                        Priority
                      </TableHead>
                      <TableHead className="py-3 text-gray-600 normal-case tracking-normal font-semibold text-xs hidden lg:table-cell min-w-[120px]">
                        Technician
                      </TableHead>
                      <TableHead className="py-3 text-gray-600 normal-case tracking-normal font-semibold text-xs hidden xl:table-cell">
                        Branch
                      </TableHead>
                      <TableHead className="py-3 text-gray-600 normal-case tracking-normal font-semibold text-xs hidden md:table-cell whitespace-nowrap">
                        Created
                      </TableHead>
                      <TableHead className="py-3 text-gray-600 normal-case tracking-normal font-semibold text-xs text-right hidden sm:table-cell">
                        Total
                      </TableHead>
                      <TableHead className="py-3 pr-4 lg:pr-5 text-gray-600 normal-case tracking-normal font-semibold text-xs text-right whitespace-nowrap">
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
                          <TableCell className="pl-4 lg:pl-5 py-3 align-top">
                            <div className="flex items-start gap-3 min-w-0">
                              <div
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-bold text-white shadow-sm ring-2 ring-white"
                                aria-hidden
                              >
                                {nameInitials(job.customer?.name)}
                              </div>
                              <div className="min-w-0 pt-0.5">
                                <p className="font-semibold text-gray-900 tabular-nums">{job.job_number}</p>
                                <p className="text-xs text-gray-500 mt-0.5 md:hidden line-clamp-2" title={productsSummary.full}>
                                  {productsSummary.line === '—' ? 'No products' : productsSummary.line}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top py-3">
                            <div className="font-medium text-gray-900 truncate max-w-[200px]">
                              {job.customer?.name || '—'}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 tabular-nums">
                              <Phone className="h-3 w-3 shrink-0 text-gray-400" />
                              <span className="truncate">{job.customer?.phone?.trim() || '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="align-top py-3 text-gray-700 max-w-[min(280px,26vw)] hidden md:table-cell">
                            <span className="line-clamp-2 break-words" title={productsSummary.full || undefined}>
                              {productsSummary.line}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle py-3">
                            <JobStatusBadge status={job.status} />
                          </TableCell>
                          <TableCell className="align-middle py-3 hidden sm:table-cell">
                            <JobPriorityBadge priority={job.priority} />
                          </TableCell>
                          <TableCell className="align-middle py-3 text-gray-800 hidden lg:table-cell">
                            <span className="inline-flex items-center gap-1.5 min-w-0">
                              <User className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                              <span className="truncate">{job.assigned_technician?.full_name || '—'}</span>
                            </span>
                          </TableCell>
                          <TableCell className="align-middle py-3 text-gray-700 hidden xl:table-cell max-w-[140px]">
                            <span className="inline-flex items-start gap-1.5 min-w-0">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400 mt-0.5" />
                              <span className="line-clamp-2 break-words">{job.service_branch?.name || '—'}</span>
                            </span>
                          </TableCell>
                          <TableCell className="align-middle py-3 text-gray-600 whitespace-nowrap hidden md:table-cell">
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                              {formatDate(job.created_at)}
                            </span>
                          </TableCell>
                          <TableCell className="align-middle py-3 text-right tabular-nums text-gray-800 hidden sm:table-cell">
                            {formatINR(job.grand_total || 0)}
                          </TableCell>
                          <TableCell className="pr-4 lg:pr-5 py-3 text-right align-middle">
                            <div className="flex items-center justify-end gap-2">
                              <span
                                className={`tabular-nums font-semibold ${(job.balance_amount || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}
                              >
                                {formatINR(job.balance_amount || 0)}
                              </span>
                              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-600 transition-colors shrink-0" aria-hidden />
                            </div>
                          </TableCell>
                        </tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} jobs
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  options={PAGE_SIZE_OPTIONS}
                  value={String(pageSize)}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="w-[120px]"
                />
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
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
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <Card className="border-dashed border-2 border-gray-200 bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <Briefcase className="h-7 w-7 text-gray-400" />
              </div>
              <p className="text-gray-700 font-medium">No jobs match your criteria</p>
              <p className="text-sm text-gray-500 mt-1 mb-6">
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

'use client';

import { useEffect, useMemo, useState, useRef, type KeyboardEvent } from 'react';
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
  const observerTargetRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Drag to scroll state
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Mouse event handlers for dragging the container
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle left click drag
    if (e.button !== 0) return;

    // Ignore clicks on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('select') ||
      target.closest('label')
    ) {
      return;
    }

    if (!scrollContainerRef.current) return;

    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollContainerRef.current.scrollLeft,
      scrollTop: scrollContainerRef.current.scrollTop,
    };
    
    // Add event listeners on document
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
  };

  const handleDocumentMouseMove = (e: MouseEvent) => {
    if (!scrollContainerRef.current) return;
    
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    scrollContainerRef.current.scrollLeft = dragStart.current.scrollLeft - dx;
    scrollContainerRef.current.scrollTop = dragStart.current.scrollTop - dy;
  };

  const handleDocumentMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleDocumentMouseMove);
    document.removeEventListener('mouseup', handleDocumentMouseUp);
  };

  const handleRowClick = (jobId: string, e: React.MouseEvent) => {
    const dx = Math.abs(e.clientX - dragStartPos.current.x);
    const dy = Math.abs(e.clientY - dragStartPos.current.y);
    if (dx > 5 || dy > 5) {
      return;
    }
    router.push(`/jobs/${jobId}`);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useJobs(
    {
      search: debouncedSearch || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      branch_id: selectedBranchId || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    },
    pageSize
  );

  const flatData = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) || [];
  }, [data]);

  const totalCount = data?.pages[0]?.count || 0;

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: scrollContainerRef.current, threshold: 0.1 }
    );

    const target = observerTargetRef.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

      <div className="flex-1 flex flex-col p-4 lg:p-6 space-y-4 overflow-hidden text-sm sm:text-[15px] leading-normal">
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
                  }}
                  className="w-full min-h-[40px] text-sm"
                />
                <Select
                  options={priorityOptions}
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value as JobPriority | '');
                  }}
                  className="w-full min-h-[40px] text-sm"
                />
                <Select
                  options={sortByOptions}
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as typeof sortBy);
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
          <Card className="flex-1 min-h-0 flex flex-col border-gray-200/80 shadow-sm overflow-hidden">
            <div className="flex-1 min-h-0 overflow-auto">
              <CardContent className="p-0">
                <Table className="min-w-[1040px]" containerClassName="">
                  <TableHeader>
                    <tr className="border-b border-gray-200 bg-gray-50/90">
                      <TableHead className="sticky left-0 top-0 bg-gray-50 z-40 pl-3 lg:pl-4 !text-left text-gray-600 min-w-[200px]">
                        Job
                      </TableHead>
                      <TableHead className="sticky top-0 bg-gray-50 z-30 min-w-[150px]">Customer</TableHead>
                      <TableHead className="sticky top-0 bg-gray-50 z-30 min-w-[180px] hidden md:table-cell">Products</TableHead>
                      <TableHead className="sticky top-0 bg-gray-50 z-30 whitespace-nowrap">Status</TableHead>
                      <TableHead className="sticky top-0 bg-gray-50 z-30 whitespace-nowrap hidden sm:table-cell">Priority</TableHead>
                      <TableHead className="sticky top-0 bg-gray-50 z-30 hidden lg:table-cell min-w-[108px]">Technician</TableHead>
                      <TableHead className="sticky top-0 bg-gray-50 z-30 hidden xl:table-cell">Branch</TableHead>
                      <TableHead className="sticky top-0 bg-gray-50 z-30 hidden md:table-cell whitespace-nowrap">Created</TableHead>
                      <TableHead className="sticky top-0 bg-gray-50 z-30 text-right hidden sm:table-cell">Total</TableHead>
                      <TableHead className="sticky top-0 bg-gray-50 z-30 pr-3 lg:pr-4 text-right whitespace-nowrap min-w-[7.5rem]">
                        Balance
                      </TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <tr key={i} className="border-0 border-b border-gray-100 last:border-0">
                        <TableCell className="pl-3 lg:pl-4 align-top">
                          <div className="flex items-start gap-2">
                            <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                              <div className="h-3 bg-gray-200 rounded animate-pulse w-16 md:hidden" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                            <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
                          </div>
                        </TableCell>
                        <TableCell className="align-top hidden md:table-cell">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="h-7 w-20 bg-gray-200 rounded-full animate-pulse" />
                        </TableCell>
                        <TableCell className="align-middle hidden sm:table-cell">
                          <div className="h-7 w-16 bg-gray-200 rounded-full animate-pulse" />
                        </TableCell>
                        <TableCell className="align-middle hidden lg:table-cell">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                        </TableCell>
                        <TableCell className="align-middle hidden xl:table-cell">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                        </TableCell>
                        <TableCell className="align-middle hidden md:table-cell">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                        </TableCell>
                        <TableCell className="align-middle text-right hidden sm:table-cell">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-16 ml-auto" />
                        </TableCell>
                        <TableCell className="pr-3 lg:pr-4 text-right align-middle">
                          <div className="flex items-center justify-end gap-1">
                            <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                            <div className="h-7 w-7 bg-gray-200 rounded animate-pulse" />
                          </div>
                        </TableCell>
                      </tr>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </div>
          </Card>
        ) : flatData && flatData.length > 0 ? (
          <Card className="flex-1 min-h-0 flex flex-col border-gray-200/80 shadow-sm overflow-hidden">
            <div
              ref={scrollContainerRef}
              onMouseDown={handleMouseDown}
              className={`flex-1 min-h-0 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ${
                isDragging ? 'select-none cursor-grabbing' : 'cursor-grab'
              }`}
            >
              <CardContent className="p-0 [&_table]:text-sm sm:[&_table]:text-[15px] [&_table]:leading-snug [&_td]:!px-3 [&_td]:!py-2.5 sm:[&_td]:!px-3.5 sm:[&_td]:!py-3 [&_th]:!px-3 [&_th]:!py-2.5 sm:[&_th]:!px-3.5 sm:[&_th]:!py-3 [&_th]:!text-xs sm:[&_th]:!text-sm [&_th]:!font-semibold [&_th]:!normal-case [&_th]:!tracking-normal">
                <Table className="min-w-[1040px]" containerClassName="">
                  <TableHeader>
                    <tr className="border-b border-gray-200 bg-gray-50/90">
                      <TableHead className="sticky left-0 top-0 bg-gray-50 z-40 pl-3 lg:pl-4 !text-left text-gray-600 min-w-[200px]">
                        Job
                      </TableHead>
                      <TableHead className="sticky top-0 bg-gray-50 z-30 min-w-[150px]">Customer</TableHead>
                      <TableHead className="sticky top-0 bg-gray-50 z-30 min-w-[180px] hidden md:table-cell">Products</TableHead>
                      <TableHead className="sticky top-0 bg-gray-50 z-30 whitespace-nowrap">Status</TableHead>
                      <TableHead className="sticky top-0 bg-gray-50 z-30 whitespace-nowrap hidden sm:table-cell">Priority</TableHead>
                      <TableHead className="sticky top-0 bg-gray-50 z-30 hidden lg:table-cell min-w-[108px]">Technician</TableHead>
                      <TableHead className="sticky top-0 bg-gray-50 z-30 hidden xl:table-cell">Branch</TableHead>
                      <TableHead className="sticky top-0 bg-gray-50 z-30 hidden md:table-cell whitespace-nowrap">Created</TableHead>
                      <TableHead className="sticky top-0 bg-gray-50 z-30 text-right hidden sm:table-cell">Total</TableHead>
                      <TableHead className="sticky top-0 bg-gray-50 z-30 pr-3 lg:pr-4 text-right whitespace-nowrap min-w-[7.5rem]">
                        Balance
                      </TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {flatData.map((job) => {
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
                          onMouseDown={(e) => {
                            dragStartPos.current = { x: e.clientX, y: e.clientY };
                          }}
                          onClick={(e) => handleRowClick(job.id, e)}
                          onKeyDown={(e: KeyboardEvent<HTMLTableRowElement>) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              router.push(`/jobs/${job.id}`);
                            }
                          }}
                          className={`group cursor-pointer border-0 border-b border-gray-100 last:border-0 hover:!bg-blue-50/60 transition-colors ${borderClass}`}
                        >
                          <TableCell className="sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] pl-3 lg:pl-4 align-top group-hover:bg-blue-50/60 transition-colors">
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
                    {isFetchingNextPage && (
                      <>
                        {[1, 2, 3].map((i) => (
                          <tr key={`fetching-next-${i}`} className="border-0 border-b border-gray-100 last:border-0">
                            <TableCell className="sticky left-0 bg-white z-10 pl-3 lg:pl-4 align-top">
                              <div className="flex items-start gap-2 min-w-0">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 animate-pulse" />
                                <div className="min-w-0 pt-0.5 space-y-1">
                                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="space-y-1">
                                <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                                <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
                              </div>
                            </TableCell>
                            <TableCell className="align-top hidden md:table-cell">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-40" />
                            </TableCell>
                            <TableCell className="align-middle">
                              <div className="h-7 w-20 bg-gray-200 rounded-full animate-pulse" />
                            </TableCell>
                            <TableCell className="align-middle hidden sm:table-cell">
                              <div className="h-7 w-16 bg-gray-200 rounded-full animate-pulse" />
                            </TableCell>
                            <TableCell className="align-middle hidden lg:table-cell">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                            </TableCell>
                            <TableCell className="align-middle hidden xl:table-cell">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                            </TableCell>
                            <TableCell className="align-middle hidden md:table-cell">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                            </TableCell>
                            <TableCell className="align-middle text-right hidden sm:table-cell">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-16 ml-auto" />
                            </TableCell>
                            <TableCell className="pr-3 lg:pr-4 text-right align-middle">
                              <div className="h-4 bg-gray-200 rounded animate-pulse w-16 ml-auto" />
                            </TableCell>
                          </tr>
                        ))}
                      </>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
              {/* Scroll sentinel for infinite scroll — must be INSIDE the scroll container */}
              {hasNextPage && <div ref={observerTargetRef} className="h-10 shrink-0" />}
              </div>
          </Card>
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

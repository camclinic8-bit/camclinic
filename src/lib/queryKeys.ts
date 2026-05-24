/**
 * TanStack Query Key Factory
 * 
 * Centralized query key definitions for consistent cache management
 * across the application.
 * 
 * Usage:
 * import { queryKeys } from '@/lib/queryKeys';
 * 
 * // In hooks
 * useQuery({
 *   queryKey: queryKeys.jobs.list(filters),
 *   queryFn: () => getJobs(filters)
 * })
 */

export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    session: () => ['auth', 'session'] as const,
  },
  
  // Jobs
  jobs: {
    all: ['jobs'] as const,
    list: (filters?: unknown) => ['jobs', 'list', filters] as const,
    detail: (id: string) => ['jobs', id] as const,
    counts: () => ['jobs', 'counts'] as const,
    dueToday: () => ['jobs', 'due-today'] as const,
  },
  
  // Customers
  customers: {
    all: ['customers'] as const,
    list: (page?: number, pageSize?: number, search?: string) => 
      ['customers', 'list', page, pageSize, search] as const,
    detail: (id: string) => ['customers', id] as const,
    search: (query: string) => ['customers', 'search', query] as const,
  },
  
  // Branches
  branches: {
    all: ['branches'] as const,
    list: () => ['branches', 'list'] as const,
    detail: (id: string) => ['branches', id] as const,
    allBranches: () => ['branches', 'all'] as const,
  },
  
  // Technicians / Users
  technicians: {
    all: ['technicians'] as const,
    list: (branchId?: string) => ['technicians', 'list', branchId] as const,
    detail: (id: string) => ['technicians', id] as const,
    serviceIncharges: (branchId?: string) => ['technicians', 'service-incharges', branchId] as const,
    allUsers: () => ['users', 'all'] as const,
    teamMembers: (scope?: string) => ['users', 'team', scope] as const,
  },
  
  // Products
  products: {
    all: ['products'] as const,
    byJob: (jobId: string) => ['products', 'job', jobId] as const,
    detail: (id: string) => ['products', id] as const,
  },
  
  // Billing / Spare Parts
  billing: {
    all: ['billing'] as const,
    spareParts: (jobId: string) => ['billing', 'spare-parts', jobId] as const,
  },
  
  // Reports
  reports: {
    all: ['reports'] as const,
    jobs: (filters?: Record<string, unknown>) => ['reports', 'jobs', filters] as const,
    dashboard: (branchId?: string) => ['reports', 'dashboard', branchId] as const,
  },
  
  // Inventory (Accessories, Brands, Models)
  inventory: {
    all: ['inventory'] as const,
    accessories: () => ['inventory', 'accessories'] as const,
    accessory: (id: string) => ['inventory', 'accessories', id] as const,
    brands: () => ['inventory', 'brands'] as const,
    brand: (id: string) => ['inventory', 'brands', id] as const,
    models: (brandId?: string) => ['inventory', 'models', brandId] as const,
    model: (id: string) => ['inventory', 'models', id] as const,
  },
} as const;

/**
 * Helper to invalidate all queries for a resource
 */
export const invalidateQueries = {
  jobs: () => [queryKeys.jobs.all],
  customers: () => [queryKeys.customers.all],
  branches: () => [queryKeys.branches.all],
  technicians: () => [queryKeys.technicians.all],
  products: (jobId?: string) => jobId 
    ? [queryKeys.products.byJob(jobId)]
    : [queryKeys.products.all],
  billing: (jobId?: string) => jobId
    ? [queryKeys.billing.spareParts(jobId)]
    : [queryKeys.billing.all],
  reports: () => [queryKeys.reports.all],
} as const;

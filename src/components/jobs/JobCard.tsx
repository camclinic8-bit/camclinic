'use client';

import Link from 'next/link';
import { Calendar, User, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { JobStatusBadge } from './JobStatusBadge';
import { JobPriorityBadge } from './JobPriorityBadge';
import { JobWithRelations } from '@/types/job';
import { formatDate } from '@/lib/utils/dates';
import { formatINR } from '@/lib/utils/currency';

interface JobCardProps {
  job: JobWithRelations;
}

export function JobCard({ job }: JobCardProps) {
  const priorityBorderColors = {
    immediate: 'border-l-red-500',
    high: 'border-l-orange-500',
    medium: 'border-l-blue-500',
    low: 'border-l-gray-400',
  };

  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className={`border-l-4 ${priorityBorderColors[job.priority]} hover:shadow-md transition-shadow cursor-pointer`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900">{job.job_number}</h3>
              <p className="text-sm text-gray-600">{job.customer?.name || 'Unknown Customer'}</p>
            </div>
            <div className="flex gap-2">
              <JobPriorityBadge priority={job.priority} />
              <JobStatusBadge status={job.status} />
            </div>
          </div>

          {job.products && job.products.length > 0 && (
            <p className="text-sm text-gray-700 mb-2">
              {job.products.map(p => `${p.brand || ''} ${p.model || ''}`.trim()).filter(Boolean).join(', ') || 'No products'}
            </p>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-3">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(job.created_at)}</span>
            </div>
            {job.assigned_technician && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{job.assigned_technician.full_name}</span>
              </div>
            )}
            {job.service_branch && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{job.service_branch.name}</span>
              </div>
            )}
          </div>

          {job.grand_total > 0 && (
            <div className="mt-3 pt-3 border-t flex justify-between text-sm">
              <span className="text-gray-600">Total: {formatINR(job.grand_total)}</span>
              {job.balance_amount > 0 && (
                <span className="text-red-600 font-medium">Balance: {formatINR(job.balance_amount)}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

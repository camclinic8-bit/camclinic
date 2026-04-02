'use client';

import { Badge } from '@/components/ui/Badge';
import { JobStatus, JOB_STATUS_LABELS } from '@/types/enums';

interface JobStatusBadgeProps {
  status: JobStatus;
  /** Default sm; use md in dense tables for readability */
  size?: 'sm' | 'md';
}

export function JobStatusBadge({ status, size = 'sm' }: JobStatusBadgeProps) {
  const getVariant = (): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray' => {
    switch (status) {
      case 'new':
        return 'info';
      case 'inspected':
        return 'info';
      case 'pending_approval':
        return 'warning';
      case 'quote_sent':
        return 'warning';
      case 'approved':
        return 'success';
      case 'disapproved':
        return 'danger';
      case 'spare_parts_pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'gray';
      default:
        return 'default';
    }
  };

  return (
    <Badge variant={getVariant()} size={size}>
      {JOB_STATUS_LABELS[status]}
    </Badge>
  );
}

'use client';

import { Badge } from '@/components/ui/Badge';
import { JobPriority, JOB_PRIORITY_LABELS } from '@/types/enums';

interface JobPriorityBadgeProps {
  priority: JobPriority;
}

export function JobPriorityBadge({ priority }: JobPriorityBadgeProps) {
  const getVariant = (): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray' => {
    switch (priority) {
      case 'immediate':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'gray';
      default:
        return 'default';
    }
  };

  return (
    <Badge variant={getVariant()}>
      {JOB_PRIORITY_LABELS[priority]}
    </Badge>
  );
}

export type UserRole = 'super_admin' | 'service_manager' | 'service_incharge' | 'technician';

export type JobStatus = 
  | 'new' 
  | 'inspected' 
  | 'pending_approval' 
  | 'quote_sent' 
  | 'approved' 
  | 'disapproved' 
  | 'spare_parts_pending' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export type JobPriority = 'immediate' | 'high' | 'medium' | 'low';

export type ProductCondition = 'good' | 'dusty' | 'scratches' | 'damage' | 'not_working' | 'dead';

export const JOB_STATUS_ORDER: JobStatus[] = [
  'new',
  'inspected',
  'pending_approval',
  'quote_sent',
  'approved',
  'spare_parts_pending',
  'in_progress',
  'completed',
];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  new: 'New',
  inspected: 'Inspected',
  pending_approval: 'Pending Approval',
  quote_sent: 'Quote Sent',
  approved: 'Approved',
  disapproved: 'Disapproved',
  spare_parts_pending: 'Spare Parts Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const JOB_PRIORITY_LABELS: Record<JobPriority, string> = {
  immediate: 'Immediate',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const PRODUCT_CONDITION_LABELS: Record<ProductCondition, string> = {
  good: 'Good',
  dusty: 'Dusty',
  scratches: 'Scratches',
  damage: 'Damage',
  not_working: 'Not Working',
  dead: 'Dead',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  service_manager: 'Service Manager',
  service_incharge: 'Service Incharge',
  technician: 'Technician',
};

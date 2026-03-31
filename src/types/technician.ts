import { Profile } from './user';

export interface Technician extends Profile {
  assigned_jobs_count?: number;
  completed_jobs_count?: number;
}

export interface TechnicianPerformance {
  technician_id: string;
  technician_name: string;
  total_jobs: number;
  completed_jobs: number;
  in_progress_jobs: number;
  average_completion_time_hours: number | null;
}

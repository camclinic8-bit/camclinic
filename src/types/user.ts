import { UserRole } from './enums';

export interface Profile {
  id: string;
  shop_id: string | null;
  branch_id: string | null;
  full_name: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileWithBranch extends Profile {
  branch?: {
    id: string;
    name: string;
  } | null;
}

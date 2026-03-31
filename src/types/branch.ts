export interface Shop {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  shop_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BranchWithShop extends Branch {
  shop?: Shop | null;
}

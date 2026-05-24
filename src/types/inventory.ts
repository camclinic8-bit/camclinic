export interface Accessory {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Model {
  id: string;
  brand_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  brand?: Brand;
}

export interface AccessoryInput {
  name: string;
}

export interface BrandInput {
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface ModelInput {
  brand_id: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
}

/**
 * Inventory API - Centralized Inventory Operations
 * 
 * All inventory-related database operations (accessories, brands, models) 
 * should go through this module.
 */

import { getClient } from '@/lib/supabase/singleton';
import { handleSupabaseError, NotFoundError } from '@/lib/errors';
import type { Accessory, Brand, Model, AccessoryInput, BrandInput, ModelInput } from '@/types/inventory';

// ─── Accessories ─────────────────────────────────────────────────────────────

export async function getAccessories(): Promise<Accessory[]> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('accessories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw handleSupabaseError(error);
    return (data as Accessory[]) || [];
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

export async function getAccessoryById(id: string): Promise<Accessory> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('accessories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Accessory with ID ${id} not found`);
      }
      throw handleSupabaseError(error);
    }

    return data as Accessory;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

export async function createAccessory(input: AccessoryInput): Promise<Accessory> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('accessories')
      .insert(input as any)
      .select()
      .single();

    if (error) throw handleSupabaseError(error);
    return data as Accessory;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

export async function updateAccessory(id: string, input: Partial<AccessoryInput>): Promise<Accessory> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('accessories')
      .update(input as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Accessory with ID ${id} not found`);
      }
      throw handleSupabaseError(error);
    }

    return data as Accessory;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

export async function deleteAccessory(id: string): Promise<void> {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from('accessories')
      .delete()
      .eq('id', id);

    if (error) throw handleSupabaseError(error);
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// ─── Brands ─────────────────────────────────────────────────────────────────

export async function getBrands(): Promise<Brand[]> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw handleSupabaseError(error);
    return (data as Brand[]) || [];
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

export async function getBrandById(id: string): Promise<Brand> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Brand with ID ${id} not found`);
      }
      throw handleSupabaseError(error);
    }

    return data as Brand;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

export async function createBrand(input: BrandInput): Promise<Brand> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('brands')
      .insert(input as any)
      .select()
      .single();

    if (error) throw handleSupabaseError(error);
    return data as Brand;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

export async function updateBrand(id: string, input: Partial<BrandInput>): Promise<Brand> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('brands')
      .update(input as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Brand with ID ${id} not found`);
      }
      throw handleSupabaseError(error);
    }

    return data as Brand;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

export async function deleteBrand(id: string): Promise<void> {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', id);

    if (error) throw handleSupabaseError(error);
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

// ─── Models ─────────────────────────────────────────────────────────────────

export async function getModels(brandId?: string): Promise<Model[]> {
  try {
    const supabase = getClient();
    let query = supabase
      .from('models')
      .select('*, brand:brands(id, name)')
      .order('name', { ascending: true });

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    const { data, error } = await query;

    if (error) throw handleSupabaseError(error);
    return (data as Model[]) || [];
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

export async function getModelById(id: string): Promise<Model> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('models')
      .select('*, brand:brands(id, name)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Model with ID ${id} not found`);
      }
      throw handleSupabaseError(error);
    }

    return data as Model;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

export async function createModel(input: ModelInput): Promise<Model> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('models')
      .insert(input as any)
      .select('*, brand:brands(id, name)')
      .single();

    if (error) throw handleSupabaseError(error);
    return data as Model;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

export async function updateModel(id: string, input: Partial<ModelInput>): Promise<Model> {
  try {
    const supabase = getClient();
    const { data, error } = await supabase
      .from('models')
      .update(input as any)
      .eq('id', id)
      .select('*, brand:brands(id, name)')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError(`Model with ID ${id} not found`);
      }
      throw handleSupabaseError(error);
    }

    return data as Model;
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

export async function deleteModel(id: string): Promise<void> {
  try {
    const supabase = getClient();
    const { error } = await supabase
      .from('models')
      .delete()
      .eq('id', id);

    if (error) throw handleSupabaseError(error);
  } catch (error) {
    throw handleSupabaseError(error);
  }
}

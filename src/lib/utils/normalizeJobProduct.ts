/**
 * Normalize warranty fields for job_products inserts/updates.
 * React Hook Form can keep stale warranty_expiry_date (e.g. "") after the warranty
 * section is hidden, and native checkboxes may not submit reliable booleans.
 * Empty strings must not be sent for DATE columns.
 */

export type WarrantyInput = {
  has_warranty?: boolean | string | null | undefined;
  warranty_description?: string | null | undefined;
  warranty_expiry_date?: string | null | undefined;
};

export function coerceHasWarranty(value: unknown): boolean {
  return value === true || value === 'true' || value === 'on';
}

export function normalizeJobProductWarrantyForDb<T extends WarrantyInput>(
  p: T
): T & {
  has_warranty: boolean;
  warranty_description: string | null;
  warranty_expiry_date: string | null;
} {
  const hasWarranty = coerceHasWarranty(p.has_warranty);
  const dateTrim = (p.warranty_expiry_date ?? '').toString().trim();
  return {
    ...p,
    has_warranty: hasWarranty,
    warranty_description: hasWarranty ? (p.warranty_description?.trim() || null) : null,
    warranty_expiry_date: hasWarranty && dateTrim.length > 0 ? dateTrim : null,
  };
}

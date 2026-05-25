/** Format and truncate product names for job list / cards. */

export type ProductLike = {
  brand?: string | null;
  model?: string | null;
};

export function formatProductName(p: ProductLike): string {
  const s = [p.brand, p.model].filter(Boolean).join(' ').trim();
  return s || 'Product';
}

export function truncateChars(text: string, max: number): string {
  if (max <= 0) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

/**
 * Build a comma-separated summary; each product label capped, whole line capped.
 * Use `full` for tooltips (title).
 */
export function summarizeJobProductsLine(
  products: ProductLike[] | undefined | null,
  opts?: { maxEach?: number; maxLine?: number }
): { line: string; full: string } {
  const maxEach = opts?.maxEach ?? 40;
  const maxLine = opts?.maxLine ?? 100;
  if (!products?.length) {
    return { line: '—', full: '' };
  }
  const parts = products.map((p) => truncateChars(formatProductName(p), maxEach));
  const full = parts.join(', ');
  return { line: truncateChars(full, maxLine), full };
}

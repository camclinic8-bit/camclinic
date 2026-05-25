import { z } from 'zod';

/** Optional text/select values: RHF often sends `undefined` or `null` when fields unregister. */
export const optionalStr = z.string().nullish();

/**
 * ChipInput / API data: accessory or part names must all be strings; legacy rows can have null names.
 */
export const chipStringArray = z.preprocess((val: unknown) => {
  if (!Array.isArray(val)) return [];
  return val
    .map((x) => (typeof x === 'string' ? x.trim() : typeof x === 'number' ? String(x) : ''))
    .filter((s) => s.length > 0);
}, z.array(z.string()).default([]));

/**
 * react-hook-form `valueAsNumber: true` yields NaN when the input is empty.
 * Optional fee/charge fields must treat NaN as "not provided".
 */
export const optionalNonNegativeNumber = z
  .union([z.nan(), z.number()])
  .optional()
  .transform((v) =>
    v === undefined || (typeof v === 'number' && Number.isNaN(v)) ? undefined : v
  )
  .pipe(z.number().min(0).optional());

/** Date inputs; empty is often "" but can be undefined/null after conditional fields unregister. */
export const optionalDateInput = z.string().nullish();

/**
 * Empty or NaN → 0; always a number (edit job totals / billing fields).
 */
export const nonNegativeNumberOrZero = z
  .union([z.nan(), z.number()])
  .transform((v) => (typeof v === 'number' && Number.isNaN(v) ? 0 : v))
  .pipe(z.number().min(0));

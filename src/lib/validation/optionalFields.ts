import { z } from 'zod';

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

/** Dates are optional strings in the form; normalize empty → null in submit / DB layer. */
export const optionalDateInput = z.string().optional();

/**
 * Empty or NaN → 0; always a number (edit job totals / billing fields).
 */
export const nonNegativeNumberOrZero = z
  .union([z.nan(), z.number()])
  .transform((v) => (typeof v === 'number' && Number.isNaN(v) ? 0 : v))
  .pipe(z.number().min(0));

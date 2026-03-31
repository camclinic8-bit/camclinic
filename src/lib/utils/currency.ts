/**
 * Format a number as Indian Rupees (INR)
 * Uses Indian number formatting (lakhs, crores)
 * Example: 123456.78 -> ₹1,23,456.78
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as Indian Rupees without decimal places
 * Example: 123456 -> ₹1,23,456
 */
export function formatINRWhole(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Parse a currency string back to number
 * Removes ₹ symbol and commas
 */
export function parseINR(value: string): number {
  const cleaned = value.replace(/[₹,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

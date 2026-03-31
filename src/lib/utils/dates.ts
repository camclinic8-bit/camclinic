import { format, parseISO, isAfter, isBefore, isToday, addDays } from 'date-fns';

/**
 * Format a date string to "01 Apr 2026" format
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd MMM yyyy');
}

/**
 * Format a date string to "01 Apr 2026, 10:30 AM" format
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd MMM yyyy, hh:mm a');
}

/**
 * Format a date for input fields (YYYY-MM-DD)
 */
export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy-MM-dd');
}

/**
 * Check if a date has expired (is before today)
 */
export function isExpired(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return isBefore(dateObj, today);
}

/**
 * Check if a date is today
 */
export function isDateToday(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isToday(dateObj);
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return isAfter(dateObj, today);
}

/**
 * Get relative date description
 */
export function getRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (isToday(dateObj)) return 'Today';
  
  const tomorrow = addDays(new Date(), 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dateOnly = new Date(dateObj);
  dateOnly.setHours(0, 0, 0, 0);
  
  if (dateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow';
  
  return formatDate(dateObj);
}

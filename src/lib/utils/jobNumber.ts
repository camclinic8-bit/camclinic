import { format } from 'date-fns';

/**
 * Generate a job number in format: CC-YYYYMMDD-XXXX
 * Example: CC-20260401-0001
 * 
 * @param sequence - The sequence number for the day (1-9999)
 * @param date - Optional date, defaults to current date
 */
export function generateJobNumber(sequence: number, date?: Date): string {
  const dateToUse = date || new Date();
  const dateStr = format(dateToUse, 'yyyyMMdd');
  const sequenceStr = sequence.toString().padStart(4, '0');
  return `CC-${dateStr}-${sequenceStr}`;
}

/**
 * Parse a job number to extract date and sequence
 * Returns null if invalid format
 */
export function parseJobNumber(jobNumber: string): { date: Date; sequence: number } | null {
  const match = jobNumber.match(/^CC-(\d{8})-(\d{4})$/);
  if (!match) return null;
  
  const [, dateStr, sequenceStr] = match;
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  
  return {
    date: new Date(year, month, day),
    sequence: parseInt(sequenceStr),
  };
}

/**
 * Validate job number format
 */
export function isValidJobNumber(jobNumber: string): boolean {
  return /^CC-\d{8}-\d{4}$/.test(jobNumber);
}

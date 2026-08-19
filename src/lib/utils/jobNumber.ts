/**
 * Job numbers use a global sequential counter: CC-00001, CC-00002, ...
 * The counter is 5 digits (zero-padded) and widens to 6 digits (CC-100000)
 * only after the 5-digit space (99999) is exhausted.
 *
 * The authoritative generator is the DB RPC `get_next_job_number`
 * (see supabase/migrations/034_sequential_job_numbers.sql). These helpers
 * mirror that format for client-side use.
 */

/** Minimum digits used for the sequence part of a job number. */
export const JOB_NUMBER_MIN_DIGITS = 5;

/**
 * Format a sequence number as a job number: CC-NNNNN
 * Example: generateJobNumber(1) -> "CC-00001", generateJobNumber(100000) -> "CC-100000"
 */
export function generateJobNumber(sequence: number): string {
  return `CC-${String(sequence).padStart(JOB_NUMBER_MIN_DIGITS, '0')}`;
}

/**
 * Parse a job number to extract its sequence.
 * Returns null if invalid format.
 */
export function parseJobNumber(jobNumber: string): { sequence: number } | null {
  const match = jobNumber.match(/^CC-(\d+)$/);
  if (!match) return null;
  return { sequence: parseInt(match[1], 10) };
}

/**
 * Validate job number format: CC- followed by 5+ digits
 */
export function isValidJobNumber(jobNumber: string): boolean {
  return /^CC-\d{5,}$/.test(jobNumber);
}

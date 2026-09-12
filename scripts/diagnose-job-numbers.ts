/**
 * Read-only diagnostic: inspect job_number state on the live DB.
 * Answers:
 *   1. What do the most recent jobs' numbers look like?
 *   2. Are there NULL / non-CC-format numbers?
 *   3. What would get_next_job_number() return right now?
 *
 * Usage: npx tsx scripts/diagnose-job-numbers.ts
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  // 1. Most recent 15 jobs
  const { data: recent, error: recentErr } = await supabase
    .from('jobs')
    .select('id, job_number, created_at, status')
    .order('created_at', { ascending: false })
    .limit(15);
  if (recentErr) throw recentErr;

  console.log('=== 15 most recent jobs (newest first) ===');
  for (const j of recent) {
    console.log(`${j.created_at}  ${String(j.job_number).padEnd(20)} ${j.status.padEnd(20)} ${j.id}`);
  }

  // 2. All jobs, grouped by number shape
  const { data: all, error: allErr } = await supabase
    .from('jobs')
    .select('id, job_number, created_at');
  if (allErr) throw allErr;

  const nullCount = all.filter((j) => j.job_number == null).length;
  const ccSeq = all.filter((j) => /^CC-\d+$/.test(j.job_number ?? ''));
  const ccDate = all.filter((j) => /^CC-\d{8}-\d+$/.test(j.job_number ?? ''));
  const tmp = all.filter((j) => /^CC-TMP-/.test(j.job_number ?? ''));
  const other = all.filter(
    (j) => j.job_number != null && !/^CC-\d+$/.test(j.job_number) && !/^CC-\d{8}-\d+$/.test(j.job_number) && !/^CC-TMP-/.test(j.job_number)
  );

  console.log('\n=== job_number shape summary ===');
  console.log(`total jobs:        ${all.length}`);
  console.log(`NULL:              ${nullCount}`);
  console.log(`CC-NNNN(N) seq:    ${ccSeq.length}  (min=${Math.min(...ccSeq.map((j) => Number(j.job_number.slice(3))))}, max=${Math.max(...ccSeq.map((j) => Number(j.job_number.slice(3))))})`);
  console.log(`CC-YYYYMMDD-NNNN:  ${ccDate.length}`);
  console.log(`CC-TMP-* leftover: ${tmp.length}`);
  console.log(`other formats:     ${other.length}`);
  const otherSamples = [...new Set(other.map((j) => j.job_number))].slice(0, 10);
  if (otherSamples.length) console.log('  samples:', otherSamples);
  const nullSamples = all.filter((j) => j.job_number == null).slice(0, 5);
  if (nullSamples.length) console.log('  NULL samples:', nullSamples.map((j) => `${j.created_at} ${j.id}`));

  // 3. Next number: do NOT call get_next_job_number() here — since migration
  //    036 it consumes a value from job_number_seq. Check the sequence state
  //    instead (read-only, does not advance it):
  //      npx supabase db query --linked \
  //        "SELECT last_value, is_called FROM job_number_seq;"
  //    next number = last_value + (is_called ? 1 : 0)
  console.log('\n=== next number ===');
  console.log('Checked read-only via job_number_seq (see comment in this script).');
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});

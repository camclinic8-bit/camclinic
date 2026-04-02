/**
 * Bulk demo seed: 120+ jobs with products, accessories, spare parts, payments, users.
 * Uses Supabase service role (bypasses RLS). Loads .env.local from project root.
 *
 * Usage: npm run seed:demo
 *        npm run seed:demo -- --clean   # remove prior CC-SEED-* jobs first
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const SEED_PREFIX = 'CC-SEED';
const JOB_COUNT = 120;
const NEW_USERS = 24;

type JobStatus =
  | 'new'
  | 'inspected'
  | 'pending_approval'
  | 'quote_sent'
  | 'approved'
  | 'disapproved'
  | 'spare_parts_pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

type JobPriority = 'immediate' | 'high' | 'medium' | 'low';
type ProductCondition = 'good' | 'dusty' | 'scratches' | 'damage' | 'not_working' | 'dead';
type UserRole = 'super_admin' | 'service_manager' | 'service_incharge' | 'technician';

const ALL_STATUSES: JobStatus[] = [
  'new',
  'inspected',
  'pending_approval',
  'quote_sent',
  'approved',
  'disapproved',
  'spare_parts_pending',
  'in_progress',
  'completed',
  'cancelled',
];

const PRIORITIES: JobPriority[] = ['immediate', 'high', 'medium', 'low'];
const CONDITIONS: ProductCondition[] = [
  'good',
  'dusty',
  'scratches',
  'damage',
  'not_working',
  'dead',
];

const GEAR: { brand: string; model: string; typicalSerial: (i: number) => string }[] = [
  { brand: 'Sony', model: 'Alpha 7 IV (ILCE-7M4)', typicalSerial: (i) => `SONY-A7M4-${100000 + i}` },
  { brand: 'Sony', model: 'FX3 Cinema Line', typicalSerial: (i) => `SONY-FX3-${200000 + i}` },
  { brand: 'Canon', model: 'EOS R6 Mark II', typicalSerial: (i) => `CAN-R62-${300000 + i}` },
  { brand: 'Canon', model: 'EOS C70', typicalSerial: (i) => `CAN-C70-${400000 + i}` },
  { brand: 'Nikon', model: 'Z8', typicalSerial: (i) => `NIK-Z8-${500000 + i}` },
  { brand: 'Nikon', model: 'Z6 III', typicalSerial: (i) => `NIK-Z63-${600000 + i}` },
  { brand: 'Fujifilm', model: 'X-T5', typicalSerial: (i) => `FUJ-XT5-${700000 + i}` },
  { brand: 'Panasonic', model: 'Lumix GH6', typicalSerial: (i) => `PAN-GH6-${800000 + i}` },
  { brand: 'DJI', model: 'Ronin RS3 Pro', typicalSerial: (i) => `DJI-RS3P-${900000 + i}` },
  { brand: 'DJI', model: 'Mini 4 Pro', typicalSerial: (i) => `DJI-M4P-${110000 + i}` },
  { brand: 'GoPro', model: 'HERO12 Black', typicalSerial: (i) => `GOP-H12-${120000 + i}` },
  { brand: 'Blackmagic', model: 'Pocket Cinema Camera 6K', typicalSerial: (i) => `BMD-6K-${130000 + i}` },
  { brand: 'Sigma', model: '24-70mm F2.8 DG DN Art', typicalSerial: (i) => `SIG-2470-${140000 + i}` },
  { brand: 'Tamron', model: '70-180mm F2.8 Di III VXD', typicalSerial: (i) => `TAM-7180-${150000 + i}` },
];

const ACCESSORY_POOL = [
  'NP-FZ100 battery',
  'Original charger + USB-C cable',
  'Body cap',
  'Rear lens cap',
  'Neck strap',
  'SanDisk Extreme Pro 256GB CFexpress',
  'Sony TOUGH SD 128GB',
  'Lens hood',
  'UV filter 82mm',
  'Polarizing filter 77mm',
  'Soft carrying case',
  'Hot shoe cover',
  'Eyecup',
  'Remote shutter cable',
];

const OTHER_PARTS_POOL = [
  'Shutter mechanism assembly',
  'Main PCB',
  'LCD flex cable',
  'Top cover plastic',
  'Rubber grip replacement',
  'Sensor cleaning + calibration',
  'Bayonet mount repair',
  'Flash capacitor module',
  'Viewfinder optics',
  'Weather seal kit',
];

const SPARE_CATALOG: { name: string; unit: number }[] = [
  { name: 'Sony NP-FZ100 genuine battery', unit: 5200 },
  { name: 'Canon LP-E6NH battery', unit: 4800 },
  { name: 'Nikon EN-EL15c battery', unit: 4600 },
  { name: 'Sensor cleaning service (full frame)', unit: 1500 },
  { name: 'LCD assembly (OEM)', unit: 12500 },
  { name: 'Shutter unit OEM', unit: 8900 },
  { name: 'Main board repair / rework', unit: 6500 },
  { name: 'Lens mount ring', unit: 3200 },
  { name: 'Rubber grip set', unit: 1800 },
  { name: 'Focus motor (third-party)', unit: 4200 },
  { name: 'Gimbal motor module DJI', unit: 9800 },
  { name: 'Drone arm replacement', unit: 7200 },
];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)]!;
}

function pad(n: number, w: number) {
  return String(n).padStart(w, '0');
}

async function cleanSeedJobs(supabase: SupabaseClient) {
  const { data: rows } = await supabase
    .from('jobs')
    .select('id')
    .like('job_number', `${SEED_PREFIX}-%`);
  if (!rows?.length) {
    console.log('No previous seed jobs to remove.');
    return;
  }
  const ids = rows.map((r) => r.id);
  const { error } = await supabase.from('jobs').delete().in('id', ids);
  if (error) throw error;
  console.log(`Removed ${ids.length} previous seed jobs (cascade).`);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const doClean = args.includes('--clean');

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (doClean) {
    await cleanSeedJobs(supabase);
  }

  const { data: seedExists } = await supabase
    .from('jobs')
    .select('id')
    .eq('job_number', `${SEED_PREFIX}-00001`)
    .maybeSingle();
  if (seedExists && !doClean) {
    console.error(
      'Seed jobs already exist (e.g. CC-SEED-00001). Re-run with --clean to remove them first, or delete CC-SEED-* jobs in SQL.'
    );
    process.exit(1);
  }

  const { data: shop, error: shopErr } = await supabase.from('shops').select('id, name').limit(1).maybeSingle();
  if (shopErr || !shop) {
    console.error('No shop found. Create a shop first.');
    process.exit(1);
  }

  const { data: branches, error: brErr } = await supabase
    .from('branches')
    .select('id, name')
    .eq('shop_id', shop.id)
    .eq('is_active', true);
  if (brErr || !branches?.length) {
    console.error('No active branches for shop.');
    process.exit(1);
  }

  const { data: existingProfiles, error: prErr } = await supabase
    .from('profiles')
    .select('id, full_name, role, branch_id, email')
    .eq('shop_id', shop.id)
    .eq('is_active', true);
  if (prErr || !existingProfiles?.length) {
    console.error('No profiles in shop.');
    process.exit(1);
  }

  const creator =
    existingProfiles.find((p) => p.role === 'super_admin') ?? existingProfiles[0]!;

  console.log(`Shop: ${shop.name} (${shop.id})`);
  console.log(`Branches: ${branches.map((b) => b.name).join(', ')}`);
  console.log(`Creator profile: ${creator.full_name} (${creator.role})`);

  const DEMO_PASSWORD = 'DemoSeed2026!';

  for (let u = 0; u < NEW_USERS; u++) {
    const email = `seed.user.${pad(u + 1, 3)}@camclinic.seed`;
    const roles: UserRole[] = [
      'technician',
      'technician',
      'technician',
      'technician',
      'technician',
      'service_incharge',
      'service_incharge',
      'service_manager',
    ];
    const role = roles[u % roles.length]!;
    const branch = branches[u % branches.length]!;
    const fullName = [
      'Arjun Mehta',
      'Priya Sharma',
      'Rahul Verma',
      'Sneha Iyer',
      'Vikram Singh',
      'Ananya Rao',
      'Karthik Nair',
      'Divya Menon',
      'Rohan Kapoor',
      'Neha Joshi',
      'Aditya Pillai',
      'Meera Krishnan',
      'Suresh Patil',
      'Kavita Desai',
      'Manoj Reddy',
      'Pooja Agarwal',
      'Nikhil Bhat',
      'Swati Ghosh',
      'Deepak Saxena',
      'Ritu Malhotra',
      'Gaurav Sinha',
      'Anjali Bose',
      'Harish Kulkarni',
      'Fatima Sheikh',
    ][u]!;

    const { data: existing } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
    if (existing?.id) {
      await supabase
        .from('profiles')
        .update({
          shop_id: shop.id,
          branch_id: branch.id,
          role,
          full_name: fullName,
          is_active: true,
        })
        .eq('id', existing.id);
      continue;
    }

    const { data: authData, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createErr || !authData.user) {
      console.warn(`Skip create ${email}:`, createErr?.message);
      continue;
    }

    const uid = authData.user.id;
    const { error: upErr } = await supabase.from('profiles').upsert(
      {
        id: uid,
        shop_id: shop.id,
        branch_id: branch.id,
        full_name: fullName,
        email,
        role,
        is_active: true,
      },
      { onConflict: 'id' }
    );
    if (upErr) {
      console.warn(`Profile upsert failed for ${email}:`, upErr.message);
      continue;
    }
  }
  console.log(`Finished seed user batch (password for new accounts: ${DEMO_PASSWORD}).`);

  const { data: allTech } = await supabase
    .from('profiles')
    .select('id, full_name, role, branch_id')
    .eq('shop_id', shop.id)
    .eq('role', 'technician')
    .eq('is_active', true);
  const { data: allIncharge } = await supabase
    .from('profiles')
    .select('id, full_name, role, branch_id')
    .eq('shop_id', shop.id)
    .eq('role', 'service_incharge')
    .eq('is_active', true);

  const technicians = (allTech ?? []).map((p) => p.id);
  const incharges = (allIncharge ?? []).map((p) => p.id);

  if (!technicians.length) {
    console.error('Need at least one technician profile after seed users.');
    process.exit(1);
  }

  const { data: existingCustomerPool } = await supabase
    .from('customers')
    .select('id')
    .eq('shop_id', shop.id)
    .limit(400);

  let customerIds: string[];
  let customersInsertedThisRun = 0;
  if (existingCustomerPool && existingCustomerPool.length >= JOB_COUNT + 10) {
    customerIds = existingCustomerPool.map((c) => c.id);
    console.log(`Reusing ${customerIds.length} existing customers in shop.`);
  } else {
    const customersToInsert = Array.from({ length: JOB_COUNT + 20 }, (_, i) => ({
      shop_id: shop.id,
      name: [
        'Retail Photo Studio',
        'Wedding Films Co',
        'DroneWorx India',
        'City News Network',
        'Freelance — Amit K',
        'Corporate AV Solutions',
        'Wildlife Tours LLP',
        'Sports Broadcast Ltd',
        'Real Estate 360',
        'YouTube Creator Hub',
      ][i % 10]! + ` #${i + 1}`,
      phone: `+9198${pad(10000000 + i, 8)}`,
      email: i % 4 === 0 ? `customer.${i}@example.com` : null,
      address:
        i % 3 === 0
          ? `${100 + (i % 50)} MG Road, Bengaluru, KA 560001`
          : i % 3 === 1
            ? `Plot ${i % 200}, Hitech City, Hyderabad`
            : null,
    }));

    const { data: insertedCustomers, error: custErr } = await supabase
      .from('customers')
      .insert(customersToInsert)
      .select('id');
    if (custErr || !insertedCustomers) {
      console.error('Customer insert failed:', custErr?.message);
      process.exit(1);
    }
    customerIds = insertedCustomers.map((c) => c.id);
    customersInsertedThisRun = customerIds.length;
    console.log(`Inserted ${customerIds.length} new customers.`);
  }

  console.log(`Creating ${JOB_COUNT} seed jobs (batched inserts per job)...`);

  let created = 0;
  for (let i = 0; i < JOB_COUNT; i++) {
    const rnd = mulberry32(10007 * (i + 1) + 1337);
    const branchA = branches[i % branches.length]!;
    const branchB = branches[(i + 1 + (i % 3)) % branches.length]!;
    const status = ALL_STATUSES[(i * 11 + 7) % ALL_STATUSES.length]!;
    const priority = PRIORITIES[(i * 3) % PRIORITIES.length]!;
    const techId = technicians[i % technicians.length]!;
    const inchargeId =
      incharges.length > 0 ? incharges[(i + (status === 'completed' ? 0 : 2)) % incharges.length]! : null;

    const productCount = 1 + (i % 4);
    const gstEnabled = i % 5 !== 0;
    const inspection = Math.round((200 + rnd() * 1800) * 100) / 100;
    const serviceCharge = Math.round((500 + rnd() * 12000) * 100) / 100;

    const spareLines: { name: string; quantity: number; unit_price: number }[] = [];
    const spareN = (i % 5) + (status === 'spare_parts_pending' || status === 'in_progress' ? 2 : 0);
    for (let s = 0; s < Math.min(spareN, 6); s++) {
      const cat = SPARE_CATALOG[(i + s) % SPARE_CATALOG.length]!;
      spareLines.push({
        name: `${cat.name}${s > 0 ? ` (line ${s + 1})` : ''}`,
        quantity: 1 + (s % 3),
        unit_price: Math.round(cat.unit * (0.9 + rnd() * 0.2) * 100) / 100,
      });
    }

    const spareSum = spareLines.reduce((a, l) => a + l.quantity * l.unit_price, 0);
    const gstAmount = gstEnabled ? Math.round(serviceCharge * 0.18 * 100) / 100 : 0;
    const grandTotal = Math.round((inspection + serviceCharge + spareSum + gstAmount) * 100) / 100;

    let paymentMode = i % 7;
    if (paymentMode === 0 || paymentMode === 1) {
      paymentMode = 0;
    } else if (paymentMode <= 4) {
      paymentMode = 1;
    } else {
      paymentMode = 2;
    }
    let advance = 0;
    if (paymentMode === 0) advance = grandTotal;
    else if (paymentMode === 1) advance = Math.round(grandTotal * (0.25 + rnd() * 0.55) * 100) / 100;
    else advance = Math.round(rnd() * Math.min(500, grandTotal * 0.15) * 100) / 100;

    const jobNumber = `${SEED_PREFIX}-${pad(i + 1, 5)}`;
    const createdAt = new Date(Date.now() - (i % 95) * 86400000 - rnd() * 86400000).toISOString();

    const jobRow = {
      shop_id: shop.id,
      job_number: jobNumber,
      customer_id: customerIds[i % customerIds.length]!,
      service_branch_id: branchA.id,
      delivery_branch_id: branchB.id,
      assigned_incharge_id: inchargeId,
      assigned_technician_id: ['cancelled', 'disapproved'].includes(status) ? null : techId,
      status,
      priority,
      description: `Demo job #${i + 1}: ${status.replace(/_/g, ' ')} — ${pick(GEAR, rnd).brand} service bundle. Scenario seed index ${i}.`,
      technician_notes:
        status === 'in_progress' || status === 'completed'
          ? `Bench check done. ${pick(['AF fine', 'IBIS OK', 'Overheat test pass', 'Firmware v2.01'], rnd)}.`
          : null,
      cam_clinic_advisory_notes:
        i % 6 === 0 ? 'Recommend sensor clean + calibration before return.' : null,
      inspection_fee: inspection,
      service_charges: serviceCharge,
      advance_paid: 0,
      advance_paid_date:
        advance > 0 ? new Date(Date.now() - (i % 30) * 86400000).toISOString().slice(0, 10) : null,
      gst_enabled: gstEnabled,
      estimate_delivery_date: new Date(Date.now() + (10 + (i % 20)) * 86400000).toISOString().slice(0, 10),
      service_date:
        status === 'completed'
          ? new Date(Date.now() - (i % 14) * 86400000).toISOString()
          : null,
      created_by: creator.id,
      created_at: createdAt,
    };

    const { data: job, error: jobErr } = await supabase.from('jobs').insert(jobRow).select('id').single();
    if (jobErr || !job) {
      console.error(`Job ${jobNumber} failed:`, jobErr?.message);
      continue;
    }
    const jobId = job.id;

    const productRows = Array.from({ length: productCount }, (_, p) => {
      const g = GEAR[(i + p) % GEAR.length]!;
      const cond = CONDITIONS[(i + p * 2) % CONDITIONS.length]!;
      return {
        job_id: jobId,
        brand: g.brand,
        model: g.model,
        serial_number: g.typicalSerial(i * 10 + p),
        condition: cond,
        description: `Unit ${p + 1}: ${g.model} — intake inspection notes.`,
        remarks:
          p === 0
            ? 'Customer reports intermittent AF in low light.'
            : 'Secondary body / lens — checked for fungus.',
        has_warranty: (i + p) % 3 === 0,
        warranty_description: (i + p) % 3 === 0 ? 'Sony India 2Y warranty — valid' : null,
        warranty_expiry_date:
          (i + p) % 3 === 0
            ? new Date(Date.now() + 400 * 86400000).toISOString().slice(0, 10)
            : null,
      };
    });

    const { data: insertedProducts, error: jpErr } = await supabase
      .from('job_products')
      .insert(productRows)
      .select('id');
    if (jpErr || !insertedProducts?.length) {
      console.error(`Job ${jobNumber} products failed:`, jpErr?.message);
      continue;
    }

    const accessoryRows: { job_product_id: string; name: string }[] = [];
    const otherPartRows: { job_product_id: string; name: string }[] = [];
    insertedProducts.forEach((jpRow, p) => {
      const jpid = jpRow.id;
      const accCount = (i + p) % 5;
      for (let a = 0; a < accCount; a++) {
        accessoryRows.push({
          job_product_id: jpid,
          name: ACCESSORY_POOL[(i + p + a) % ACCESSORY_POOL.length]!,
        });
      }
      const partCount = (i + p + 1) % 4;
      for (let o = 0; o < partCount; o++) {
        otherPartRows.push({
          job_product_id: jpid,
          name: OTHER_PARTS_POOL[(i + p + o) % OTHER_PARTS_POOL.length]!,
        });
      }
    });

    if (accessoryRows.length) {
      const { error: aErr } = await supabase.from('product_accessories').insert(accessoryRows);
      if (aErr) console.error(`Accessories for ${jobNumber}:`, aErr.message);
    }
    if (otherPartRows.length) {
      const { error: oErr } = await supabase.from('product_other_parts').insert(otherPartRows);
      if (oErr) console.error(`Other parts for ${jobNumber}:`, oErr.message);
    }

    if (spareLines.length) {
      const { error: spErr } = await supabase.from('spare_parts').insert(
        spareLines.map((line) => ({
          job_id: jobId,
          name: line.name,
          quantity: line.quantity,
          unit_price: line.unit_price,
        }))
      );
      if (spErr) console.error(`Spare parts for ${jobNumber}:`, spErr.message);
    }

    await supabase
      .from('jobs')
      .update({
        inspection_fee: inspection,
        service_charges: serviceCharge,
        gst_enabled: gstEnabled,
        advance_paid: advance,
        advance_paid_date: jobRow.advance_paid_date,
      })
      .eq('id', jobId);

    const historyRows: {
      job_id: string;
      from_status: JobStatus | null;
      to_status: JobStatus;
      changed_by: string;
      notes: string | null;
      created_at?: string;
    }[] = [
      {
        job_id: jobId,
        from_status: null,
        to_status: 'new',
        changed_by: creator.id,
        notes: 'Job created (seed)',
        created_at: createdAt,
      },
    ];
    if (status !== 'new') {
      historyRows.push({
        job_id: jobId,
        from_status: 'new',
        to_status: status,
        changed_by: creator.id,
        notes: `Seeded transition to ${status}`,
      });
    }
    await supabase.from('job_status_history').insert(historyRows);

    created++;
    if ((i + 1) % 30 === 0) {
      console.log(`  … ${i + 1} / ${JOB_COUNT} jobs`);
    }
  }

  const { count: jobCount } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .like('job_number', `${SEED_PREFIX}-%`);

  console.log('\n--- Seed summary ---');
  console.log(`New auth users attempted: ${NEW_USERS} (password for new: ${DEMO_PASSWORD})`);
  console.log(`Technicians available: ${technicians.length}`);
  console.log(`Service incharges: ${incharges.length}`);
  console.log(
    `Customers (new this run): ${customersInsertedThisRun}; pool size used: ${customerIds.length}`
  );
  console.log(`Jobs created this run: ${created}`);
  console.log(`Total CC-SEED jobs in DB: ${jobCount ?? '?'}`);
  console.log('Done. Open /jobs in the app to browse.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

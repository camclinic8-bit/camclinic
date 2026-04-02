import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import type { Profile } from '@/types/user';
import type { UserRole } from '@/types/enums';

type MeRow = { role: UserRole; shop_id: string | null };

/**
 * Team list with emails merged from Auth (profiles.email is often empty until migration/backfill).
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: meRaw, error: profileError } = await supabase
      .from('profiles')
      .select('role, shop_id')
      .eq('id', user.id)
      .single();

    const me = meRaw as MeRow | null;
    if (profileError || !me) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
    }

    let query = supabase.from('profiles').select('*').order('full_name');

    // Full shop roster: super admin and service manager (read-only team UI for SM; RLS scopes writes).
    if (me.role !== 'super_admin' && me.role !== 'service_manager') {
      query = supabase
        .from('profiles')
        .select('*')
        .in('role', ['technician', 'service_incharge', 'service_manager'])
        .eq('is_active', true)
        .order('full_name');
    }

    const { data: rows, error: listError } = await query;

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 400 });
    }

    const profiles = (rows || []) as Profile[];
    const needEmail = new Set(
      profiles.filter((p) => !p.email?.trim()).map((p) => p.id)
    );
    if (needEmail.size === 0) {
      return NextResponse.json(profiles);
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !serviceKey) {
      return NextResponse.json(profiles);
    }

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const emailById = new Map<string, string>();
    let page = 1;
    const perPage = 200;

    while (needEmail.size > 0 && page <= 100) {
      const { data, error } = await admin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error || !data?.users?.length) break;
      for (const u of data.users) {
        if (needEmail.has(u.id) && u.email) {
          emailById.set(u.id, u.email);
          needEmail.delete(u.id);
        }
      }
      if (data.users.length < perPage) break;
      page += 1;
    }

    const merged: Profile[] = profiles.map((p) => ({
      ...p,
      email: p.email?.trim() ? p.email : emailById.get(p.id) ?? p.email ?? null,
    }));

    return NextResponse.json(merged);
  } catch (e) {
    console.error('GET /api/team:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

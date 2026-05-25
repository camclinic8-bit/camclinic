import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import type { UserRole } from '@/types/enums';

type CreatorRow = { shop_id: string | null; role: UserRole };

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user: sessionUser },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: creatorRaw, error: creatorError } = await supabase
      .from('profiles')
      .select('shop_id, role')
      .eq('id', sessionUser.id)
      .single();

    const creator = creatorRaw as CreatorRow | null;
    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
    }

    if (creator.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can create users' },
        { status: 403 }
      );
    }

    const creatorShopId = creator.shop_id as string | null;
    if (!creatorShopId) {
      return NextResponse.json(
        { error: 'Your account has no shop assigned. Cannot create users.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, password, fullName, phone, role, branchId } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    const newUserId = authData.user.id;
    const resolvedRole = (role || 'technician') as UserRole;

    // Always attach new users to the creator's shop (RLS requires shop_id match for team list).
    // Upsert so the row exists even if the auth trigger ran late or failed partially.
    const { data: profileRow, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: newUserId,
          full_name: fullName,
          email,
          phone: phone || null,
          role: resolvedRole,
          branch_id: branchId || null,
          shop_id: creatorShopId,
          is_active: true,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      return NextResponse.json(
        { error: profileError.message || 'User was created but profile save failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: profileRow,
      user: {
        id: newUserId,
        email: authData.user.email,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

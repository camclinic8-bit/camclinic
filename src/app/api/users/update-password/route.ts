import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import type { UserRole } from '@/types/enums';

type ProfileRow = { shop_id: string | null; role: UserRole };

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

    const creator = creatorRaw as ProfileRow | null;
    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
    }

    if (creator.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only super admins can reset user passwords' },
        { status: 403 }
      );
    }

    const creatorShopId = creator.shop_id;
    if (!creatorShopId) {
      return NextResponse.json(
        { error: 'Your account has no shop assigned.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { userId, newPassword } = body;

    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'User ID and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
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

    const { data: targetRaw, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('shop_id')
      .eq('id', userId)
      .maybeSingle();

    const target = targetRaw as { shop_id: string | null } | null;
    if (targetError || !target || target.shop_id !== creatorShopId) {
      return NextResponse.json(
        { error: 'User not found or not in your shop' },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

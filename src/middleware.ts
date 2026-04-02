import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() (not getSession()) verifies the JWT server-side.
  // This is the only call that can be trusted for auth decisions.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    user = null;
  }

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/login';

  if (!user && !isLoginPage) {
    // Not authenticated — redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isLoginPage) {
    // Already authenticated — skip login page
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // User management moved to /technicians (Team)
  if (user && pathname.startsWith('/settings')) {
    const url = request.nextUrl.clone();
    url.pathname = '/technicians';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Only run on dashboard/app routes — skip static assets and Next.js internals
    '/dashboard/:path*',
    '/jobs/:path*',
    '/customers/:path*',
    '/technicians/:path*',
    '/branches/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/login',
  ],
};

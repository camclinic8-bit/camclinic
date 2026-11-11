import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Supabase stores session data across multiple chunked cookies (sb-*). Keep only those. */
const SUPABASE_COOKIE_PREFIX = 'sb-';

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  // Filter: only forward Supabase auth cookies to avoid HTTP 431 from large headers
  const filteredCookies = request.cookies
    .getAll()
    .filter((c) => c.name.startsWith(SUPABASE_COOKIE_PREFIX));

  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return filteredCookies;
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Local JWT verification (cached JWKS, ~1ms warm) — no auth-server round trip
  // per request. Also refreshes the session when the token is about to expire.
  let isAuthenticated = false;
  try {
    const { data } = await supabase.auth.getClaims();
    isAuthenticated = !!data?.claims;
  } catch {
    isAuthenticated = false;
  }

  // Fallback for cases local verification can't settle (cold isolate + JWKS
  // fetch failure, symmetric signing keys). getUser() refreshes expired tokens.
  if (!isAuthenticated) {
    try {
      const { data } = await supabase.auth.getUser();
      isAuthenticated = !!data?.user;
    } catch {
      isAuthenticated = false;
    }
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  const isNextInternal = request.nextUrl.pathname.startsWith('/_next');
  const isProtectedRoute = !isAuthRoute && !isApiRoute && !isNextInternal;

  // Any session cookies refreshed above must survive redirects, otherwise the
  // browser keeps stale tokens and re-refreshes (or loops) on the next request.
  const redirectWithCookies = (url: URL) => {
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });
    return response;
  };

  if (!isAuthenticated && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('reason', 'session_expired');
    return redirectWithCookies(url);
  }

  if (isAuthenticated && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return redirectWithCookies(url);
  }

  // User management moved to /technicians (Team)
  if (isAuthenticated && request.nextUrl.pathname.startsWith('/settings')) {
    const url = request.nextUrl.clone();
    url.pathname = '/technicians';
    return redirectWithCookies(url);
  }

  return supabaseResponse;
}

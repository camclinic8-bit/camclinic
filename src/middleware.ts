import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return updateSession(request);
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

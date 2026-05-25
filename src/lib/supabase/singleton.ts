/**
 * Centralized Supabase Client Singleton (Browser-side)
 * 
 * This is the ONLY place where the browser-side Supabase client should be created.
 * All client-side files should import from here.
 * 
 * For server-side usage, use @/lib/supabase/server.ts instead.
 * 
 * Usage:
 * import { getClient } from '@/lib/supabase/singleton'
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Get or create the browser-side Supabase client (singleton)
 * Use this in components, hooks, and client-side code
 */
export function getClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}

/**
 * Reset the browser client (useful for testing)
 * @internal
 */
export function resetClient() {
  browserClient = null;
}

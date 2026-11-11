import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

const directUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/**
 * Session cookie name. Must stay pinned to the real project ref so the
 * middleware (server client, built from the direct URL) reads the same
 * cookie the browser client writes — regardless of which origin the app
 * is served from.
 */
const STORAGE_KEY = `sb-${new URL(directUrl).hostname.split('.')[0]}-auth-token`;

/**
 * Browser client for auth + data. Talks to Supabase through a same-origin
 * proxy (next.config.ts rewrites /auth, /rest, /storage) so ad-blockers,
 * antivirus HTTPS scanners and URL filters that block *.supabase.co can't
 * break the app on client systems.
 *
 * During static prerender there is no window; createBrowserClient then
 * builds a throwaway in-memory client, which is fine.
 */
export function createClient() {
  const url =
    typeof window !== 'undefined' ? window.location.origin : directUrl;

  return createBrowserClient<Database>(
    url,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { storageKey: STORAGE_KEY } }
  );
}

/**
 * Separate client for realtime subscriptions. WebSockets cannot be proxied
 * by the rewrites, so this client is built from the direct Supabase URL.
 * Its default storage key resolves to STORAGE_KEY, sharing the session
 * cookie with the proxied client. If a blocker kills the WebSocket,
 * realtime degrades gracefully while auth and data keep working.
 */
export function createRealtimeClient() {
  return createBrowserClient<Database>(
    directUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

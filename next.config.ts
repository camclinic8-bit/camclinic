import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactCompiler: true,
  /** Pin app root when multiple lockfiles exist (e.g. parent + cam-clinic folder). */
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  async rewrites() {
    // Same-origin proxy for the browser's Supabase auth/REST/storage calls so
    // ad-blockers, antivirus HTTPS scanners and URL filters that block
    // *.supabase.co can't break the app on client systems. Realtime
    // (WebSocket) can't be proxied by rewrites — it stays on the direct
    // endpoint via createRealtimeClient().
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return [];
    return [
      { source: '/auth/:path*', destination: `${supabaseUrl}/auth/:path*` },
      { source: '/rest/:path*', destination: `${supabaseUrl}/rest/:path*` },
      { source: '/storage/:path*', destination: `${supabaseUrl}/storage/:path*` },
    ];
  },
};

export default nextConfig;

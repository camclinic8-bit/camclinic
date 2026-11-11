'use client';

import { ReactNode, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useAuthStore } from '@/stores/authStore';

function AuthGate({ children }: { children: ReactNode }) {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSlowConnection = useAuthStore((s) => s.isSlowConnection);

  useEffect(() => {
    // Once the session check completes, redirect if not authenticated.
    // Full-page navigation (not router.replace): if the server middleware
    // still has a valid session it bounces back with a fresh document load,
    // re-running AuthInitializer. A client-side replace would skip that and
    // ping-pong between /login and /dashboard forever.
    if (!isLoading && !isAuthenticated) {
      window.location.replace('/login');
    }
  }, [isLoading, isAuthenticated]);

  // Brief skeleton while session check runs (usually < 300ms)
  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar skeleton */}
        <div className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-200 animate-pulse">
          <div className="p-4 border-b">
            <div className="h-6 w-28 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-40 bg-gray-100 rounded" />
          </div>
          <div className="flex-1 p-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
        {/* Content skeleton */}
        <div className="flex-1 bg-gray-50 flex items-center justify-center px-4">
          {isSlowConnection && (
            <p className="text-sm text-gray-500 text-center max-w-sm">
              Still connecting — this is taking longer than usual. Check the
              internet connection (or an ad-blocker/proxy blocking the site).
              Retrying automatically… if this message stays, press F5 to
              refresh.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Redirect pending (not authenticated)
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Redirecting to login…</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-gray-50 text-gray-900">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </AuthGate>
  );
}

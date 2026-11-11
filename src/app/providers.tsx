'use client';

import { ReactNode, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { createClient, createRealtimeClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { Profile } from '@/types/user';

/**
 * Single source of truth for auth state across the entire app.
 *
 * Uses onAuthStateChange as the PRIMARY mechanism — not getSession().
 *
 * Why this matters:
 * - INITIAL_SESSION fires on every page load / refresh with the current
 *   session from cookie storage. It is the reliable event for "what is the
 *   auth state RIGHT NOW on mount?"
 * - No initialized.current guard: React Strict Mode runs effects twice
 *   (mount → cleanup → remount). The old guard prevented the subscription
 *   from being recreated after cleanup, permanently killing the listener and
 *   causing SIGNED_IN events to be silently dropped → infinite skeleton.
 * - Removing the guard means the subscription is properly recreated on the
 *   second mount. The INITIAL_SESSION event fires again on remount, which is
 *   harmless (idempotent state updates).
 */
function AuthInitializer() {
  const { setUser, setLoading, setAuthenticated, setSlowConnection } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    const loadProfile = async (userId: string) => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('Profile fetch error:', error);
        } else if (profile && !(profile as Profile).is_active) {
          await supabase.auth.signOut();
          if (isMounted) {
            setUser(null);
            setAuthenticated(false);
            setLoading(false);
            toast.error('This account has been deactivated. Contact your administrator.');
          }
        } else {
          if (isMounted) {
            setUser(profile);
          }
        }
      } catch (err) {
        console.error('Profile fetch exception:', err);
      }
    };

    const applySessionState = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
      if (!isMounted) return;

      if (session?.user) {
        setAuthenticated(true);
        setLoading(false);
        setSlowConnection(false);
        void loadProfile(session.user.id);
        return;
      }

      setAuthenticated(false);
      setUser(null);
      setLoading(false);
      setSlowConnection(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') {
          // Primary session restore on page refresh/load.
          await applySessionState(session);
        } else if (event === 'SIGNED_IN' && session?.user) {
          // Fires after signInWithPassword succeeds.
          await applySessionState(session);
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            useAuthStore.getState().logout();
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Keep profile hydrated after token refresh.
          if (isMounted && !useAuthStore.getState().user) {
            await loadProfile(session.user.id);
          }
        }
      }
    );

    // Fallback bootstrap: guarantees auth loading resolves even if INITIAL_SESSION
    // is delayed/missed in edge cases (dev Strict Mode, network jitter, tab restore).
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (useAuthStore.getState().isLoading) {
          void applySessionState(data.session);
        }
      })
      .catch(() => {
        // getSession only rejects when Supabase is unreachable AND the stored
        // token needs a refresh. In that case INITIAL_SESSION/SIGNED_OUT will
        // still settle auth state once the network recovers — do NOT force a
        // logout here: forcing it while the server still has a valid session
        // cookie causes a /login ↔ /dashboard redirect loop on slow networks.
      });

    // Slow-connection hint only. Never force `isAuthenticated: false` from a
    // timer: the middleware still sees a valid session and would bounce the
    // user straight back from /login, creating an endless redirect loop.
    const slowConnectionTimeout = window.setTimeout(() => {
      if (isMounted && useAuthStore.getState().isLoading) {
        setSlowConnection(true);
      }
    }, 4000);

    // Bounded auto-recovery: if bootstrap is still stuck after 10s, the first
    // auth request is hung (supabase-js holds an internal lock while a hung
    // request never settles, so in-page retries can't start). One full reload
    // re-bootstraps the app. Guarded by sessionStorage — at most once per tab
    // session, so a truly dead network just keeps the message, no reload loop.
    const autoRecoveryTimeout = window.setTimeout(() => {
      if (!isMounted || !useAuthStore.getState().isLoading) return;
      try {
        if (sessionStorage.getItem('cc-auth-auto-reloaded') === '1') return;
        sessionStorage.setItem('cc-auth-auto-reloaded', '1');
        window.location.reload();
      } catch {
        // sessionStorage unavailable (private mode) — skip auto-recovery
      }
    }, 10000);

    return () => {
      isMounted = false;
      window.clearTimeout(slowConnectionTimeout);
      window.clearTimeout(autoRecoveryTimeout);
      subscription.unsubscribe();
    };
    // Zustand setters are stable — subscribe once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function RealtimeInitializer({ queryClient }: { queryClient: QueryClient }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const supabase = createRealtimeClient();

    const channel = supabase
      .channel('jobs-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['jobs'] });
        void queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        void queryClient.invalidateQueries({ queryKey: ['jobs', 'counts'] });
        void queryClient.invalidateQueries({ queryKey: ['jobs', 'due-today'] });
        void queryClient.invalidateQueries({ queryKey: ['reports', 'jobs'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'job_status_history' }, () => {
        void queryClient.invalidateQueries({ queryKey: ['jobs'] });
        void queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
        void queryClient.invalidateQueries({ queryKey: ['jobs', 'counts'] });
        void queryClient.invalidateQueries({ queryKey: ['jobs', 'due-today'] });
        void queryClient.invalidateQueries({ queryKey: ['reports', 'jobs'] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAuthenticated, queryClient]);

  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
            retryDelay: 1000,
            gcTime: 10 * 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      <RealtimeInitializer queryClient={queryClient} />
      {children}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

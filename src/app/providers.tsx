'use client';

import { ReactNode, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
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
  const { setUser, setLoading, setAuthenticated } = useAuthStore();

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
        void loadProfile(session.user.id);
        return;
      }

      setAuthenticated(false);
      setUser(null);
      setLoading(false);
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
        if (isMounted) {
          setAuthenticated(false);
          setUser(null);
          setLoading(false);
        }
      });

    // Final safety net: never allow infinite skeleton.
    const loadingTimeout = window.setTimeout(() => {
      if (!isMounted) return;
      if (useAuthStore.getState().isLoading) {
        setAuthenticated(false);
        setUser(null);
        setLoading(false);
      }
    }, 4000);

    return () => {
      isMounted = false;
      window.clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
    // Zustand setters are stable — subscribe once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      {children}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

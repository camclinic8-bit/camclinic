'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

/**
 * Lightweight hook — just reads from the Zustand store and exposes actions.
 * Auth initialization happens once in <AuthInitializer> (app/providers.tsx).
 */
export function useAuth() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, setLoading, logout } = useAuthStore();

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Reset loading explicitly — SIGNED_IN event in AuthInitializer also resets
      // it, but calling it here eliminates any race between router.push and the event.
      setLoading(false);
      router.push('/dashboard');
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    logout();
    router.push('/login');
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isServiceManager = user?.role === 'service_manager';
  const isServiceIncharge = user?.role === 'service_incharge';
  const isTechnician = user?.role === 'technician';

  return {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
    isSuperAdmin,
    isServiceManager,
    isServiceIncharge,
    isTechnician,
    canManageJobs: isSuperAdmin || isServiceManager || isServiceIncharge,
    // Same shop-wide branch access as super admin; team/user admin stays super_admin-only.
    canManageBranches: isSuperAdmin || isServiceManager,
    canManageUsers: isSuperAdmin,
    canViewAllBranches: isSuperAdmin || isServiceManager,
    canSetAnyStatus: isSuperAdmin || isServiceManager,
  };
}

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { Profile } from '@/types/user';

export function useAuth() {
  const router = useRouter();
  const { user, isLoading, setUser, setLoading, logout } = useAuthStore();
  const supabase = createClient();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const getUser = async () => {
      try {
        // Use getSession for faster initial load (cached)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setUser(profile as Profile | null);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setUser(profile as Profile | null);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          logout();
          router.push('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setLoading(false);
      throw error;
    }

    // Immediately fetch profile and set user for instant feedback
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      setUser(profile as Profile | null);
    }
    
    setLoading(false);
    router.push('/dashboard');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    logout();
    router.push('/login');
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isServiceManager = user?.role === 'service_manager';
  const isServiceIncharge = user?.role === 'service_incharge';
  const isTechnician = user?.role === 'technician';

  const canManageJobs = isSuperAdmin || isServiceManager || isServiceIncharge;
  const canManageBranches = isSuperAdmin;
  const canManageUsers = isSuperAdmin;
  const canViewAllBranches = isSuperAdmin;
  const canSetAnyStatus = isSuperAdmin || isServiceManager;

  return {
    user,
    isLoading,
    signIn,
    signOut,
    isSuperAdmin,
    isServiceManager,
    isServiceIncharge,
    isTechnician,
    canManageJobs,
    canManageBranches,
    canManageUsers,
    canViewAllBranches,
    canSetAnyStatus,
  };
}

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
  const fetchingProfile = useRef(false);
  const profileCache = useRef<Map<string, { profile: Profile; timestamp: number }>>(new Map());

  const fetchProfile = useCallback(async (userId: string) => {
    if (fetchingProfile.current) return;
    
    // Check cache first (30 second cache for better responsiveness)
    const cached = profileCache.current.get(userId);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < 30 * 1000) {
      setUser(cached.profile);
      setLoading(false);
      return;
    }
    
    fetchingProfile.current = true;
    
    try {
      // Remove timeout for now to debug the actual issue
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
      
      // Cache the result
      if (profileData) {
        profileCache.current.set(userId, {
          profile: profileData,
          timestamp: now
        });
      }
      
      setUser(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser(null);
    } finally {
      fetchingProfile.current = false;
      setLoading(false);
    }
  }, [supabase, setUser, setLoading]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initializeAuth = async () => {
      try {
        // Use getSession for faster initial load (cached)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setLoading(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('Auth initialization taking too long, setting loading to false');
        setLoading(false);
      }
    }, 10000); // 10 seconds timeout

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Don't fetch profile if we already have it
          if (!user || user.id !== session.user.id) {
            await fetchProfile(session.user.id);
          } else {
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          logout();
          router.push('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }

      // Let the onAuthStateChange handler handle profile fetching
      // This prevents duplicate queries
      router.push('/dashboard');
    } catch (error) {
      setLoading(false);
      throw error;
    }
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

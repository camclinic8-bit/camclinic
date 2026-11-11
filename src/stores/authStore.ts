'use client';

import { create } from 'zustand';
import { Profile } from '@/types/user';

interface AuthState {
  user: Profile | null;
  /** True while we haven't yet determined whether a session exists. */
  isLoading: boolean;
  /** True once getSession() confirmed a valid session (even before profile loads). */
  isAuthenticated: boolean;
  /** True when session bootstrap is taking unusually long (slow/blocked network). */
  isSlowConnection: boolean;
  setUser: (user: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setAuthenticated: (auth: boolean) => void;
  setSlowConnection: (slow: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,       // start true: we don't know auth state yet
  isAuthenticated: false,
  isSlowConnection: false,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setSlowConnection: (isSlowConnection) => set({ isSlowConnection }),
  logout: () => set({ user: null, isLoading: false, isAuthenticated: false, isSlowConnection: false }),
}));

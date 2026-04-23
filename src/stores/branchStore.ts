'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface BranchState {
  selectedBranchId: string | null;
  setSelectedBranch: (branchId: string | null) => void;
}

/**
 * Safe storage: corporate browsers may block localStorage under strict privacy
 * settings. Fallback to in-memory (no persistence) rather than crashing.
 */
function safeLocalStorage(): ReturnType<typeof createJSONStorage> {
  try {
    // Feature-test: some corporate policies block even the property access.
    const test = '__cam_test__';
    window.localStorage.setItem(test, '1');
    window.localStorage.removeItem(test);
    return createJSONStorage(() => localStorage);
  } catch {
    // Fallback: in-memory, no persistence between page loads.
    return createJSONStorage(() => sessionStorage);
  }
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      selectedBranchId: null,
      setSelectedBranch: (branchId) => set({ selectedBranchId: branchId }),
    }),
    {
      name: 'cam-clinic-branch',
      storage: typeof window !== 'undefined' ? safeLocalStorage() : createJSONStorage(() => sessionStorage),
    }
  )
);


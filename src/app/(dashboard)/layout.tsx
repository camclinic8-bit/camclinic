'use client';

import { ReactNode, memo } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/hooks/useAuth';

const LoadingSpinner = memo(() => (
  <div className="flex h-screen items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  // Show loading state only during initial auth check
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If not authenticated, the middleware will redirect
  // Don't show a loading state here to avoid confusion
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 text-gray-900">
        {children}
      </main>
    </div>
  );
}

'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BranchSelector } from './BranchSelector';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { canViewAllBranches } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-semibold text-gray-900 ml-12 lg:ml-0">
          {title}
        </h1>
        <div className="flex items-center gap-4">
          {canViewAllBranches && <BranchSelector />}
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5 text-gray-500" />
          </Button>
        </div>
      </div>
    </header>
  );
}

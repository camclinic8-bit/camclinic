'use client';

import { useBranches } from '@/hooks/useBranches';
import { useBranchStore } from '@/stores/branchStore';
import { Select } from '@/components/ui/Select';

export function BranchSelector() {
  const { data: branches, isLoading } = useBranches();
  const { selectedBranchId, setSelectedBranch } = useBranchStore();

  if (isLoading) {
    return <div className="w-40 h-9 bg-gray-100 animate-pulse rounded-lg" />;
  }

  const options = [
    { value: '', label: 'All Branches' },
    ...(branches || []).map(branch => ({
      value: branch.id,
      label: branch.name,
    })),
  ];

  return (
    <Select
      options={options}
      value={selectedBranchId || ''}
      onChange={(e) => setSelectedBranch(e.target.value || null)}
      className="w-40"
    />
  );
}

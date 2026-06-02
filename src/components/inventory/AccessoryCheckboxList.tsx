'use client';

import { useAccessories } from '@/hooks/useInventory';
import { Checkbox } from '@/components/ui/Checkbox';

interface AccessoryCheckboxListProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
}

export function AccessoryCheckboxList({ value, onChange, label = 'Accessories' }: AccessoryCheckboxListProps) {
  const { data: accessories, isLoading } = useAccessories();

  const handleToggle = (accessoryName: string) => {
    if (value.includes(accessoryName)) {
      onChange(value.filter((name) => name !== accessoryName));
    } else {
      onChange([...value, accessoryName]);
    }
  };

  if (isLoading) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!accessories || accessories.length === 0) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <p className="text-sm text-gray-500">No accessories available. Add some in the Inventory section.</p>
      </div>
    );
  }

  const allNames = accessories?.map((acc) => acc.name) || [];
  const isAllSelected = allNames.length > 0 && allNames.every((name) => value.includes(name));

  const handleSelectAll = () => {
    if (isAllSelected) {
      onChange([]);
    } else {
      onChange(allNames);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <button
          type="button"
          onClick={handleSelectAll}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 focus:outline-none transition-colors"
        >
          {isAllSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {accessories.map((accessory) => (
          <label
            key={accessory.id}
            className="flex items-center gap-2 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <Checkbox
              checked={value.includes(accessory.name)}
              onChange={() => handleToggle(accessory.name)}
            />
            <span className="text-sm text-gray-700">{accessory.name}</span>
          </label>
        ))}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          {value.length} accessory{value.length !== 1 ? 'ies' : ''} selected
        </p>
      )}
    </div>
  );
}

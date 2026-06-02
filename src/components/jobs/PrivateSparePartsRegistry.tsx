'use client';

import { useWatch } from 'react-hook-form';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Trash2, Plus, Calculator, Lock } from 'lucide-react';
import { formatINR } from '@/lib/utils/currency';
import { toast } from 'sonner';

type PrivateSparePartItem = {
  name: string;
  quantity: number;
  unit_cost: number;
  hsn_code?: string | null;
};

type PrivateSparePartsRegistryProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setValue: any;
};

export function PrivateSparePartsRegistry({ control, setValue }: PrivateSparePartsRegistryProps) {
  const partsList = useWatch({
    control,
    name: 'spare_parts_private_details',
    defaultValue: [] as PrivateSparePartItem[],
  }) || [];

  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [newCost, setNewCost] = useState(0);
  const [newHsn, setNewHsn] = useState('');

  const calculateTotal = (items: PrivateSparePartItem[]) => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
  };

  const handleAdd = () => {
    const trimmedName = newName.trim();
    if (!trimmedName) {
      toast.error('Spare part name is required');
      return;
    }
    if (newQty <= 0) {
      toast.error('Quantity must be greater than zero');
      return;
    }
    if (newCost < 0) {
      toast.error('Unit cost cannot be negative');
      return;
    }

    const newItem: PrivateSparePartItem = {
      name: trimmedName,
      quantity: newQty,
      unit_cost: newCost,
      hsn_code: newHsn.trim() || null,
    };

    const updatedList = [...partsList, newItem];
    setValue('spare_parts_private_details', updatedList, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const newTotal = calculateTotal(updatedList);
    setValue('spare_parts_total_cost', newTotal, {
      shouldDirty: true,
      shouldValidate: true,
    });

    setNewName('');
    setNewQty(1);
    setNewCost(0);
    setNewHsn('');
    toast.success('Private spare part cost item added');
  };

  const handleRemove = (targetIndex: number) => {
    const updatedList = partsList.filter((_: PrivateSparePartItem, idx: number) => idx !== targetIndex);
    setValue('spare_parts_private_details', updatedList, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const newTotal = calculateTotal(updatedList);
    setValue('spare_parts_total_cost', newTotal, {
      shouldDirty: true,
      shouldValidate: true,
    });
    toast.success('Private cost item removed');
  };

  const grandTotal = calculateTotal(partsList);

  return (
    <div className="space-y-4 p-4 border border-blue-100 dark:border-blue-900/40 bg-blue-50/30 dark:bg-blue-950/10 rounded-2xl">
      <div className="flex items-center justify-between border-b border-blue-50 dark:border-blue-900/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-black dark:text-black">
              Private Spare Parts Cost Registry
            </h4>
            <p className="text-[11px] text-black dark:text-black font-medium">
              Internal dealer cost records (office use only). Never shown to customers.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white font-extrabold text-xs rounded-lg shadow-sm">
          <Calculator className="w-3.5 h-3.5 text-white" />
          <span className="text-white">Cost Sum: {formatINR(grandTotal)}</span>
        </div>
      </div>

      {/* Parts Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2 w-28">HSN Code</th>
              <th className="px-3 py-2 w-20">Qty</th>
              <th className="px-3 py-2 w-28">Unit Cost (₹)</th>
              <th className="px-3 py-2 w-28">Total</th>
              <th className="px-3 py-2 w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {partsList.map((item: PrivateSparePartItem, idx: number) => (
              <tr key={idx}>
                <td className="px-3 py-2">{item.name}</td>
                <td className="px-3 py-2 text-gray-500">{item.hsn_code || <span className="text-gray-300">—</span>}</td>
                <td className="px-3 py-2">{item.quantity}</td>
                <td className="px-3 py-2">{formatINR(item.unit_cost)}</td>
                <td className="px-3 py-2 font-medium">{formatINR(item.quantity * item.unit_cost)}</td>
                <td className="px-3 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(idx)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}

            {/* Add row */}
            <tr className="bg-gray-50">
              <td className="px-3 py-2">
                <input
                  type="text"
                  placeholder="Part / item name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
                />
              </td>
              <td className="px-3 py-2 w-28">
                <input
                  type="text"
                  placeholder="HSN (optional)"
                  value={newHsn}
                  onChange={(e) => setNewHsn(e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
                />
              </td>
              <td className="px-3 py-2 w-20">
                <input
                  type="number"
                  min={1}
                  value={newQty}
                  onChange={(e) => setNewQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </td>
              <td className="px-3 py-2 w-28">
                <input
                  type="number"
                  min={0}
                  placeholder="Cost"
                  value={newCost || ''}
                  onChange={(e) => setNewCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full border rounded px-2 py-1 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
                />
              </td>
              <td className="px-3 py-2 w-28 text-sm text-gray-500 font-medium">
                {formatINR(newQty * newCost)}
              </td>
              <td className="px-3 py-2 w-16">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                >
                  Add
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

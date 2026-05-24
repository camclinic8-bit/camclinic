'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useAccessories, useCreateAccessory, useUpdateAccessory, useDeleteAccessory } from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function AccessoriesPage() {
  const { data: accessories, isLoading } = useAccessories();
  const createAccessory = useCreateAccessory();
  const updateAccessory = useUpdateAccessory();
  const deleteAccessory = useDeleteAccessory();
  const { canManageUsers } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccessory, setEditingAccessory] = useState<{ id: string; name: string } | null>(null);
  const [name, setName] = useState('');

  const handleOpenModal = (accessory?: { id: string; name: string }) => {
    if (accessory) {
      setEditingAccessory(accessory);
      setName(accessory.name);
    } else {
      setEditingAccessory(null);
      setName('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccessory(null);
    setName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      if (editingAccessory) {
        await updateAccessory.mutateAsync({
          id: editingAccessory.id,
          input: { name: name.trim() },
        });
      } else {
        await createAccessory.mutateAsync({
          name: name.trim(),
        });
      }
      handleCloseModal();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete accessory "${name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteAccessory.mutateAsync(id);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="Accessories" />

      <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto">
        <div className="flex items-center gap-3">
          <Link href="/inventory">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <p className="text-sm text-gray-600">
            {accessories?.length || 0} accessories
          </p>
          <div className="flex-1" />
          {canManageUsers && (
            <Button onClick={() => handleOpenModal()} size="md">
              <Plus className="h-4 w-4 mr-2" />
              Add Accessory
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : accessories && accessories.length > 0 ? (
          <div className="grid gap-3">
            {accessories.map((accessory) => (
              <Card key={accessory.id} className="border-gray-200/80 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{accessory.name}</h3>
                    </div>
                    {canManageUsers && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(accessory)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(accessory.id, accessory.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-gray-200 bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <p className="text-gray-700 font-medium text-sm">No accessories found</p>
              <p className="text-xs text-gray-500 mt-1 mb-6">
                Add accessories to get started.
              </p>
              {canManageUsers && (
                <Button onClick={() => handleOpenModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Accessory
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingAccessory ? 'Edit Accessory' : 'Add Accessory'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Battery, Charger, Lens Cap"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAccessory.isPending || updateAccessory.isPending}>
              {editingAccessory ? 'Update' : 'Add'} Accessory
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

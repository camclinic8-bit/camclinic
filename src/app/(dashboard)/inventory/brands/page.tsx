'use client';

import { useState } from 'react';
import { Plus, Trash2, Edit2, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useBrands, useCreateBrand, useUpdateBrand, useDeleteBrand } from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function BrandsPage() {
  const { data: brands, isLoading } = useBrands();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();
  const { canManageUsers } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleOpenModal = (brand?: { id: string; name: string; description: string | null }) => {
    if (brand) {
      setEditingBrand(brand);
      setName(brand.name);
      setDescription(brand.description || '');
    } else {
      setEditingBrand(null);
      setName('');
      setDescription('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
    setName('');
    setDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      if (editingBrand) {
        await updateBrand.mutateAsync({
          id: editingBrand.id,
          input: { name: name.trim(), description: description.trim() || null },
        });
      } else {
        await createBrand.mutateAsync({
          name: name.trim(),
          description: description.trim() || null,
        });
      }
      handleCloseModal();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete brand "${name}"? This will also delete all models under this brand. This cannot be undone.`)) {
      return;
    }
    try {
      await deleteBrand.mutateAsync(id);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="Brands" />

      <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto">
        <div className="flex items-center gap-3">
          <Link href="/inventory">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <p className="text-sm text-gray-600">
            {brands?.length || 0} brands
          </p>
          <div className="flex-1" />
          {canManageUsers && (
            <Button onClick={() => handleOpenModal()} size="md">
              <Plus className="h-4 w-4 mr-2" />
              Add Brand
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : brands && brands.length > 0 ? (
          <div className="grid gap-3">
            {brands.map((brand) => (
              <Card key={brand.id} className="border-gray-200/80 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                      {brand.description && (
                        <p className="text-sm text-gray-600 mt-1">{brand.description}</p>
                      )}
                      {!brand.is_active && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link href={`/inventory/brands/${brand.id}/models`}>
                        <Button variant="outline" size="sm">
                          Models
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                      {canManageUsers && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenModal(brand)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(brand.id, brand.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-gray-200 bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <p className="text-gray-700 font-medium text-sm">No brands found</p>
              <p className="text-xs text-gray-500 mt-1 mb-6">
                Add brands to get started.
              </p>
              {canManageUsers && (
                <Button onClick={() => handleOpenModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Brand
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingBrand ? 'Edit Brand' : 'Add Brand'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Canon, Nikon, Sony"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={createBrand.isPending || updateBrand.isPending}>
              {editingBrand ? 'Update' : 'Add'} Brand
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

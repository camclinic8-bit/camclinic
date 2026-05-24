'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Edit2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useModels, useCreateModel, useUpdateModel, useDeleteModel, useBrands } from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function BrandModelsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: brandId } = use(params);
  const router = useRouter();
  const { data: models, isLoading } = useModels(brandId);
  const { data: brands } = useBrands();
  const createModel = useCreateModel();
  const updateModel = useUpdateModel();
  const deleteModel = useDeleteModel();
  const { canManageUsers } = useAuth();
  
  const brand = brands?.find(b => b.id === brandId);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleOpenModal = (model?: { id: string; name: string; description: string | null }) => {
    if (model) {
      setEditingModel(model);
      setName(model.name);
      setDescription(model.description || '');
    } else {
      setEditingModel(null);
      setName('');
      setDescription('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingModel(null);
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
      if (editingModel) {
        await updateModel.mutateAsync({
          id: editingModel.id,
          input: { name: name.trim(), description: description.trim() || null },
        });
      } else {
        await createModel.mutateAsync({
          brand_id: brandId,
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
    if (!window.confirm(`Delete model "${name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteModel.mutateAsync(id);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  if (!brand) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <Header title="Models" />
        <div className="flex-1 p-4 lg:p-6">
          <Card className="border-dashed border-2 border-gray-200 bg-white shadow-sm">
            <CardContent className="p-12 text-center">
              <p className="text-gray-700 font-medium text-sm">Brand not found</p>
              <Link href="/inventory/brands">
                <Button className="mt-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Brands
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title={`${brand.name} - Models`} />

      <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/inventory/brands">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <p className="text-sm text-gray-600">
              {models?.length || 0} models
            </p>
          </div>
          {canManageUsers && (
            <Button onClick={() => handleOpenModal()} size="md">
              <Plus className="h-4 w-4 mr-2" />
              Add Model
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : models && models.length > 0 ? (
          <div className="grid gap-3">
            {models.map((model) => (
              <Card key={model.id} className="border-gray-200/80 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{model.name}</h3>
                      {model.description && (
                        <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                      )}
                      {!model.is_active && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    {canManageUsers && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(model)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(model.id, model.name)}
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
              <p className="text-gray-700 font-medium text-sm">No models found for this brand</p>
              <p className="text-xs text-gray-500 mt-1 mb-6">
                Add models to get started.
              </p>
              {canManageUsers && (
                <Button onClick={() => handleOpenModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Model
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingModel ? 'Edit Model' : 'Add Model'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., EOS R5, D850, A7 IV"
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
            <Button type="submit" disabled={createModel.isPending || updateModel.isPending}>
              {editingModel ? 'Update' : 'Add'} Model
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

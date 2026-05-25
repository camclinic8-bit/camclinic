'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBranchStore } from '@/stores/branchStore';
import { 
  getActiveTermsAndConditions, 
  getAllTermsAndConditions, 
  createTermsAndConditions, 
  updateTermsAndConditions, 
  deleteTermsAndConditions 
} from '@/lib/db/terms';
import { TermsAndConditions } from '@/types/job';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';

export default function TermsAndConditionsPage() {
  const supabase = createClient();
  const { user } = useAuth();
  const { selectedBranchId } = useBranchStore();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTerms, setEditingTerms] = useState<TermsAndConditions | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_active: true,
  });

  const { data: activeTerms } = useQuery({
    queryKey: ['activeTerms', selectedBranchId],
    queryFn: () => selectedBranchId ? getActiveTermsAndConditions(supabase, selectedBranchId) : Promise.resolve(null),
    enabled: !!selectedBranchId,
  });

  const { data: allTerms } = useQuery({
    queryKey: ['allTerms', selectedBranchId],
    queryFn: () => selectedBranchId ? getAllTermsAndConditions(supabase, selectedBranchId) : Promise.resolve([]),
    enabled: !!selectedBranchId,
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string; is_active: boolean; userId: string }) =>
      createTermsAndConditions(supabase, {
        shop_id: selectedBranchId || '',
        title: data.title,
        content: data.content,
        is_active: data.is_active,
        created_by: data.userId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTerms'] });
      queryClient.invalidateQueries({ queryKey: ['allTerms'] });
      toast.success('Terms and conditions created successfully');
      setIsModalOpen(false);
      setFormData({ title: '', content: '', is_active: true });
    },
    onError: () => {
      toast.error('Failed to create terms and conditions');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; content?: string; is_active?: boolean } }) =>
      updateTermsAndConditions(supabase, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTerms'] });
      queryClient.invalidateQueries({ queryKey: ['allTerms'] });
      toast.success('Terms and conditions updated successfully');
      setIsModalOpen(false);
      setEditingTerms(null);
      setFormData({ title: '', content: '', is_active: true });
    },
    onError: () => {
      toast.error('Failed to update terms and conditions');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTermsAndConditions(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTerms'] });
      queryClient.invalidateQueries({ queryKey: ['allTerms'] });
      toast.success('Terms and conditions deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete terms and conditions');
    },
  });

  const handleOpenModal = (terms?: TermsAndConditions) => {
    if (terms) {
      setEditingTerms(terms);
      setFormData({
        title: terms.title,
        content: terms.content,
        is_active: terms.is_active,
      });
    } else {
      setEditingTerms(null);
      setFormData({ title: '', content: '', is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTerms) {
      updateMutation.mutate({
        id: editingTerms.id,
        data: formData,
      });
    } else {
      if (!user?.id) {
        toast.error('User not authenticated');
        return;
      }
      createMutation.mutate({ ...formData, userId: user.id });
    }
  };

  const handleSetActive = (terms: TermsAndConditions) => {
    // Deactivate all other terms first
    allTerms?.forEach(t => {
      if (t.id !== terms.id && t.is_active) {
        updateTermsAndConditions(supabase, t.id, { is_active: false });
      }
    });
    // Activate this one
    updateTermsAndConditions(supabase, terms.id, { is_active: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Terms and Conditions</h1>
          <p className="text-gray-500">Manage terms and conditions for receipts and invoices</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      {/* Active Terms */}
      {activeTerms && (
        <Card className="border-green-200 bg-green-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900">{activeTerms.title}</h3>
                <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">Active</span>
              </div>
              <div className="whitespace-pre-wrap text-sm text-gray-700">{activeTerms.content}</div>
            </div>
            <div className="flex gap-2 ml-4">
              <Button variant="outline" size="sm" onClick={() => handleOpenModal(activeTerms)}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!activeTerms && (
        <Card className="border-dashed border-gray-300 bg-gray-50">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No active terms and conditions</p>
            <Button variant="outline" className="mt-4" onClick={() => handleOpenModal()}>
              Create Terms and Conditions
            </Button>
          </div>
        </Card>
      )}

      {/* All Terms List */}
      {allTerms && allTerms.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">All Terms and Conditions</h2>
          <div className="space-y-3">
            {allTerms.map((terms) => (
              <Card key={terms.id} className={!terms.is_active ? 'opacity-60' : ''}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{terms.title}</h3>
                      {!terms.is_active && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">Inactive</span>
                      )}
                    </div>
                    <div className="whitespace-pre-wrap text-sm text-gray-600 line-clamp-3">{terms.content}</div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!terms.is_active && (
                      <Button variant="outline" size="sm" onClick={() => handleSetActive(terms)}>
                        Set Active
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(terms)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this terms and conditions?')) {
                          deleteMutation.mutate(terms.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTerms ? 'Edit Terms and Conditions' : 'Add Terms and Conditions'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter terms and conditions content (supports multiple lines)"
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              Set as active (will appear in PDFs)
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingTerms ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

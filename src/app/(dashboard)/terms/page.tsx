'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBranchStore } from '@/stores/branchStore';
import { 
  getActiveTermsAndConditions, 
  createTermsAndConditions, 
  updateTermsAndConditions 
} from '@/lib/db/terms';
import { TermsAndConditions } from '@/types/job';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { toast } from 'sonner';
import { Edit, FileText, Save } from 'lucide-react';

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
  });

  const { data: activeTerms, isLoading } = useQuery({
    queryKey: ['activeTerms', selectedBranchId],
    queryFn: () => selectedBranchId ? getActiveTermsAndConditions(supabase, selectedBranchId) : Promise.resolve(null),
    enabled: !!selectedBranchId,
  });

  const createMutation = useMutation({
    mutationFn: (data: { title: string; content: string; userId: string }) =>
      createTermsAndConditions(supabase, {
        shop_id: selectedBranchId || '',
        title: data.title,
        content: data.content,
        is_active: true,
        created_by: data.userId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTerms'] });
      toast.success('Terms and conditions created successfully');
      setIsModalOpen(false);
      setFormData({ title: '', content: '' });
    },
    onError: (error: any) => {
      console.error('Create error:', error);
      if (error.message?.includes('Shop with ID')) {
        toast.error('Selected branch not found. Please select a valid branch.');
      } else {
        toast.error('Failed to create terms and conditions');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title?: string; content?: string } }) =>
      updateTermsAndConditions(supabase, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeTerms'] });
      toast.success('Terms and conditions updated successfully');
      setIsModalOpen(false);
      setEditingTerms(null);
      setFormData({ title: '', content: '' });
    },
    onError: () => {
      toast.error('Failed to update terms and conditions');
    },
  });

  const handleOpenModal = (terms?: TermsAndConditions) => {
    if (terms) {
      setEditingTerms(terms);
      setFormData({
        title: terms.title,
        content: terms.content,
      });
    } else {
      setEditingTerms(null);
      setFormData({ title: '', content: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchId) {
      toast.error('Please select a branch first');
      return;
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Terms and Conditions</h1>
          <p className="text-gray-500">Edit terms and conditions for receipts and invoices</p>
        </div>
        {activeTerms && (
          <Button onClick={() => handleOpenModal(activeTerms)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      {/* Active Terms */}
      {activeTerms && (
        <Card>
          <div className="flex items-start gap-4">
            <FileText className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">{activeTerms.title}</h3>
              <div className="whitespace-pre-wrap text-sm text-gray-700">{activeTerms.content}</div>
            </div>
          </div>
        </Card>
      )}

      {!activeTerms && (
        <Card className="border-dashed border-gray-300 bg-gray-50">
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 mb-4">No terms and conditions found</p>
            <Button onClick={() => handleOpenModal()}>
              <Save className="h-4 w-4 mr-2" />
              Create Terms and Conditions
            </Button>
          </div>
        </Card>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTerms ? 'Edit Terms and Conditions' : 'Create Terms and Conditions'}>
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
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
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

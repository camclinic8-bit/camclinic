'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Phone, Mail, MapPin, Plus, Edit } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useCustomers, useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import { Customer } from '@/types/customer';
import { toast } from 'sonner';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });

  const { data, isLoading } = useCustomers(page, 20, search || undefined);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', email: '', address: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = formData.phone.trim();
    if (!phone) {
      toast.error('Phone number is required');
      return;
    }
    const name = formData.name.trim();
    if (!name) {
      toast.error('Customer name is required');
      return;
    }
    const payload = { ...formData, name, phone };
    try {
      if (editingCustomer) {
        await updateCustomer.mutateAsync({ id: editingCustomer.id, input: payload });
      } else {
        await createCustomer.mutateAsync(payload);
      }
      handleCloseModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save customer');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="Customers" />
      
      <div className="flex-1 p-4 lg:p-6 space-y-4 overflow-y-auto">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-24 bg-gray-100 animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data?.data && data.data.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.data.map((customer) => (
                <Card key={customer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenModal(customer)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span className="text-gray-700">{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span className="text-gray-700">{customer.email}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate text-gray-700">{customer.address}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <Link href={`/jobs?customer_id=${customer.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          View Jobs
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {data.count > 20 && (
              <div className="flex justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {page} of {Math.ceil(data.count / 20)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= Math.ceil(data.count / 20)}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">No customers found</p>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Customer
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
            required
            placeholder="Customer name"
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData(d => ({ ...d, phone: e.target.value }))}
            required
            placeholder="Phone number (required)"
            autoComplete="tel"
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))}
            placeholder="Email address (optional)"
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData(d => ({ ...d, address: e.target.value }))}
            placeholder="Address (optional)"
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createCustomer.isPending || updateCustomer.isPending}
            >
              {editingCustomer ? 'Save Changes' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

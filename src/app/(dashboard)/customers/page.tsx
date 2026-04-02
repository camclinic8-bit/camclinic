'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Phone, Mail, MapPin, Plus, Pencil, Briefcase, User } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { useCustomers, useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import { Customer } from '@/types/customer';
import { toast } from 'sonner';
import { nameInitials } from '@/lib/utils/initials';

const PAGE_SIZE_OPTIONS = [
  { value: '20', label: '20 / page' },
  { value: '50', label: '50 / page' },
  { value: '100', label: '100 / page' },
];

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useCustomers(page, pageSize, debouncedSearch || undefined);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const paginationNumbers = useMemo(() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + 4);
    const pages: number[] = [];
    for (let i = start; i <= end; i += 1) pages.push(i);
    return pages;
  }, [page, totalPages]);

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name, phone, or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-h-[42px] pl-9"
            />
          </div>
          <Button size="lg" className="w-full shrink-0 sm:w-auto min-h-[44px] gap-2 shadow-sm" onClick={() => handleOpenModal()}>
            <Plus className="h-5 w-5 shrink-0" aria-hidden />
            Add Customer
          </Button>
        </div>

        {isLoading && !data ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-14 bg-gray-50 animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : data?.data && data.data.length > 0 ? (
          <>
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <tr className="border-b border-gray-200 bg-gray-50/90">
                      <TableHead className="pl-4 lg:pl-5 py-3 text-left text-gray-600 normal-case tracking-normal font-semibold text-xs">
                        Customer
                      </TableHead>
                      <TableHead className="py-3 text-gray-600 normal-case tracking-normal font-semibold text-xs">Phone</TableHead>
                      <TableHead className="py-3 text-gray-600 normal-case tracking-normal font-semibold text-xs hidden md:table-cell">
                        Email
                      </TableHead>
                      <TableHead className="py-3 text-gray-600 normal-case tracking-normal font-semibold text-xs hidden lg:table-cell max-w-[200px]">
                        Address
                      </TableHead>
                      <TableHead className="py-3 text-right pr-4 lg:pr-5 text-gray-600 normal-case tracking-normal font-semibold text-xs">
                        Actions
                      </TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((customer) => (
                      <TableRow
                        key={customer.id}
                        className="group border-0 border-b border-gray-100 last:border-0 hover:bg-blue-50/40 transition-colors"
                      >
                        <TableCell className="pl-4 lg:pl-5 py-3 align-middle">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm ring-2 ring-white"
                              aria-hidden
                            >
                              {nameInitials(customer.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
                              <p className="text-xs text-gray-500 md:hidden truncate">
                                {customer.phone}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle tabular-nums text-gray-800 hidden sm:table-cell">
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            {customer.phone}
                          </span>
                        </TableCell>
                        <TableCell className="align-middle text-gray-700 hidden md:table-cell max-w-[220px]">
                          {customer.email ? (
                            <span className="inline-flex items-center gap-1.5 min-w-0">
                              <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                              <span className="truncate" title={customer.email}>
                                {customer.email}
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="align-middle text-gray-600 hidden lg:table-cell max-w-[240px]">
                          {customer.address ? (
                            <span className="inline-flex items-start gap-1.5 min-w-0">
                              <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2 break-words" title={customer.address}>
                                {customer.address}
                              </span>
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="pr-4 lg:pr-5 text-right align-middle">
                          <div className="flex items-center justify-end gap-1 sm:gap-2">
                            <Link href={`/jobs?customer_id=${customer.id}`}>
                              <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3 gap-1" title="View jobs">
                                <Briefcase className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Jobs</span>
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-gray-600 hover:text-blue-700"
                              onClick={() => handleOpenModal(customer)}
                              title="Edit customer"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}{' '}
                customers
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  options={PAGE_SIZE_OPTIONS}
                  value={String(pageSize)}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="w-[120px]"
                />
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                {paginationNumbers.map((num) => (
                  <Button
                    key={num}
                    variant={num === page ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <Card className="border-dashed border-2 border-gray-200 bg-white">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <User className="h-7 w-7 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No customers found</p>
              <p className="text-sm text-gray-500 mt-1 mb-6">
                {debouncedSearch ? 'Try a different search or clear the filter.' : 'Add your first customer to get started.'}
              </p>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
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
            onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
            required
            placeholder="Customer name"
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData((d) => ({ ...d, phone: e.target.value }))}
            required
            placeholder="Phone number (required)"
            autoComplete="tel"
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
            placeholder="Email address (optional)"
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData((d) => ({ ...d, address: e.target.value }))}
            placeholder="Address (optional)"
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createCustomer.isPending || updateCustomer.isPending}>
              {editingCustomer ? 'Save Changes' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

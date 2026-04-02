'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Plus, Trash2, Search, User, Phone } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChipInput } from '@/components/ui/ChipInput';
import { useJob, useUpdateJob } from '@/hooks/useJobs';
import { useBranches } from '@/hooks/useBranches';
import { useTechnicians, useServiceIncharges } from '@/hooks/useTechnicians';
import { useSearchCustomers, useCreateCustomer } from '@/hooks/useCustomers';
import {
  useAddSparePart,
  useDeleteSparePart,
  useSpareParts,
} from '@/hooks/useBilling';
import {
  JOB_PRIORITY_LABELS,
  JOB_STATUS_LABELS,
  PRODUCT_CONDITION_LABELS,
  ProductCondition,
} from '@/types/enums';
import { formatINR } from '@/lib/utils/currency';
import { Customer } from '@/types/customer';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import {
  addAccessoriesBulk,
  addOtherPartsBulk,
  clearAccessoriesByProductId,
  clearOtherPartsByProductId,
  createProduct,
  deleteProduct,
  updateProduct,
} from '@/lib/db/products';

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const productSchema = z.object({
  id: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  condition: z.string().optional(),
  description: z.string().optional(),
  remarks: z.string().optional(),
  has_warranty: z.boolean().optional(),
  warranty_description: z.string().optional(),
  warranty_expiry_date: z.string().optional(),
  accessories: z.array(z.string()).optional(),
  other_parts: z.array(z.string()).optional(),
});

const editJobSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  status: z.enum([
    'new',
    'inspected',
    'pending_approval',
    'quote_sent',
    'approved',
    'disapproved',
    'spare_parts_pending',
    'in_progress',
    'completed',
    'cancelled',
  ]),
  priority: z.enum(['immediate', 'high', 'medium', 'low']),
  service_branch_id: z.string().min(1, 'Service branch is required'),
  delivery_branch_id: z.string().min(1, 'Delivery branch is required'),
  assigned_incharge_id: z.string().optional(),
  assigned_technician_id: z.string().optional(),
  description: z.string().optional(),
  technician_notes: z.string().optional(),
  cam_clinic_advisory_notes: z.string().optional(),
  inspection_fee: z.number().min(0),
  service_charges: z.number().min(0),
  advance_paid: z.number().min(0),
  advance_paid_date: z.string().optional(),
  gst_enabled: z.boolean(),
  estimate_delivery_date: z.string().optional(),
  products: z.array(productSchema).min(1, 'At least one product is required'),
});

type EditJobFormData = z.infer<typeof editJobSchema>;

// ─── Inline Spare Part Row ────────────────────────────────────────────────────

interface AddPartRowProps {
  jobId: string;
}

function AddPartRow({ jobId }: AddPartRowProps) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const addSparePart = useAddSparePart(jobId);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addSparePart.mutateAsync({ name: name.trim(), quantity: qty, unit_price: price });
    setName('');
    setQty(1);
    setPrice(0);
  };

  return (
    <tr className="bg-gray-50">
      <td className="px-3 py-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Part / item name"
          className="w-full border rounded px-2 py-1 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
      </td>
      <td className="px-3 py-2 w-20">
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="w-full border rounded px-2 py-1 text-sm"
        />
      </td>
      <td className="px-3 py-2 w-28">
        <input
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full border rounded px-2 py-1 text-sm"
        />
      </td>
      <td className="px-3 py-2 w-28 text-sm text-gray-500">
        {formatINR(qty * price)}
      </td>
      <td className="px-3 py-2 w-16">
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          isLoading={addSparePart.isPending}
          disabled={!name.trim()}
        >
          Add
        </Button>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: job, isLoading } = useJob(id);
  const supabase = createClient();
  const { data: spareParts = [] } = useSpareParts(id);
  const updateJob = useUpdateJob();
  const queryClient = useQueryClient();
  const deleteSparePart = useDeleteSparePart(id);

  const { data: branches } = useBranches();
  const { data: technicians } = useTechnicians();
  const { data: incharges } = useServiceIncharges();

  // Customer search state
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showChangeCustomer, setShowChangeCustomer] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const { data: searchResults } = useSearchCustomers(customerSearch);
  const createCustomer = useCreateCustomer();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditJobFormData>({
    resolver: zodResolver(editJobSchema),
    defaultValues: {
      gst_enabled: false,
      products: [{}],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'products' });

  // Populate form once job data is loaded
  useEffect(() => {
    if (job) {
      setSelectedCustomer(job.customer ?? null);

      reset({
        customer_id: job.customer_id,
        status: job.status,
        priority: job.priority,
        service_branch_id: job.service_branch_id,
        delivery_branch_id: job.delivery_branch_id,
        assigned_incharge_id: job.assigned_incharge_id || '',
        assigned_technician_id: job.assigned_technician_id || '',
        description: job.description || '',
        technician_notes: job.technician_notes || '',
        cam_clinic_advisory_notes: job.cam_clinic_advisory_notes || '',
        inspection_fee: job.inspection_fee,
        service_charges: job.service_charges,
        advance_paid: job.advance_paid,
        advance_paid_date: job.advance_paid_date || '',
        gst_enabled: job.gst_enabled,
        estimate_delivery_date: job.estimate_delivery_date || '',
        products: (job.products || []).map((p) => ({
          id: p.id,
          brand: p.brand || '',
          model: p.model || '',
          serial_number: p.serial_number || '',
          condition: p.condition || '',
          description: p.description || '',
          remarks: p.remarks || '',
          has_warranty: p.has_warranty,
          warranty_description: p.warranty_description || '',
          warranty_expiry_date: p.warranty_expiry_date || '',
          accessories: (p.accessories || []).map((a) => a.name),
          other_parts: (p.other_parts || []).map((o) => o.name),
        })),
      });
    }
  }, [job, reset]);

  // ─── Dropdown options ───────────────────────────────────────────────────────

  const statusOptions = Object.entries(JOB_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
  const priorityOptions = Object.entries(JOB_PRIORITY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
  const conditionOptions = Object.entries(PRODUCT_CONDITION_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
  const branchOptions = (branches || []).map((b) => ({ value: b.id, label: b.name }));
  const technicianOptions = [
    { value: '', label: 'Not Assigned' },
    ...(technicians || []).map((t) => ({ value: t.id, label: t.full_name })),
  ];
  const inchargeOptions = [
    { value: '', label: 'Not Assigned' },
    ...(incharges || []).map((i) => ({ value: i.id, label: i.full_name })),
  ];

  // ─── Customer helpers ───────────────────────────────────────────────────────

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setValue('customer_id', customer.id);
    setCustomerSearch('');
    setShowChangeCustomer(false);
  };

  const handleCreateCustomer = async () => {
    const name = newCustomerData.name.trim();
    const phone = newCustomerData.phone.trim();
    if (!name) {
      toast.error('Customer name is required');
      return;
    }
    if (!phone) {
      toast.error('Phone number is required');
      return;
    }
    try {
      const customer = await createCustomer.mutateAsync({
        ...newCustomerData,
        name,
        phone,
      });
      setSelectedCustomer(customer);
      setValue('customer_id', customer.id);
      setShowNewCustomer(false);
      setShowChangeCustomer(false);
      setNewCustomerData({ name: '', phone: '', email: '', address: '' });
    } catch {
      // handled by mutation
    }
  };

  // ─── Live cost totals ───────────────────────────────────────────────────────

  const watchedInspection = watch('inspection_fee') || 0;
  const watchedService = watch('service_charges') || 0;
  const watchedAdvance = watch('advance_paid') || 0;
  const watchedGst = watch('gst_enabled');
  const sparePartsTotal = spareParts.reduce((sum, p) => sum + p.total_price, 0);
  const subtotal = watchedInspection + watchedService + sparePartsTotal;
  const gstAmount = watchedGst ? subtotal * 0.18 : 0;
  const grandTotal = subtotal + gstAmount;
  const balance = grandTotal - watchedAdvance;

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const onSubmit = async (data: EditJobFormData) => {
    try {
      if (!job) return;

      // Sync product rows and their chip collections (accessories / other_parts).
      // Existing code updated only top-level job fields, so product edits were lost.
      const existingProducts = job.products || [];
      const existingProductIds = new Set(existingProducts.map((p) => p.id));
      const incomingProductIds = new Set(
        data.products
          .map((p) => p.id)
          .filter((pid): pid is string => Boolean(pid))
      );

      const toNull = (value?: string) => {
        const trimmed = value?.trim();
        return trimmed ? trimmed : null;
      };

      // Remove products deleted in form
      await Promise.all(
        [...existingProductIds]
          .filter((existingId) => !incomingProductIds.has(existingId))
          .map((existingId) => deleteProduct(supabase, existingId))
      );

      await Promise.all(data.products.map(async (product) => {
        const productPayload = {
          brand: toNull(product.brand),
          model: toNull(product.model),
          serial_number: toNull(product.serial_number),
          condition: (product.condition as ProductCondition) || null,
          description: toNull(product.description),
          remarks: toNull(product.remarks),
          has_warranty: Boolean(product.has_warranty),
          warranty_description: toNull(product.warranty_description),
          warranty_expiry_date: product.warranty_expiry_date || null,
        };

        let productId = product.id;

        if (productId) {
          await updateProduct(supabase, productId, productPayload);
        } else {
          const inserted = await createProduct(supabase, { ...productPayload, job_id: id });
          productId = inserted.id;
        }

        if (!productId) return;

        const cleanedAccessories = (product.accessories || [])
          .map((name) => name.trim())
          .filter(Boolean);
        const cleanedParts = (product.other_parts || [])
          .map((name) => name.trim())
          .filter(Boolean);

        // Clear old chips first (parallel), then insert in bulk (parallel).
        await Promise.all([
          clearAccessoriesByProductId(supabase, productId),
          clearOtherPartsByProductId(supabase, productId),
        ]);

        await Promise.all([
          addAccessoriesBulk(supabase, productId, cleanedAccessories),
          addOtherPartsBulk(supabase, productId, cleanedParts),
        ]);
      }));

      await updateJob.mutateAsync({
        id,
        input: {
          status: data.status,
          priority: data.priority,
          service_branch_id: data.service_branch_id,
          delivery_branch_id: data.delivery_branch_id,
          assigned_incharge_id: data.assigned_incharge_id || null,
          assigned_technician_id: data.assigned_technician_id || null,
          description: data.description || null,
          technician_notes: data.technician_notes || null,
          cam_clinic_advisory_notes: data.cam_clinic_advisory_notes || null,
          inspection_fee: data.inspection_fee,
          service_charges: data.service_charges,
          advance_paid: data.advance_paid,
          advance_paid_date: data.advance_paid > 0 ? (data.advance_paid_date || null) : null,
          gst_enabled: data.gst_enabled,
          estimate_delivery_date: data.estimate_delivery_date || null,
        },
      });

      // Ensure details page fetches the freshest nested product/chip data.
      await queryClient.invalidateQueries({ queryKey: ['job', id] });

      // Replace edit entry in browser history to avoid back navigation loops.
      router.replace(`/jobs/${id}`);
    } catch {
      // handled by mutation
    }
  };

  // ─── Loading / not found states ─────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Edit Job" />
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-32 bg-gray-100 animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Edit Job" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <p className="text-gray-500">Job not found</p>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      <Header title="Edit Job" />

      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-6">

          {/* Back + job number */}
          <div className="flex items-center gap-4">
            <Button type="button" variant="outline" size="sm" onClick={() => router.push(`/jobs/${id}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold">{job.job_number}</h2>
          </div>

          {/* ── Customer Information ── */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCustomer && !showChangeCustomer ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedCustomer.name}</p>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="h-3 w-3" />
                        {selectedCustomer.phone}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChangeCustomer(true)}
                  >
                    Change
                  </Button>
                </div>
              ) : showNewCustomer ? (
                <div className="space-y-3 p-4 border rounded-lg">
                  <Input
                    label="Name"
                    value={newCustomerData.name}
                    onChange={(e) =>
                      setNewCustomerData((d) => ({ ...d, name: e.target.value }))
                    }
                    required
                    placeholder="Customer name"
                  />
                  <Input
                    label="Phone"
                    value={newCustomerData.phone}
                    onChange={(e) =>
                      setNewCustomerData((d) => ({ ...d, phone: e.target.value }))
                    }
                    required
                    placeholder="Phone number (required)"
                    autoComplete="tel"
                  />
                  <Input
                    label="Email (optional)"
                    value={newCustomerData.email}
                    onChange={(e) =>
                      setNewCustomerData((d) => ({ ...d, email: e.target.value }))
                    }
                  />
                  <Input
                    label="Address (optional)"
                    value={newCustomerData.address}
                    onChange={(e) =>
                      setNewCustomerData((d) => ({ ...d, address: e.target.value }))
                    }
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleCreateCustomer}
                      isLoading={createCustomer.isPending}
                    >
                      Create Customer
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewCustomer(false);
                        setShowChangeCustomer(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search customer by name or phone..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {searchResults && searchResults.length > 0 && (
                    <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                      {searchResults.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          className="w-full p-3 text-left hover:bg-gray-50"
                          onClick={() => handleSelectCustomer(customer)}
                        >
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-gray-600">{customer.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewCustomer(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Customer
                    </Button>
                    {selectedCustomer && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowChangeCustomer(false)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {errors.customer_id && (
                <p className="text-sm text-red-600">{errors.customer_id.message}</p>
              )}
            </CardContent>
          </Card>

          {/* ── Job Details ── */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Select
                  label="Service Branch"
                  options={branchOptions}
                  placeholder="Select branch"
                  error={errors.service_branch_id?.message}
                  {...register('service_branch_id')}
                />
                <Select
                  label="Delivery Branch"
                  options={branchOptions}
                  placeholder="Select branch"
                  error={errors.delivery_branch_id?.message}
                  {...register('delivery_branch_id')}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Select
                  label="Status"
                  options={statusOptions}
                  {...register('status')}
                />
                <Select
                  label="Priority"
                  options={priorityOptions}
                  {...register('priority')}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Select
                  label="Service Incharge"
                  options={inchargeOptions}
                  {...register('assigned_incharge_id')}
                />
                <Select
                  label="Technician"
                  options={technicianOptions}
                  {...register('assigned_technician_id')}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  type="number"
                  label="Inspection Fee (₹)"
                  {...register('inspection_fee', { valueAsNumber: true })}
                />
                <Input
                  type="number"
                  label="Service Charges (₹)"
                  {...register('service_charges', { valueAsNumber: true })}
                />
                <Input
                  type="date"
                  label="Estimate Delivery"
                  {...register('estimate_delivery_date')}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Advance Paid (₹)"
                  {...register('advance_paid', { valueAsNumber: true })}
                />
                <Input
                  type="date"
                  label="Advance Paid Date"
                  {...register('advance_paid_date')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problem Description
                </label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  {...register('description')}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Products ── */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Products</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({})}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Product {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Input label="Brand" {...register(`products.${index}.brand`)} />
                    <Input label="Model" {...register(`products.${index}.model`)} />
                    <Input
                      label="Serial Number"
                      {...register(`products.${index}.serial_number`)}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Select
                      label="Condition"
                      options={conditionOptions}
                      placeholder="Select condition"
                      {...register(`products.${index}.condition`)}
                    />
                    <Controller
                      control={control}
                      name={`products.${index}.accessories`}
                      defaultValue={[]}
                      render={({ field: f }) => (
                        <ChipInput
                          label="Accessories"
                          value={f.value || []}
                          onChange={f.onChange}
                          placeholder="Add accessory, press Enter"
                        />
                      )}
                    />
                  </div>
                  <Controller
                    control={control}
                    name={`products.${index}.other_parts`}
                    defaultValue={[]}
                    render={({ field: f }) => (
                      <ChipInput
                        label="Other Parts"
                        value={f.value || []}
                        onChange={f.onChange}
                        placeholder="Add part, press Enter (e.g. Original box)"
                      />
                    )}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Description
                    </label>
                    <textarea
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      rows={2}
                      {...register(`products.${index}.description`)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Remarks
                    </label>
                    <textarea
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      rows={2}
                      {...register(`products.${index}.remarks`)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`products.${index}.has_warranty`}
                        className="rounded border-gray-300"
                        {...register(`products.${index}.has_warranty`)}
                      />
                      <label
                        htmlFor={`products.${index}.has_warranty`}
                        className="text-sm font-medium text-gray-700"
                      >
                        Has Warranty
                      </label>
                    </div>
                    {/* eslint-disable-next-line react-hooks/incompatible-library -- RHF watch for conditional warranty fields */}
                    {watch(`products.${index}.has_warranty`) && (
                      <div className="grid md:grid-cols-2 gap-4 pl-5">
                        <Input
                          label="Warranty Description"
                          {...register(`products.${index}.warranty_description`)}
                        />
                        <Input
                          type="date"
                          label="Warranty Expiry Date"
                          {...register(`products.${index}.warranty_expiry_date`)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {errors.products && (
                <p className="text-sm text-red-600">{errors.products.message}</p>
              )}
            </CardContent>
          </Card>

          {/* ── Parts & Items Used ── */}
          <Card>
            <CardHeader>
              <CardTitle>Parts &amp; Items Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2 w-20">Qty</th>
                      <th className="px-3 py-2 w-28">Unit Price (₹)</th>
                      <th className="px-3 py-2 w-28">Total</th>
                      <th className="px-3 py-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {spareParts.map((part) => (
                      <tr key={part.id}>
                        <td className="px-3 py-2">{part.name}</td>
                        <td className="px-3 py-2">{part.quantity}</td>
                        <td className="px-3 py-2">{formatINR(part.unit_price)}</td>
                        <td className="px-3 py-2 font-medium">{formatINR(part.total_price)}</td>
                        <td className="px-3 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSparePart.mutate(part.id)}
                            disabled={deleteSparePart.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    <AddPartRow jobId={id} />
                  </tbody>
                </table>
              </div>

              {/* Running total */}
              <div className="mt-4 border-t pt-4 space-y-2 text-sm max-w-xs ml-auto">
                <div className="flex justify-between">
                  <span className="text-gray-600">Inspection Fee</span>
                  <span>{formatINR(watchedInspection)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Charges</span>
                  <span>{formatINR(watchedService)}</span>
                </div>
                {spareParts.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Parts Total</span>
                    <span>{formatINR(sparePartsTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="gst_enabled"
                      className="rounded border-gray-300"
                      {...register('gst_enabled')}
                    />
                    <label htmlFor="gst_enabled" className="text-gray-600 cursor-pointer">
                      GST (18%)
                    </label>
                  </div>
                  <span>{formatINR(gstAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Grand Total</span>
                  <span>{formatINR(grandTotal)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Advance Paid</span>
                  <span>- {formatINR(watchedAdvance)}</span>
                </div>
                <div
                  className={`flex justify-between font-bold text-base border-t pt-2 ${
                    balance > 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  <span>Balance Due</span>
                  <span>{formatINR(balance)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Notes ── */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Technician Notes
                </label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  {...register('technician_notes')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advisory Notes (for Quote)
                </label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  {...register('cam_clinic_advisory_notes')}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Actions ── */}
          <div className="flex gap-4 justify-end pb-6">
            <Button type="button" variant="outline" onClick={() => router.push(`/jobs/${id}`)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || updateJob.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

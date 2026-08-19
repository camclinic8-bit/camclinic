'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Search, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChipInput } from '@/components/ui/ChipInput';
import { ProductWarrantyFields } from '@/components/jobs/ProductWarrantyFields';
import { ProductImagesFields } from '@/components/jobs/ProductImagesFields';
import { AccessoryCheckboxList } from '@/components/inventory/AccessoryCheckboxList';
import { useCreateJob } from '@/hooks/useJobs';
import { useSearchCustomers, useCreateCustomer } from '@/hooks/useCustomers';
import { useBranches } from '@/hooks/useBranches';
import { useTechnicians, useServiceIncharges } from '@/hooks/useTechnicians';
import { JOB_PRIORITY_LABELS, PRODUCT_CONDITION_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_METHODS, ProductCondition } from '@/types/enums';
import { Customer } from '@/types/customer';
import { toast } from 'sonner';
import {
  chipStringArray,
  optionalDateInput,
  optionalNonNegativeNumber,
  optionalStr,
} from '@/lib/validation/optionalFields';

const productSchema = z.object({
  brand: optionalStr,
  model: optionalStr,
  serial_number: optionalStr,
  condition: optionalStr,
  description: optionalStr,
  remarks: optionalStr,
  has_warranty: z.coerce.boolean().default(false),
  warranty_description: optionalStr,
  warranty_expiry_date: optionalStr,
  repeat_job_number: optionalStr,
  other_job_number: optionalStr,
  warranty_images: z.array(z.string()).optional().default([]),
  product_images: z.array(z.string()).optional().default([]),
  accessories: chipStringArray,
  other_parts: chipStringArray,
});

const jobSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  service_branch_id: z.string().min(1, 'Service branch is required'),
  delivery_branch_id: z.string().min(1, 'Delivery branch is required'),
  assigned_incharge_id: optionalStr,
  assigned_technician_id: optionalStr,
  priority: z.enum(['immediate', 'high', 'medium', 'low']),
  description: optionalStr,
  inspection_fee: optionalNonNegativeNumber,
  advance_paid: optionalNonNegativeNumber,
  advance_paid_date: optionalDateInput,
  advance_payment_method: z.enum(['cash', 'upi', 'card', 'bank_transfer']).default('cash'),
  estimate_delivery_date: optionalDateInput,
  spare_parts_total_cost: optionalNonNegativeNumber,
  spare_parts_private_details: z.array(
    z.object({
      name: z.string(),
      quantity: z.number(),
      unit_cost: z.number(),
      hsn_code: z.string().nullable().optional(),
    })
  ).optional().default([]),
  products: z.array(productSchema).min(1, 'At least one product is required'),
  alternative_contact: optionalStr,
});

type JobFormData = z.infer<typeof jobSchema>;

export default function NewJobPage() {
  const router = useRouter();
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', email: '', address: '', alternative_contact: '' });

  const { data: searchResults } = useSearchCustomers(customerSearch);
  const { data: branches } = useBranches();
  const { data: technicians } = useTechnicians();
  const { data: incharges } = useServiceIncharges();
  const createJob = useCreateJob();
  const createCustomer = useCreateCustomer();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema) as Resolver<JobFormData>,
    defaultValues: {
      priority: 'medium',
      advance_payment_method: 'cash',
      alternative_contact: '',
      spare_parts_total_cost: 0,
      products: [{ has_warranty: false, accessories: [], other_parts: [], warranty_images: [], product_images: [] }],
      spare_parts_private_details: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'products',
    keyName: '_rhfId',
  });

  const priorityOptions = Object.entries(JOB_PRIORITY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const conditionOptions = Object.entries(PRODUCT_CONDITION_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const paymentMethodOptions = PAYMENT_METHODS.map((m) => ({
    value: m,
    label: PAYMENT_METHOD_LABELS[m],
  }));

  const branchOptions = (branches || []).map(b => ({ value: b.id, label: b.name }));
  const technicianOptions = [
    { value: '', label: 'Not Assigned' },
    ...(technicians || []).map(t => ({ value: t.id, label: t.full_name })),
  ];
  const inchargeOptions = [
    { value: '', label: 'Not Assigned' },
    ...(incharges || []).map(i => ({ value: i.id, label: i.full_name })),
  ];

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setValue('customer_id', customer.id);
    setCustomerSearch('');
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
        name,
        phone,
        email: newCustomerData.email.trim() || null,
        address: newCustomerData.address.trim() || null,
      });
      setSelectedCustomer(customer);
      setValue('customer_id', customer.id);
      setValue('alternative_contact', newCustomerData.alternative_contact.trim());
      setShowNewCustomer(false);
      setNewCustomerData({ name: '', phone: '', email: '', address: '', alternative_contact: '' });
    } catch {
      // Error handled by mutation
    }
  };

  const onSubmit = async (data: JobFormData) => {
    try {
      const jobInput = {
        ...data,
        assigned_incharge_id: data.assigned_incharge_id || null,
        assigned_technician_id: data.assigned_technician_id || null,
        inspection_fee: data.inspection_fee ?? 0,
        advance_paid: data.advance_paid ?? 0,
        advance_paid_date: data.advance_paid_date?.trim() || null,
        estimate_delivery_date: data.estimate_delivery_date?.trim() || null,
        spare_parts_total_cost: data.spare_parts_total_cost ?? 0,
        spare_parts_private_details: data.spare_parts_private_details || [],
        products: data.products.map(p => ({
          ...p,
          condition: p.condition as ProductCondition || null,
          accessories: p.accessories || [],
          other_parts: p.other_parts || [],
          warranty_images: p.warranty_images || [],
        })),
      };

      const job = await createJob.mutateAsync(jobInput);
      router.push(`/jobs/${job.id}`);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="New Job" />
      
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto mb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/jobs')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit, (errors) => {
            console.error('Validation Errors:', errors);
            const errFields = Object.keys(errors).join(', ');
            toast.error(`Please fix validation errors on: ${errFields}`);
          })}
          className="max-w-4xl mx-auto space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCustomer ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium">{selectedCustomer.name}</p>
                      <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setValue('customer_id', '');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                  <div>
                    <Input
                      label="Alternative Contact (Optional)"
                      placeholder="e.g. Backup Phone, Spouse or Office number"
                      {...register('alternative_contact')}
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Used if we cannot reach the primary customer.
                    </p>
                  </div>
                </div>
              ) : showNewCustomer ? (
                <div className="space-y-3 p-4 border rounded-lg">
                  <Input
                    label="Name"
                    value={newCustomerData.name}
                    onChange={(e) => setNewCustomerData(d => ({ ...d, name: e.target.value }))}
                    required
                    placeholder="Customer name"
                  />
                  <Input
                    label="Phone"
                    value={newCustomerData.phone}
                    onChange={(e) => setNewCustomerData(d => ({ ...d, phone: e.target.value }))}
                    required
                    placeholder="Phone number (required)"
                    autoComplete="tel"
                  />
                  <Input
                    label="Email (optional)"
                    value={newCustomerData.email}
                    onChange={(e) => setNewCustomerData(d => ({ ...d, email: e.target.value }))}
                  />
                  <Input
                    label="Address (optional)"
                    value={newCustomerData.address}
                    onChange={(e) => setNewCustomerData(d => ({ ...d, address: e.target.value }))}
                  />
                  <Input
                    label="Alternative Contact (Optional)"
                    value={newCustomerData.alternative_contact}
                    onChange={(e) => setNewCustomerData(d => ({ ...d, alternative_contact: e.target.value }))}
                    placeholder="e.g. Backup Phone, Spouse or Office number"
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
                      onClick={() => setShowNewCustomer(false)}
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowNewCustomer(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Customer
                  </Button>
                </div>
              )}
              {errors.customer_id && (
                <p className="text-sm text-red-600">{errors.customer_id.message}</p>
              )}
            </CardContent>
          </Card>

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
              <div className="grid md:grid-cols-3 gap-4">
                <Select
                  label="Priority"
                  options={priorityOptions}
                  {...register('priority')}
                />
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
                  label="Inspection Fee (₹) (optional)"
                  {...register('inspection_fee', { valueAsNumber: true })}
                />
                <Input
                  type="number"
                  label="Advance Paid (₹) (optional)"
                  {...register('advance_paid', { valueAsNumber: true })}
                />
                <Input
                  type="date"
                  label="Estimate Delivery (optional)"
                  {...register('estimate_delivery_date')}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Advance Paid Date (optional)"
                  {...register('advance_paid_date')}
                />
                <Select
                  label="Advance Payment Method"
                  options={paymentMethodOptions}
                  {...register('advance_payment_method')}
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Products</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ has_warranty: false, accessories: [], other_parts: [], warranty_images: [], product_images: [] })
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Product
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, index) => (
                <div key={field._rhfId} className="p-4 border rounded-lg space-y-4">
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
                    <Input
                      label="Brand"
                      {...register(`products.${index}.brand`)}
                    />
                    <Input
                      label="Model"
                      {...register(`products.${index}.model`)}
                    />
                    <Input
                      label="Serial Number"
                      {...register(`products.${index}.serial_number`)}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      label="Repeat Job Number"
                      placeholder="e.g. CC-00001"
                      {...register(`products.${index}.repeat_job_number`)}
                    />
                    <Input
                      label="Other Job Number"
                      placeholder="e.g. CC-00002"
                      {...register(`products.${index}.other_job_number`)}
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
                      render={({ field }) => (
                        <AccessoryCheckboxList
                          value={field.value || []}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  <Controller
                    control={control}
                    name={`products.${index}.other_parts`}
                    defaultValue={[]}
                    render={({ field }) => (
                      <ChipInput
                        label="Other Parts"
                        value={field.value || []}
                        onChange={field.onChange}
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
                  <ProductWarrantyFields
                    control={control}
                    index={index}
                    register={register}
                    setValue={setValue}
                  />
                  <ProductImagesFields
                    control={control}
                    index={index}
                    setValue={setValue}
                  />
                </div>
              ))}
              {errors.products && (
                <p className="text-sm text-red-600">{errors.products.message}</p>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || createJob.isPending}>
              Create Job
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

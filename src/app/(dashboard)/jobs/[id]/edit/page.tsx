'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useJob, useUpdateJob } from '@/hooks/useJobs';
import { useBranches } from '@/hooks/useBranches';
import { useTechnicians, useServiceIncharges } from '@/hooks/useTechnicians';
import { JOB_PRIORITY_LABELS, JOB_STATUS_LABELS } from '@/types/enums';

const editJobSchema = z.object({
  status: z.enum(['new', 'inspected', 'pending_approval', 'quote_sent', 'approved', 'disapproved', 'spare_parts_pending', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['immediate', 'high', 'medium', 'low']),
  service_branch_id: z.string().min(1),
  delivery_branch_id: z.string().min(1),
  assigned_incharge_id: z.string().optional(),
  assigned_technician_id: z.string().optional(),
  description: z.string().optional(),
  technician_notes: z.string().optional(),
  cam_clinic_advisory_notes: z.string().optional(),
  inspection_fee: z.number().min(0),
  service_charges: z.number().min(0),
  advance_paid: z.number().min(0),
  gst_enabled: z.boolean(),
  estimate_delivery_date: z.string().optional(),
});

type EditJobFormData = z.infer<typeof editJobSchema>;

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: job, isLoading } = useJob(id);
  const updateJob = useUpdateJob();
  const { data: branches } = useBranches();
  const { data: technicians } = useTechnicians();
  const { data: incharges } = useServiceIncharges();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditJobFormData>({
    resolver: zodResolver(editJobSchema),
  });

  useEffect(() => {
    if (job) {
      reset({
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
        gst_enabled: job.gst_enabled,
        estimate_delivery_date: job.estimate_delivery_date || '',
      });
    }
  }, [job, reset]);

  const statusOptions = Object.entries(JOB_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const priorityOptions = Object.entries(JOB_PRIORITY_LABELS).map(([value, label]) => ({
    value,
    label,
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

  const onSubmit = async (data: EditJobFormData) => {
    try {
      await updateJob.mutateAsync({
        id,
        input: {
          ...data,
          assigned_incharge_id: data.assigned_incharge_id || null,
          assigned_technician_id: data.assigned_technician_id || null,
        },
      });
      router.push(`/jobs/${id}`);
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Edit Job" />
        <div className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="h-64 bg-gray-100 animate-pulse rounded" />
              </CardContent>
            </Card>
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

  return (
    <div className="flex flex-col h-full">
      <Header title="Edit Job" />
      
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold">{job.job_number}</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status & Priority</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Select
                    label="Service Branch"
                    options={branchOptions}
                    {...register('service_branch_id')}
                  />
                  <Select
                    label="Delivery Branch"
                    options={branchOptions}
                    {...register('delivery_branch_id')}
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
                <Input
                  type="date"
                  label="Estimate Delivery Date"
                  {...register('estimate_delivery_date')}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Charges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    type="number"
                    label="Advance Paid (₹)"
                    {...register('advance_paid', { valueAsNumber: true })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="gst_enabled"
                    className="rounded border-gray-300"
                    {...register('gst_enabled')}
                  />
                  <label htmlFor="gst_enabled" className="text-sm">
                    Enable GST (18% on service charges)
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting || updateJob.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

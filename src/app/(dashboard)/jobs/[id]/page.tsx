'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Edit, 
  FileText, 
  Download,
  User,
  MapPin,
  Calendar,
  Phone
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge';
import { JobPriorityBadge } from '@/components/jobs/JobPriorityBadge';
import { useJob, useUpdateJobStatus } from '@/hooks/useJobs';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatDateTime, isExpired } from '@/lib/utils/dates';
import { formatINR } from '@/lib/utils/currency';
import { generateReceipt, generateQuote, generateInvoice, downloadPDF } from '@/lib/utils/pdf';
import { JOB_STATUS_LABELS, PRODUCT_CONDITION_LABELS, JobStatus } from '@/types/enums';

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: job, isLoading } = useJob(id);
  const updateStatus = useUpdateJobStatus();
  const { canSetAnyStatus } = useAuth();

  const handleStatusChange = async (newStatus: JobStatus) => {
    if (!job) return;
    await updateStatus.mutateAsync({ id: job.id, status: newStatus });
  };

  const handleDownloadReceipt = () => {
    if (!job) return;
    const doc = generateReceipt(job);
    downloadPDF(doc, `receipt-${job.job_number}.pdf`);
  };

  const handleDownloadQuote = () => {
    if (!job) return;
    const doc = generateQuote(job);
    downloadPDF(doc, `quote-${job.job_number}.pdf`);
  };

  const handleDownloadInvoice = () => {
    if (!job) return;
    const doc = generateInvoice(job);
    downloadPDF(doc, `invoice-${job.job_number}.pdf`);
  };

  const statusOptions = Object.entries(JOB_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Job Details" />
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
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
        <Header title="Job Details" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Job not found</p>
            <Link href="/jobs">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Job Details" />
      
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-xl font-bold">{job.job_number}</h2>
                <p className="text-sm text-gray-500">Created {formatDateTime(job.created_at)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <JobPriorityBadge priority={job.priority} />
              <JobStatusBadge status={job.status} />
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 rounded-full">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">{job.customer?.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Phone className="h-4 w-4" />
                        {job.customer?.phone}
                      </div>
                      {job.customer?.address && (
                        <p className="text-sm text-gray-500 mt-1">{job.customer.address}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Products</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {job.products?.map((product, index) => (
                    <div key={product.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">
                          {product.brand} {product.model}
                        </h4>
                        {product.condition && (
                          <Badge variant="gray">
                            {PRODUCT_CONDITION_LABELS[product.condition]}
                          </Badge>
                        )}
                      </div>
                      {product.serial_number && (
                        <p className="text-sm text-gray-600">S/N: {product.serial_number}</p>
                      )}
                      {product.remarks && (
                        <p className="text-sm text-gray-500 mt-2">{product.remarks}</p>
                      )}
                      {product.accessories && product.accessories.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Accessories: </span>
                          <span className="text-sm">{product.accessories.map(a => a.name).join(', ')}</span>
                        </div>
                      )}
                      {product.has_warranty && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                          <span className="font-medium">Warranty: </span>
                          {product.warranty_description}
                          {product.warranty_expiry_date && (
                            <span className={isExpired(product.warranty_expiry_date) ? 'text-red-600' : ''}>
                              {' '}(Expires: {formatDate(product.warranty_expiry_date)})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {job.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Problem Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{job.description}</p>
                  </CardContent>
                </Card>
              )}

              {job.technician_notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Technician Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{job.technician_notes}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Status History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {job.status_history?.map((history) => (
                      <div key={history.id} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                        <div>
                          <p>
                            <span className="font-medium">{JOB_STATUS_LABELS[history.to_status]}</span>
                            {history.from_status && (
                              <span className="text-gray-500"> from {JOB_STATUS_LABELS[history.from_status]}</span>
                            )}
                          </p>
                          <p className="text-gray-500">
                            {formatDateTime(history.created_at)}
                            {history.changed_by_user && ` by ${history.changed_by_user.full_name}`}
                          </p>
                          {history.notes && <p className="text-gray-600 mt-1">{history.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {canSetAnyStatus && (
                    <Select
                      label="Update Status"
                      options={statusOptions}
                      value={job.status}
                      onChange={(e) => handleStatusChange(e.target.value as JobStatus)}
                      disabled={updateStatus.isPending}
                    />
                  )}
                  <Link href={`/jobs/${job.id}/edit`} className="block">
                    <Button variant="outline" className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Job
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={handleDownloadReceipt}>
                    <FileText className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                  {(job.status === 'quote_sent' || job.grand_total > 0) && (
                    <Button variant="outline" className="w-full justify-start" onClick={handleDownloadQuote}>
                      <FileText className="h-4 w-4 mr-2" />
                      Download Quote
                    </Button>
                  )}
                  {job.status === 'completed' && (
                    <Button variant="outline" className="w-full justify-start" onClick={handleDownloadInvoice}>
                      <FileText className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Charges</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inspection Fee</span>
                      <span>{formatINR(job.inspection_fee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service Charges</span>
                      <span>{formatINR(job.service_charges)}</span>
                    </div>
                    {job.spare_parts && job.spare_parts.length > 0 && (
                      <>
                        <div className="border-t pt-2 mt-2">
                          <p className="text-gray-600 mb-1">Spare Parts:</p>
                          {job.spare_parts.map((part) => (
                            <div key={part.id} className="flex justify-between text-xs">
                              <span>{part.name} x{part.quantity}</span>
                              <span>{formatINR(part.total_price)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {job.gst_enabled && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">GST (18%)</span>
                        <span>{formatINR(job.gst_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium border-t pt-2">
                      <span>Grand Total</span>
                      <span>{formatINR(job.grand_total)}</span>
                    </div>
                    {job.advance_paid > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Advance Paid</span>
                        <span>-{formatINR(job.advance_paid)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Balance</span>
                      <span className={job.balance_amount > 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatINR(job.balance_amount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Assignment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Service Branch</p>
                      <p className="font-medium">{job.service_branch?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Delivery Branch</p>
                      <p className="font-medium">{job.delivery_branch?.name}</p>
                    </div>
                  </div>
                  {job.assigned_technician && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Technician</p>
                        <p className="font-medium">{job.assigned_technician.full_name}</p>
                      </div>
                    </div>
                  )}
                  {job.estimate_delivery_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Est. Delivery</p>
                        <p className="font-medium">{formatDate(job.estimate_delivery_date)}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

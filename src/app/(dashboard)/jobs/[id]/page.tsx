'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  FileText,
  User,
  MapPin,
  Calendar,
  Phone,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge';
import { JobPriorityBadge } from '@/components/jobs/JobPriorityBadge';
import { useJob, useUpdateJobStatus } from '@/hooks/useJobs';
import { useUpdateJobCharges } from '@/hooks/useBilling';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatDateTime, isExpired } from '@/lib/utils/dates';
import { formatINR } from '@/lib/utils/currency';
import { JOB_STATUS_LABELS, PRODUCT_CONDITION_LABELS, JobStatus } from '@/types/enums';
import { toast } from 'sonner';

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: job, isPending } = useJob(id);
  const updateStatus = useUpdateJobStatus();
  const updateCharges = useUpdateJobCharges(id);
  const { canSetAnyStatus } = useAuth();

  const [showPaymentInput, setShowPaymentInput] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const handleStatusChange = async (newStatus: JobStatus) => {
    if (!job) return;
    await updateStatus.mutateAsync({ id: job.id, status: newStatus });
  };

  const handleRecordPayment = async () => {
    if (!job) return;
    const maxPay = roundMoney(job.balance_amount);
    const amount = roundMoney(parseFloat(paymentAmount));
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount greater than zero.');
      return;
    }
    if (amount > maxPay) {
      toast.error(`You can collect at most ${formatINR(maxPay)} (current balance due).`);
      return;
    }
    const newAdvance = roundMoney((job.advance_paid || 0) + amount);
    await updateCharges.mutateAsync({
      advance_paid: newAdvance,
      advance_paid_date: new Date().toISOString().split('T')[0],
    });
    setPaymentAmount('');
    setShowPaymentInput(false);
  };

  const handlePaymentAmountChange = (raw: string, balanceDue: number) => {
    if (raw === '') {
      setPaymentAmount('');
      return;
    }
    const n = parseFloat(raw);
    if (isNaN(n)) {
      setPaymentAmount(raw);
      return;
    }
    const maxPay = roundMoney(balanceDue);
    if (n < 0) {
      setPaymentAmount('0');
      return;
    }
    if (n > maxPay) {
      setPaymentAmount(
        Number.isInteger(maxPay) ? String(maxPay) : maxPay.toFixed(2)
      );
      return;
    }
    setPaymentAmount(raw);
  };

  const paymentStatus =
    !job
      ? null
      : job.balance_amount <= 0
      ? 'paid'
      : job.advance_paid > 0
      ? 'partial'
      : 'unpaid';

  const handleDownloadReceipt = async () => {
    if (!job) return;
    const { generateReceipt, downloadPDF } = await import('@/lib/utils/pdf');
    const doc = generateReceipt(job);
    downloadPDF(doc, `receipt-${job.job_number}.pdf`);
  };

  const handleDownloadQuote = async () => {
    if (!job) return;
    const { generateQuote, downloadPDF } = await import('@/lib/utils/pdf');
    const doc = generateQuote(job);
    downloadPDF(doc, `quote-${job.job_number}.pdf`);
  };

  const handleDownloadInvoice = async () => {
    if (!job) return;
    const { generateInvoice, downloadPDF } = await import('@/lib/utils/pdf');
    const doc = generateInvoice(job);
    downloadPDF(doc, `invoice-${job.job_number}.pdf`);
  };

  const statusOptions = Object.entries(JOB_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  if (isPending) {
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
              <Button variant="outline" size="sm" onClick={() => router.push('/jobs')}>
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
                  {job.products && job.products.length > 0 ? (
                    job.products.map((product, index) => (
                      <div key={product.id} className="p-4 border rounded-lg space-y-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Product #{index + 1}</p>
                            <h4 className="font-semibold text-base text-gray-900">
                              {[product.brand, product.model].filter(Boolean).join(' ') || 'Unnamed Product'}
                            </h4>
                          </div>
                          {product.condition ? (
                            <Badge variant="gray">
                              {PRODUCT_CONDITION_LABELS[product.condition]}
                            </Badge>
                          ) : (
                            <Badge variant="gray">Condition Not Set</Badge>
                          )}
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 text-sm">
                          <div className="rounded-md bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Brand</p>
                            <p className="font-medium text-gray-900">{product.brand || '-'}</p>
                          </div>
                          <div className="rounded-md bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Model</p>
                            <p className="font-medium text-gray-900">{product.model || '-'}</p>
                          </div>
                          <div className="rounded-md bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Serial Number</p>
                            <p className="font-medium text-gray-900">{product.serial_number || '-'}</p>
                          </div>
                          <div className="rounded-md bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Warranty</p>
                            <p className="font-medium text-gray-900">{product.has_warranty ? 'Yes' : 'No'}</p>
                          </div>
                        </div>

                        {product.description && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Product Description</p>
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-md p-3">{product.description}</p>
                          </div>
                        )}

                        {product.remarks && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Remarks</p>
                            <p className="text-sm text-gray-700 bg-gray-50 rounded-md p-3">{product.remarks}</p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs text-gray-500 mb-1">Accessories</p>
                          {product.accessories && product.accessories.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {product.accessories.map((a, idx) => (
                                <span
                                  key={typeof a === 'string' ? `${product.id}-acc-${idx}` : a.id}
                                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                >
                                  {typeof a === 'string' ? a : a.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No accessories added</p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs text-gray-500 mb-1">Other Parts</p>
                          {product.other_parts && product.other_parts.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {product.other_parts.map((o, idx) => (
                                <span
                                  key={typeof o === 'string' ? `${product.id}-part-${idx}` : o.id}
                                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                                >
                                  {typeof o === 'string' ? o : o.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No other parts added</p>
                          )}
                        </div>

                        {product.has_warranty && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                            <p className="font-medium text-yellow-900">Warranty Details</p>
                            <p className="text-yellow-800 mt-1">
                              {product.warranty_description || 'Warranty marked, description not provided'}
                            </p>
                            {product.warranty_expiry_date && (
                              <p className={`mt-1 ${isExpired(product.warranty_expiry_date) ? 'text-red-600' : 'text-yellow-900'}`}>
                                Expires: {formatDate(product.warranty_expiry_date)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No products are attached to this job.</p>
                  )}
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
                  <div className="flex items-center justify-between">
                    <CardTitle>Charges</CardTitle>
                    {paymentStatus === 'paid' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Paid
                      </span>
                    )}
                    {paymentStatus === 'partial' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                        <Clock className="h-3.5 w-3.5" />
                        Partially Paid
                      </span>
                    )}
                    {paymentStatus === 'unpaid' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Unpaid
                      </span>
                    )}
                  </div>
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
                      <div className="border-t pt-2 mt-2">
                        <p className="text-gray-600 mb-1">Parts Used:</p>
                        {job.spare_parts.map((part) => (
                          <div key={part.id} className="flex justify-between text-xs">
                            <span>{part.name} ×{part.quantity}</span>
                            <span>{formatINR(part.total_price)}</span>
                          </div>
                        ))}
                      </div>
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
                    <div className="flex justify-between font-bold text-base border-t pt-2">
                      <span>Balance Due</span>
                      <span className={job.balance_amount > 0 ? 'text-red-600' : 'text-green-600'}>
                        {formatINR(job.balance_amount)}
                      </span>
                    </div>

                    {/* Record Payment */}
                    {job.balance_amount > 0 && (
                      <div className="pt-2">
                        {showPaymentInput ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min={0}
                                max={job.balance_amount}
                                step="0.01"
                                inputMode="decimal"
                                value={paymentAmount}
                                onChange={(e) =>
                                  handlePaymentAmountChange(e.target.value, job.balance_amount)
                                }
                                placeholder={`Max ${formatINR(job.balance_amount)}`}
                                className="flex-1 border rounded px-2 py-1.5 text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleRecordPayment()}
                                autoFocus
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleRecordPayment}
                                isLoading={updateCharges.isPending}
                                disabled={(() => {
                                  const v = roundMoney(parseFloat(paymentAmount));
                                  const maxPay = roundMoney(job.balance_amount);
                                  return (
                                    !paymentAmount.trim() ||
                                    isNaN(v) ||
                                    v <= 0 ||
                                    v > maxPay
                                  );
                                })()}
                              >
                                Save
                              </Button>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setShowPaymentInput(false);
                                setPaymentAmount('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setShowPaymentInput(true)}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Record Payment
                          </Button>
                        )}
                      </div>
                    )}
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

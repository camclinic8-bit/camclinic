'use client';

import { use, useState, useEffect } from 'react';
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
  Lock,
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
import { formatDate, formatDateTime, isExpired, getLocalToday } from '@/lib/utils/dates';
import { formatINR } from '@/lib/utils/currency';
import { getActiveTermsAndConditions } from '@/lib/db/terms';
import { useBranchStore } from '@/stores/branchStore';
import { JOB_STATUS_LABELS, PRODUCT_CONDITION_LABELS, JobStatus } from '@/types/enums';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { addPaymentTransaction } from '@/lib/db/jobs';

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: job, isPending } = useJob(id);
  const updateStatus = useUpdateJobStatus();
  const updateCharges = useUpdateJobCharges(id);
  const { canSetAnyStatus, user } = useAuth();
  const { selectedBranchId } = useBranchStore();

  const [showPaymentInput, setShowPaymentInput] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [terms, setTerms] = useState<any>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Fetch active terms and conditions (global)
  useEffect(() => {
    const fetchTerms = async () => {
      const supabase = createClient();
      try {
        const activeTerms = await getActiveTermsAndConditions(supabase);
        setTerms(activeTerms);
      } catch (error) {
        console.error('Failed to fetch terms:', error);
      }
    };
    fetchTerms();
  }, []);

  const handleStatusChange = async (newStatus: JobStatus) => {
    if (!job) return;
    await updateStatus.mutateAsync({ id: job.id, status: newStatus });
  };

  const handleRecordPayment = async () => {
    if (!job || !user) return;
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
    
    // Record payment transaction
    const supabase = createClient();
    try {
      await addPaymentTransaction(supabase, job.id, amount, user.id, 'cash');
    } catch (error) {
      toast.error('Failed to record payment transaction');
      return;
    }
    
    await updateCharges.mutateAsync({
      advance_paid: newAdvance,
      advance_paid_date: getLocalToday(),
    });
    setPaymentAmount('');
    setShowPaymentInput(false);
    toast.success(`Payment of ${formatINR(amount)} recorded successfully`);
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
    const doc = await generateReceipt(job, job.service_branch, terms);
    downloadPDF(doc, `receipt-${job.job_number}.pdf`);
  };

  const handleDownloadQuote = async () => {
    if (!job) return;
    const { generateQuote, downloadPDF } = await import('@/lib/utils/pdf');
    const doc = await generateQuote(job, job.service_branch, terms);
    downloadPDF(doc, `quote-${job.job_number}.pdf`);
  };

  const handleDownloadInvoice = async () => {
    if (!job) return;
    const { generateInvoice, downloadPDF } = await import('@/lib/utils/pdf');
    const doc = await generateInvoice(job, job.service_branch, terms);
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
                      {job.alternative_contact && (
                        <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium mt-1">
                          <Phone className="h-4 w-4" />
                          Alt Contact: {job.alternative_contact}
                        </div>
                      )}
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

                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-md bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Repeat Job #</p>
                            <p className="font-medium text-gray-900">{product.repeat_job_number || '-'}</p>
                          </div>
                          <div className="rounded-md bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Other Job #</p>
                            <p className="font-medium text-gray-900">{product.other_job_number || '-'}</p>
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
                          <p className="text-xs text-gray-500 mb-1">Other</p>
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

                        {/* Product Photos Grid */}
                        {product.product_images && product.product_images.length > 0 && (
                          <div className="pt-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Product Photos ({product.product_images.length})
                            </p>
                            <div className="flex flex-wrap gap-2.5">
                              {product.product_images.map((imgUrl, imgIdx) => (
                                <button
                                  key={imgIdx}
                                  type="button"
                                  onClick={() => setActiveImage(imgUrl)}
                                  className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-500 shadow-sm transition-transform hover:scale-105 active:scale-95 group focus:outline-none cursor-zoom-in"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={imgUrl}
                                    alt={`Product photo ${imgIdx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {product.has_warranty && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm space-y-3">
                            <div>
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

                            {/* Warranty Images Grid */}
                            {product.warranty_images && product.warranty_images.length > 0 && (
                              <div className="pt-2 border-t border-yellow-250">
                                <p className="text-xs font-semibold text-yellow-850 uppercase tracking-wider mb-2">
                                  Warranty Photos ({product.warranty_images.length})
                                </p>
                                <div className="flex flex-wrap gap-2.5">
                                  {product.warranty_images.map((imgUrl, imgIdx) => (
                                    <button
                                      key={imgIdx}
                                      type="button"
                                      onClick={() => setActiveImage(imgUrl)}
                                      className="relative w-16 h-16 rounded-lg overflow-hidden border border-yellow-200 hover:border-yellow-500 shadow-sm transition-transform hover:scale-105 active:scale-95 group focus:outline-none cursor-zoom-in"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={imgUrl}
                                        alt={`Warranty photo ${imgIdx + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" />
                                    </button>
                                  ))}
                                </div>
                              </div>
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

              {job.spare_parts_private_details && job.spare_parts_private_details.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-gray-500" />
                      Internal Cost Registry (Office Use Only)
                    </CardTitle>
                    <Badge variant="gray">
                      Cost Sum: {formatINR(job.spare_parts_total_cost)}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-gray-500">
                            <th className="px-3 py-2">Part / Item Name</th>
                            <th className="px-3 py-2 w-28">HSN Code</th>
                            <th className="px-3 py-2 w-20 text-center">Qty</th>
                            <th className="px-3 py-2 w-28 text-right">Unit Cost</th>
                            <th className="px-3 py-2 w-28 text-right">Total Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {job.spare_parts_private_details.map((part: any, idx: number) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 font-medium">{part.name}</td>
                              <td className="px-3 py-2 text-gray-500">{part.hsn_code || <span className="text-gray-300">—</span>}</td>
                              <td className="px-3 py-2 text-center">{part.quantity}</td>
                              <td className="px-3 py-2 text-right">{formatINR(part.unit_cost)}</td>
                              <td className="px-3 py-2 text-right font-semibold">
                                {formatINR(part.quantity * part.unit_cost)}
                              </td>
                            </tr>
                          ))}
                        </tbody>

                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                            <span>
                              {part.name}
                              {part.hsn_code && <span className="text-gray-400 ml-1">[{part.hsn_code}]</span>}
                              {' '}×{part.quantity}
                            </span>
                            <span>{formatINR(part.total_price)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {job.spare_parts_total_cost > 0 && (
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Spare Parts Total Cost (Office Use)</span>
                        <span>{formatINR(job.spare_parts_total_cost)}</span>
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

                    {/* Payment History */}
                    {job.payment_transactions && job.payment_transactions.length > 0 && (
                      <div className="border-t pt-2 mt-2">
                        <p className="text-gray-600 font-medium mb-2">Payment History</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {job.payment_transactions.map((transaction) => (
                            <div key={transaction.id} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                              <div>
                                <span className="font-medium">{formatINR(transaction.amount)}</span>
                                <span className="text-gray-500 ml-2">
                                  {formatDateTime(transaction.payment_date)}
                                </span>
                                {transaction.created_by_user && (
                                  <span className="text-gray-400 ml-2">by {transaction.created_by_user.full_name}</span>
                                )}
                              </div>
                              <span className="text-gray-500 capitalize">{transaction.payment_method}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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
                  {!job.estimate_delivery_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Est. Delivery</p>
                        <p className="font-medium text-gray-400">Not set</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      {activeImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setActiveImage(null)}
        >
          <button
            onClick={() => setActiveImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-transform hover:scale-105 focus:outline-none"
            aria-label="Close preview"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div
            className="relative max-w-4xl max-h-[85vh] p-2 bg-white/5 rounded-2xl border border-white/10 shadow-2xl transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage}
              alt="Warranty preview zoomed"
              className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { JobWithRelations } from '@/types/job';
import { formatINR } from './currency';
import { formatDate, formatDateTime } from './dates';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Cam Clinic';
const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Supportta Solutions Private Limited';
const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '+918590377418';

interface PDFOptions {
  title: string;
  job: JobWithRelations;
}

function addHeader(doc: jsPDF, title: string): number {
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(APP_NAME, 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_NAME, 105, 28, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, 40, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(20, 45, 190, 45);
  
  return 50;
}

function addJobInfo(doc: jsPDF, job: JobWithRelations, startY: number): number {
  let y = startY;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Job Number:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(job.job_number, 55, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateTime(job.created_at), 140, y);
  
  y += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 20, y);
  doc.setFont('helvetica', 'normal');
  doc.text(job.status.replace(/_/g, ' ').toUpperCase(), 55, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Priority:', 120, y);
  doc.setFont('helvetica', 'normal');
  doc.text(job.priority.toUpperCase(), 140, y);
  
  return y + 10;
}

function addCustomerInfo(doc: jsPDF, job: JobWithRelations, startY: number): number {
  let y = startY;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Details', 20, y);
  y += 6;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${job.customer?.name || '-'}`, 20, y);
  y += 5;
  doc.text(`Phone: ${job.customer?.phone || '-'}`, 20, y);
  y += 5;
  if (job.customer?.email) {
    doc.text(`Email: ${job.customer.email}`, 20, y);
    y += 5;
  }
  if (job.customer?.address) {
    doc.text(`Address: ${job.customer.address}`, 20, y);
    y += 5;
  }
  
  return y + 5;
}

function addProductsTable(doc: jsPDF, job: JobWithRelations, startY: number): number {
  const products = job.products || [];
  
  if (products.length === 0) return startY;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Products', 20, startY);
  
  const tableData = products.map((product, index) => [
    (index + 1).toString(),
    `${product.brand || ''} ${product.model || ''}`.trim() || '-',
    product.serial_number || '-',
    product.condition?.replace(/_/g, ' ') || '-',
    product.accessories?.map(a => a.name).join(', ') || '-',
  ]);
  
  autoTable(doc, {
    startY: startY + 3,
    head: [['#', 'Product', 'Serial No.', 'Condition', 'Accessories']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: 20, right: 20 },
  });
  
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
}

function addChargesTable(doc: jsPDF, job: JobWithRelations, startY: number): number {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Charges', 20, startY);
  
  const chargesData: (string | number)[][] = [];
  
  if (job.inspection_fee > 0) {
    chargesData.push(['Inspection Fee', formatINR(job.inspection_fee)]);
  }
  
  if (job.service_charges > 0) {
    chargesData.push(['Service Charges', formatINR(job.service_charges)]);
  }
  
  const spareParts = job.spare_parts || [];
  spareParts.forEach(part => {
    chargesData.push([`${part.name} (${part.quantity} x ${formatINR(part.unit_price)})`, formatINR(part.total_price)]);
  });
  
  if (job.gst_enabled && job.gst_amount > 0) {
    chargesData.push(['GST (18%)', formatINR(job.gst_amount)]);
  }
  
  chargesData.push(['Grand Total', formatINR(job.grand_total)]);
  
  if (job.advance_paid > 0) {
    chargesData.push(['Advance Paid', formatINR(job.advance_paid)]);
  }
  
  chargesData.push(['Balance Due', formatINR(job.balance_amount)]);
  
  autoTable(doc, {
    startY: startY + 3,
    head: [['Description', 'Amount']],
    body: chargesData,
    theme: 'striped',
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: 20, right: 20 },
    columnStyles: {
      1: { halign: 'right' },
    },
  });
  
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
}

function addFooter(doc: jsPDF): void {
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`WhatsApp Support: ${SUPPORT_WHATSAPP}`, 105, pageHeight - 20, { align: 'center' });
  doc.text(`Generated by ${APP_NAME}`, 105, pageHeight - 15, { align: 'center' });
  
  doc.setLineWidth(0.3);
  doc.line(20, pageHeight - 35, 90, pageHeight - 35);
  doc.setFontSize(8);
  doc.text('Customer Signature', 55, pageHeight - 30, { align: 'center' });
  
  doc.line(120, pageHeight - 35, 190, pageHeight - 35);
  doc.text('Authorized Signature', 155, pageHeight - 30, { align: 'center' });
}

/**
 * Generate a Receipt PDF for a job
 * Generated when job is created (status = New)
 */
export function generateReceipt(job: JobWithRelations): jsPDF {
  const doc = new jsPDF();
  
  let y = addHeader(doc, 'SERVICE RECEIPT');
  y = addJobInfo(doc, job, y);
  y = addCustomerInfo(doc, job, y);
  y = addProductsTable(doc, job, y);
  
  if (job.description) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Problem Description', 20, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(job.description, 170);
    doc.text(lines, 20, y);
    y += lines.length * 5 + 5;
  }
  
  if (job.advance_paid > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Advance Paid: ${formatINR(job.advance_paid)}`, 20, y);
    if (job.advance_paid_date) {
      doc.setFont('helvetica', 'normal');
      doc.text(` on ${formatDate(job.advance_paid_date)}`, 75, y);
    }
    y += 8;
  }
  
  if (job.estimate_delivery_date) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Estimated Delivery: ${formatDate(job.estimate_delivery_date)}`, 20, y);
  }
  
  addFooter(doc);
  
  return doc;
}

/**
 * Generate a Quote PDF for a job
 * Generated when charges are entered and status = Quote Sent
 */
export function generateQuote(job: JobWithRelations): jsPDF {
  const doc = new jsPDF();
  
  let y = addHeader(doc, 'SERVICE QUOTATION');
  y = addJobInfo(doc, job, y);
  y = addCustomerInfo(doc, job, y);
  y = addProductsTable(doc, job, y);
  y = addChargesTable(doc, job, y);
  
  if (job.cam_clinic_advisory_notes) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Advisory Notes', 20, y);
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(job.cam_clinic_advisory_notes, 170);
    doc.text(lines, 20, y);
  }
  
  addFooter(doc);
  
  return doc;
}

/**
 * Generate an Invoice PDF for a job
 * Generated when status = Completed
 */
export function generateInvoice(job: JobWithRelations): jsPDF {
  const doc = new jsPDF();
  
  let y = addHeader(doc, 'SERVICE INVOICE');
  y = addJobInfo(doc, job, y);
  y = addCustomerInfo(doc, job, y);
  y = addProductsTable(doc, job, y);
  y = addChargesTable(doc, job, y);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Status:', 20, y);
  doc.setFont('helvetica', 'normal');
  if (job.balance_amount <= 0) {
    doc.text('PAID IN FULL', 55, y);
  } else {
    doc.text(`Balance Due: ${formatINR(job.balance_amount)}`, 55, y);
  }
  
  addFooter(doc);
  
  return doc;
}

/**
 * Download a PDF document
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

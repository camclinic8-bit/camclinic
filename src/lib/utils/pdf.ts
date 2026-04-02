import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { JobWithRelations } from '@/types/job';
import { formatDate, formatDateTime } from './dates';

const APP_NAME = 'CamClinic';

function formatAmountRs(value: number): string {
  return `Rs ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function addHeader(doc: jsPDF, title: string): number {
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(APP_NAME, 105, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, 31, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.line(14, 36, 196, 36);

  return 41;
}

function addJobInfo(doc: jsPDF, job: JobWithRelations, startY: number): number {
  let y = startY;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Job Number:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(job.job_number, 42, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 116, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDateTime(job.created_at), 130, y);

  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(job.status.replace(/_/g, ' ').toUpperCase(), 42, y);

  doc.setFont('helvetica', 'bold');
  doc.text('Priority:', 116, y);
  doc.setFont('helvetica', 'normal');
  doc.text(job.priority.toUpperCase(), 130, y);

  return y + 7;
}

function addCustomerInfo(doc: jsPDF, job: JobWithRelations, startY: number): number {
  let y = startY;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Details', 14, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${job.customer?.name || '-'}`, 14, y);
  y += 4.5;
  doc.text(`Phone: ${job.customer?.phone || '-'}`, 14, y);
  y += 4.5;
  if (job.customer?.email) {
    doc.text(`Email: ${job.customer.email}`, 14, y);
    y += 4.5;
  }
  if (job.customer?.address) {
    const addressLines = doc.splitTextToSize(`Address: ${job.customer.address}`, 180);
    doc.text(addressLines, 14, y);
    y += addressLines.length * 4;
  }

  return y + 3;
}

function getProductsDetailRows(job: JobWithRelations): (string | number)[][] {
  const products = job.products || [];
  return products.map((product, index) => {
    const productName = `${product.brand || '-'} ${product.model || ''}`.trim();
    const accessoriesText = (product.accessories || [])
      .map((a) => (typeof a === 'string' ? a : a.name))
      .filter(Boolean)
      .join(', ') || '-';
    const otherPartsText = (product.other_parts || [])
      .map((o) => (typeof o === 'string' ? o : o.name))
      .filter(Boolean)
      .join(', ') || '-';
    const warrantyText = product.has_warranty
      ? `${product.warranty_description || 'Yes'}${product.warranty_expiry_date ? ` (Exp: ${formatDate(product.warranty_expiry_date)})` : ''}`
      : 'No';
    return [
      index + 1,
      productName,
      product.serial_number || '-',
      product.condition?.replace(/_/g, ' ') || '-',
      product.description || '-',
      product.remarks || '-',
      accessoriesText,
      otherPartsText,
      warrantyText,
    ];
  });
}

function addProductsFullTable(doc: jsPDF, job: JobWithRelations, startY: number): number {
  const rows = getProductsDetailRows(job);
  if (rows.length === 0) return startY;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Product Details (A-Z)', 14, startY);

  autoTable(doc, {
    startY: startY + 2,
    head: [[
      '#',
      'Product',
      'Serial',
      'Condition',
      'Description',
      'Remarks',
      'Accessories',
      'Other Parts',
      'Warranty',
    ]],
    body: rows,
    theme: 'grid',
    margin: { left: 14, right: 14 },
    tableWidth: 'auto',
    styles: { fontSize: 7.5, cellPadding: 1.2, overflow: 'linebreak' },
    headStyles: { fillColor: [35, 35, 35], fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 6, halign: 'center' },
      1: { cellWidth: 24 },
      2: { cellWidth: 16 },
      3: { cellWidth: 16 },
      4: { cellWidth: 24 },
      5: { cellWidth: 21 },
      6: { cellWidth: 24 },
      7: { cellWidth: 24 },
      8: { cellWidth: 24 },
    },
    pageBreak: 'avoid',
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
}

function addChargesTable(doc: jsPDF, job: JobWithRelations, startY: number): number {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Charges Summary', 14, startY);

  const chargesData: (string | number)[][] = [];

  if (job.inspection_fee > 0) {
    chargesData.push(['Inspection Fee', formatAmountRs(job.inspection_fee)]);
  }

  if (job.service_charges > 0) {
    chargesData.push(['Service Charges', formatAmountRs(job.service_charges)]);
  }

  const spareParts = job.spare_parts || [];
  spareParts.forEach(part => {
    chargesData.push([`${part.name} (${part.quantity} x ${formatAmountRs(part.unit_price)})`, formatAmountRs(part.total_price)]);
  });

  if (job.gst_enabled && job.gst_amount > 0) {
    chargesData.push(['GST (18%)', formatAmountRs(job.gst_amount)]);
  }

  chargesData.push(['Grand Total', formatAmountRs(job.grand_total)]);

  if (job.advance_paid > 0) {
    chargesData.push(['Advance Paid', formatAmountRs(job.advance_paid)]);
  }

  chargesData.push(['Balance Due', formatAmountRs(job.balance_amount)]);

  autoTable(doc, {
    startY: startY + 2,
    head: [['Description', 'Amount']],
    body: chargesData,
    theme: 'grid',
    headStyles: { fillColor: [35, 35, 35], fontSize: 8 },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: {
      1: { halign: 'right' },
    },
    pageBreak: 'avoid',
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
}

function addFooter(doc: jsPDF): void {
  const pageHeight = doc.internal.pageSize.height;

  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 20, 84, pageHeight - 20);
  doc.setFontSize(8);
  doc.text('Customer Signature', 49, pageHeight - 15, { align: 'center' });

  doc.line(126, pageHeight - 20, 196, pageHeight - 20);
  doc.text('Authorized Signature', 161, pageHeight - 15, { align: 'center' });

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated by ${APP_NAME}`, 105, pageHeight - 6, { align: 'center' });
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
  y = addProductsFullTable(doc, job, y);

  if (job.description) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Problem Description', 14, y);
    y += 4.5;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(job.description, 182);
    doc.text(lines, 14, y);
    y += lines.length * 4 + 2;
  }

  y = addChargesTable(doc, job, y);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Advance Paid Date: ${job.advance_paid_date ? formatDate(job.advance_paid_date) : '-'}`, 14, y);
  y += 4.5;
  doc.text(`Estimated Delivery: ${job.estimate_delivery_date ? formatDate(job.estimate_delivery_date) : '-'}`, 14, y);

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
  y = addProductsFullTable(doc, job, y);
  y = addChargesTable(doc, job, y);

  if (job.cam_clinic_advisory_notes) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Advisory Notes', 14, y);
    y += 5;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(job.cam_clinic_advisory_notes, 182);
    doc.text(lines, 14, y);
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
  y = addProductsFullTable(doc, job, y);
  y = addChargesTable(doc, job, y);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Status:', 14, y);
  doc.setFont('helvetica', 'normal');
  if (job.balance_amount <= 0) {
    doc.text('PAID IN FULL', 45, y);
  } else {
    doc.text(`Balance Due: ${formatAmountRs(job.balance_amount)}`, 45, y);
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

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { JobWithRelations } from '@/types/job';
import { Branch } from '@/types/branch';
import { formatDate } from './dates';
import { TermsAndConditions } from '@/types/job';

const APP_NAME = 'CamClinic';
const COMPANY_ADDRESS = '"NAVELKAR TRADE CENTRE"\nSHOP NO 4, GROUND FLOOR,\nOPP. AZAD MAIDAN,\nBEHIND CASA MADHAV\nM. G. ROAD, PANAJI, GOA 403001';
const COMPANY_MOBILE = '992 3133449';
const COMPANY_EMAIL = 'info@camclinicgoa.com';
const COMPANY_GSTIN = '30AAGFC6231M1ZN';

function formatAmountRs(value: number): string {
  return `Rs ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Converts SVG string to PNG data URL */
async function svgToPng(svgString: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * 2; // 2x for better quality
      canvas.height = img.height * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
      URL.revokeObjectURL(url);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG image'));
    };
    
    img.src = url;
  });
}

/** Adds the page header: professional service center invoice style */
async function addHeader(doc: jsPDF, title: string, branch?: Branch | null): Promise<number> {
  const headerY = 10;
  const headerHeight = 20; // Compact height
  const leftX = 14;
  const pageWidth = 210;
  const rightAlignX = 190; // Align right text slightly inside for safety margin

  // Left side: Logo
  let hasLogo = false;
  const logoWidth = 35;
  const logoHeight = 13.36; // 35 / 2.62 aspect ratio
  const logoY = headerY + 1.5;

  try {
    const logoResponse = await fetch('/logo.svg');
    if (logoResponse.ok) {
      const logoSvg = await logoResponse.text();
      const logoPngDataUrl = await svgToPng(logoSvg);
      doc.addImage(logoPngDataUrl, 'PNG', leftX, logoY, logoWidth, logoHeight);
      hasLogo = true;
    }
  } catch (error) {
    console.error('Failed to load logo SVG, falling back to text:', error);
  }

  if (!hasLogo) {
    // Fallback: draw neat text logo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('CAM CLINIC', leftX, headerY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('www.camclinic.in', leftX, headerY + 15);
  }

  // Right side: Address and contact details (Location first, then MOB, TEL, EMAIL, GSTIN)
  let addressText = '';
  let phoneVal = COMPANY_MOBILE;
  let landlineVal = '';
  let emailVal = COMPANY_EMAIL;

  if (branch) {
    addressText = branch.address || branch.name;
    if (branch.phone) phoneVal = branch.phone;
    if (branch.landline) landlineVal = branch.landline;
    if (branch.email) emailVal = branch.email;
  } else {
    addressText = COMPANY_ADDRESS;
  }

  // Make the entire right side bold
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const lineHeight = 3.4;
  let rightY = headerY + 2;

  // 1. Location address
  const addressLines = doc.splitTextToSize(addressText, 80); // Restrict width to 80mm so it wraps nicely
  addressLines.forEach((line: string) => {
    doc.text(line, rightAlignX, rightY, { align: 'right' });
    rightY += lineHeight;
  });

  // 2. Mobile
  doc.text(`MOB: ${phoneVal}`, rightAlignX, rightY, { align: 'right' });
  rightY += lineHeight;

  // 3. Landline (if exists)
  if (landlineVal) {
    doc.text(`TEL: ${landlineVal}`, rightAlignX, rightY, { align: 'right' });
    rightY += lineHeight;
  }

  // 4. Email
  doc.text(`EMAIL: ${emailVal}`, rightAlignX, rightY, { align: 'right' });
  rightY += lineHeight;

  // 5. GSTIN
  doc.text(`GSTIN: ${COMPANY_GSTIN}`, rightAlignX, rightY, { align: 'right' });

  // Document title centered below header, dynamically positioned based on rightY
  const titleY = Math.max(rightY + 4, headerY + headerHeight + 3);
  doc.setFontSize(9.5); // Smaller title heading
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, pageWidth / 2, titleY, { align: 'center' });

  // Bottom divider line separating header from content (extends full content width: 14 to 196)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(leftX, titleY + 3, 196, titleY + 3);

  return titleY + 7;
}

/** Draws the unified side-by-side Customer and Job details card */
function addCustomerAndJobInfo(doc: jsPDF, job: JobWithRelations, startY: number): number {
  const cardY = startY;
  const cardHeight = 24; // Compact height
  const leftX = 14;
  const rightX = 196;
  const midX = 105; // Center divider

  // Draw card border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(leftX, cardY, rightX - leftX, cardHeight);

  // Draw vertical divider
  doc.line(midX, cardY, midX, cardY + cardHeight);

  // Section titles
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CUSTOMER DETAILS', leftX + 4, cardY + 4);
  doc.text('JOB DETAILS', midX + 4, cardY + 4);

  // Divider lines under titles
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.15);
  doc.line(leftX, cardY + 5.5, midX, cardY + 5.5);
  doc.line(midX, cardY + 5.5, rightX, cardY + 5.5);

  // Content styling
  doc.setFontSize(7.5);
  const textLineHeight = 3.6;

  // Left column: Customer Details
  let custY = cardY + 9;
  const custLabelX = leftX + 4;
  const custValX = leftX + 22;

  // Name
  doc.setFont('helvetica', 'bold');
  doc.text('Name:', custLabelX, custY);
  doc.setFont('helvetica', 'normal');
  doc.text(job.customer?.name || '-', custValX, custY);
  custY += textLineHeight;

  // Phone
  doc.setFont('helvetica', 'bold');
  doc.text('Phone:', custLabelX, custY);
  doc.setFont('helvetica', 'normal');
  doc.text(job.customer?.phone || '-', custValX, custY);
  custY += textLineHeight;

  // Email
  doc.setFont('helvetica', 'bold');
  doc.text('Email:', custLabelX, custY);
  doc.setFont('helvetica', 'normal');
  const emailText = job.customer?.email || '-';
  const emailLines = doc.splitTextToSize(emailText, 65);
  doc.text(emailLines[0] || '-', custValX, custY);
  custY += textLineHeight;

  // Address
  doc.setFont('helvetica', 'bold');
  doc.text('Address:', custLabelX, custY);
  doc.setFont('helvetica', 'normal');
  const addressText = job.customer?.address || '-';
  const addressLines = doc.splitTextToSize(addressText, 62);
  doc.text(addressLines[0] || '-', custValX, custY);
  if (addressLines[1]) {
    doc.text(addressLines[1], custValX, custY + 3);
  }

  // Right column: Job Details
  let jobY = cardY + 9;
  const jobLabelX = midX + 4;
  const jobValX = midX + 24;

  // Job Number
  doc.setFont('helvetica', 'bold');
  doc.text('Job No:', jobLabelX, jobY);
  doc.setFont('helvetica', 'normal');
  doc.text(job.job_number, jobValX, jobY);
  jobY += textLineHeight;

  // Date
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', jobLabelX, jobY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(job.created_at), jobValX, jobY);
  jobY += textLineHeight;

  // Status
  doc.setFont('helvetica', 'bold');
  doc.text('Status:', jobLabelX, jobY);
  doc.setFont('helvetica', 'normal');
  doc.text(job.status.replace(/_/g, ' ').toUpperCase(), jobValX, jobY);
  jobY += textLineHeight;

  // Priority
  doc.setFont('helvetica', 'bold');
  doc.text('Priority:', jobLabelX, jobY);
  doc.setFont('helvetica', 'normal');
  doc.text(job.priority.toUpperCase(), jobValX, jobY);

  return cardY + cardHeight + 4;
}

/** Formats product detail rows into 7 columns */
function getProductsDetailRows(job: JobWithRelations): (string | number)[][] {
  const products = job.products || [];
  return products.map((product, index) => {
    const productName = `${product.brand || '-'} ${product.model || ''}`.trim();
    
    // Combine accessories, other parts, and remarks
    const accessoriesText = (product.accessories || [])
      .map((a) => (typeof a === 'string' ? a : a.name))
      .filter(Boolean)
      .join(', ');
    const otherPartsText = (product.other_parts || [])
      .map((o) => (typeof o === 'string' ? o : o.name))
      .filter(Boolean)
      .join(', ');
    const remarksText = product.remarks || '';

    const combinedDetails = [
      accessoriesText ? `Accessories: ${accessoriesText}` : null,
      otherPartsText ? `Parts: ${otherPartsText}` : null,
      remarksText ? `Remarks: ${remarksText}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const warrantyText = product.has_warranty
      ? `${product.warranty_description || 'Yes'}${product.warranty_expiry_date ? ` (Exp: ${formatDate(product.warranty_expiry_date)})` : ''}`
      : 'No';

    return [
      index + 1,
      productName,
      product.serial_number || '-',
      product.condition?.replace(/_/g, ' ') || '-',
      product.description || '-',
      combinedDetails || '-',
      warrantyText,
    ];
  });
}

/** Draws the Product Details table */
function addProductsFullTable(doc: jsPDF, job: JobWithRelations, startY: number): number {
  const rows = getProductsDetailRows(job);
  if (rows.length === 0) return startY;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('PRODUCT DETAILS', 14, startY);

  autoTable(doc, {
    startY: startY + 3,
    head: [[
      '#',
      'Product',
      'Serial No',
      'Condition',
      'Reported Issue',
      'Accessories & Remarks',
      'Warranty',
    ]],
    body: rows,
    theme: 'grid',
    margin: { left: 14, right: 14 },
    tableWidth: 'auto',
    styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [0, 0, 0], fontSize: 7.5, fontStyle: 'bold', textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 22 },
      3: { cellWidth: 18 },
      4: { cellWidth: 40 },
      5: { cellWidth: 42 },
      6: { cellWidth: 20 },
    },
    pageBreak: 'avoid',
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
}

/** Draws the Billing Details table and appends totals summary at the bottom right */
function addChargesTable(doc: jsPDF, job: JobWithRelations, startY: number): number {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('BILLING DETAILS', 14, startY);

  const billingRows: any[] = [];
  let index = 1;

  if (job.inspection_fee > 0) {
    billingRows.push([
      index++,
      'Inspection Fee',
      '-',
      '1',
      formatAmountRs(job.inspection_fee),
      formatAmountRs(job.inspection_fee),
    ]);
  }

  if (job.service_charges > 0) {
    billingRows.push([
      index++,
      'Service Charges',
      '-',
      '1',
      formatAmountRs(job.service_charges),
      formatAmountRs(job.service_charges),
    ]);
  }

  const spareParts = job.spare_parts || [];
  spareParts.forEach(part => {
    const hsn = (part as { hsn_code?: string | null }).hsn_code || '-';
    billingRows.push([
      index++,
      part.name,
      hsn,
      part.quantity.toString(),
      formatAmountRs(part.unit_price),
      formatAmountRs(part.total_price),
    ]);
  });

  // If no charges at all, add a placeholder row
  if (billingRows.length === 0) {
    billingRows.push([
      '-',
      'No charges recorded',
      '-',
      '-',
      '-',
      '-',
    ]);
  }

  // Subtotal (total charges)
  billingRows.push([
    {
      content: 'Subtotal',
      colSpan: 5,
      styles: { halign: 'right', fontStyle: 'bold', fillColor: [250, 250, 250] }
    },
    {
      content: formatAmountRs(job.total_charges),
      styles: { halign: 'right', fontStyle: 'bold', fillColor: [250, 250, 250] }
    }
  ]);

  // GST (18%) (if enabled)
  if (job.gst_enabled && job.gst_amount > 0) {
    billingRows.push([
      {
        content: 'GST (18%)',
        colSpan: 5,
        styles: { halign: 'right', fontStyle: 'bold', fillColor: [250, 250, 250] }
      },
      {
        content: formatAmountRs(job.gst_amount),
        styles: { halign: 'right', fontStyle: 'bold', fillColor: [250, 250, 250] }
      }
    ]);
  }

  // Grand Total
  billingRows.push([
    {
      content: 'Grand Total',
      colSpan: 5,
      styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] }
    },
    {
      content: formatAmountRs(job.grand_total),
      styles: { halign: 'right', fontStyle: 'bold', fillColor: [240, 240, 240] }
    }
  ]);

  // Advance Paid (if any)
  if (job.advance_paid > 0) {
    billingRows.push([
      {
        content: 'Advance Paid',
        colSpan: 5,
        styles: { halign: 'right', fontStyle: 'normal', fillColor: [250, 250, 250] }
      },
      {
        content: formatAmountRs(job.advance_paid),
        styles: { halign: 'right', fontStyle: 'normal', fillColor: [250, 250, 250] }
      }
    ]);
  }

  // Balance Due
  billingRows.push([
    {
      content: 'Balance Due',
      colSpan: 5,
      styles: { 
        halign: 'right', 
        fontStyle: 'bold', 
        fillColor: [240, 240, 240], 
        textColor: job.balance_amount > 0 ? [180, 0, 0] : [0, 100, 0] 
      }
    },
    {
      content: formatAmountRs(job.balance_amount),
      styles: { 
        halign: 'right', 
        fontStyle: 'bold', 
        fillColor: [240, 240, 240], 
        textColor: job.balance_amount > 0 ? [180, 0, 0] : [0, 100, 0] 
      }
    }
  ]);

  autoTable(doc, {
    startY: startY + 3,
    head: [[
      '#',
      'Item / Description',
      'HSN Code',
      'Qty',
      'Unit Price',
      'Amount',
    ]],
    body: billingRows,
    theme: 'grid',
    margin: { left: 14, right: 14 },
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [0, 0, 0], fontSize: 7.5, fontStyle: 'bold', textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 84 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
    pageBreak: 'avoid',
  });

  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
}

/** Adds T&C content */
function addTermsAndConditions(doc: jsPDF, terms: TermsAndConditions | null, startY: number): number {
  if (!terms || !terms.content) return startY;

  let y = startY + 2;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('TERMS & CONDITIONS', 14, y);
  y += 4;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  const lines = doc.splitTextToSize(terms.content, 182);
  doc.text(lines, 14, y);
  y += lines.length * 3 + 4;
  doc.setTextColor(0, 0, 0);

  return y;
}

/** Adds customer and authorized signature lines */
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
export async function generateReceipt(job: JobWithRelations, branch?: Branch | null, terms?: TermsAndConditions | null): Promise<jsPDF> {
  const doc = new jsPDF();

  let y = await addHeader(doc, 'SERVICE RECEIPT', branch);
  y = addCustomerAndJobInfo(doc, job, y);
  y = addProductsFullTable(doc, job, y);

  if (job.description) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PROBLEM DESCRIPTION', 14, y);
    y += 4;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(job.description, 182);
    doc.text(lines, 14, y);
    y += lines.length * 3.5 + 4;
    doc.setTextColor(0, 0, 0);
  }

  y = addChargesTable(doc, job, y);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Advance Paid Date:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(job.advance_paid_date ? formatDate(job.advance_paid_date) : '-', 45, y);
  
  y += 4;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Estimated Delivery:', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(job.estimate_delivery_date ? formatDate(job.estimate_delivery_date) : '-', 45, y);
  doc.setTextColor(0, 0, 0);
  
  y += 6;

  y = addTermsAndConditions(doc, terms || null, y);

  addFooter(doc);

  return doc;
}

/**
 * Generate a Quote PDF for a job
 * Generated when charges are entered and status = Quote Sent
 */
export async function generateQuote(job: JobWithRelations, branch?: Branch | null, terms?: TermsAndConditions | null): Promise<jsPDF> {
  const doc = new jsPDF();

  let y = await addHeader(doc, 'SERVICE QUOTATION', branch);
  y = addCustomerAndJobInfo(doc, job, y);
  y = addProductsFullTable(doc, job, y);
  y = addChargesTable(doc, job, y);

  if (job.cam_clinic_advisory_notes) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('ADVISORY NOTES', 14, y);
    y += 4;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const lines = doc.splitTextToSize(job.cam_clinic_advisory_notes, 182);
    doc.text(lines, 14, y);
    y += lines.length * 3.5 + 4;
    doc.setTextColor(0, 0, 0);
  }

  y = addTermsAndConditions(doc, terms || null, y);

  addFooter(doc);

  return doc;
}

/**
 * Generate an Invoice PDF for a job
 * Generated when status = Completed
 */
export async function generateInvoice(job: JobWithRelations, branch?: Branch | null, terms?: TermsAndConditions | null): Promise<jsPDF> {
  const doc = new jsPDF();

  let y = await addHeader(doc, 'SERVICE INVOICE', branch);
  y = addCustomerAndJobInfo(doc, job, y);
  y = addProductsFullTable(doc, job, y);
  y = addChargesTable(doc, job, y);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Status:', 14, y);
  doc.setFont('helvetica', 'normal');
  if (job.balance_amount <= 0) {
    doc.setTextColor(0, 128, 0); // Green
    doc.setFont('helvetica', 'bold');
    doc.text('PAID IN FULL', 38, y);
  } else {
    doc.setTextColor(180, 0, 0); // Red
    doc.setFont('helvetica', 'bold');
    doc.text(`PENDING - Balance Due: ${formatAmountRs(job.balance_amount)}`, 38, y);
  }
  doc.setTextColor(0, 0, 0); // Reset color
  y += 6;

  y = addTermsAndConditions(doc, terms || null, y);

  addFooter(doc);

  return doc;
}

/**
 * Download a PDF document
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}

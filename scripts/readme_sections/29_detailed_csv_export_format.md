## 35. CSV Reporting Ledger & Export Specifications

This section documents the formatting standards, character escaping, security controls, and client-side download algorithms used to export financial reports.

---

### 35.1 Export Scoping & Permissions
- **Access Control**: CSV downloads are restricted to **Super Admins** and **Service Managers**. If a Technician or Service Incharge attempts to access the route or intercept API payloads, database Row-Level Security blocks the read, returning an empty dataset.
- **Branch Filtering**: Service Managers are restricted to downloading data for their assigned branch. Super Admins can toggle the branch filter to export data globally.

---

### 35.2 CSV Encoding Algorithm & Data Grid

To prevent spreadsheet injection and compatibility issues (e.g. parsing special characters in Indian names or currency symbols), the export engine uses the following serialization rules:

1. **UTF-8 BOM Header**: The file is prefixed with a Byte Order Mark (`\uFEFF`) to force Excel to render UTF-8 encoding correctly (including Indian name scripts or rupee signs).
2. **Cell Escaping**: Every string value is wrapped in double quotes. Double quotes inside text fields are escaped by doubling them (`""`).
3. **Delimiter**: Standard comma separating rules are applied.

#### 35.2.1 Columns Schema

| CSV Header Column | Data Mapping field | Format / Constraints |
|---|---|---|
| **Job Number** | `jobs.job_number` | Raw string (e.g. `CC-20260610-0001`) |
| **Date Opened** | `jobs.created_at` | ISO-8601 converted to Local date |
| **Customer Name** | `customers.name` | Escaped string |
| **Mobile Number** | `customers.phone` | String format |
| **Branch** | `branches.name` | Escaped string |
| **Current Status** | `jobs.status` | System status label |
| **Inspection Fee** | `jobs.inspection_fee` | Numeric (two decimal places) |
| **Service Charge** | `jobs.service_charges` | Labor charges (two decimal places) |
| **Spare Parts Cost** | `jobs.spare_parts_total_cost` | Internal parts ledger sum |
| **Subtotal** | `jobs.total_charges` | Sum of diagnostics + labor + parts |
| **GST Amount** | `jobs.gst_amount` | 18% of service charge if enabled |
| **Grand Total** | `jobs.grand_total` | Sum of subtotal + tax |
| **Advance Paid** | `jobs.advance_paid` | Initial intake deposit |
| **Remaining Balance** | `jobs.balance_amount` | Grand total minus payments |

---

### 35.3 Client-Side Download Trigger

The browser downloads files by generating a temporary object URL from a Blob data array:

```typescript
function exportToCSV(data: JobReportRow[]) {
  const headers = [
    'Job Number', 'Date Opened', 'Customer Name', 'Mobile Number', 
    'Branch', 'Current Status', 'Inspection Fee', 'Service Charge', 
    'Spare Parts Cost', 'Subtotal', 'GST Amount', 'Grand Total', 
    'Advance Paid', 'Remaining Balance'
  ];

  const rows = data.map(r => [
    r.job_number,
    r.created_at,
    r.customer_name,
    r.phone,
    r.branch_name,
    r.status,
    r.inspection_fee.toFixed(2),
    r.service_charges.toFixed(2),
    r.spare_parts_cost.toFixed(2),
    r.subtotal.toFixed(2),
    r.gst_amount.toFixed(2),
    r.grand_total.toFixed(2),
    r.advance_paid.toFixed(2),
    r.balance_amount.toFixed(2)
  ]);

  // Convert array to CSV string
  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  // Inject UTF-8 BOM prefix
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Create download link
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `camclinic_report_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

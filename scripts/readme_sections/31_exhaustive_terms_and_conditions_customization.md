## 37. Terms & Conditions, Warranties, & Disclaimers

This section documents the terms and conditions customization module, standard liability disclaimers, and warranty policies printed on receipts and invoices.

---

### 37.1 Terms and Conditions Database Schema
Terms and conditions templates are saved in the database, allowing managers to customize disclaimers for different branches:

- **`terms_and_conditions` Table**:
  - `id` (uuid, primary key).
  - `branch_id` (uuid, references `branches.id` on delete cascade). If null, acts as the default template for the shop.
  - `receipt_disclaimer` (text): Printed at the bottom of intake Receipts.
  - `quote_disclaimer` (text): Printed at the bottom of Estimates.
  - `invoice_disclaimer` (text): Printed at the bottom of Tax Invoices.
  - `updated_by` (uuid, references `profiles.id`).
  - `updated_at` (timestamptz).

---

### 37.2 Standard Liability & Operations Clauses

The following standard disclaimers are configured by default in the system:

#### 37.2.1 Diagnostic & Inspection Fees
- **Clause**: An inspection fee is charged for all diagnostics, regardless of whether the customer chooses to proceed with repairs. This fee covers the technician's bench time and diagnostic testing.
- **Value**: Standard fee ranges from 500 to 2,000 INR depending on the equipment type (mirrorless bodies, zoom lenses, or cinema equipment).

#### 37.2.2 Unclaimed Equipment Disposal
- **Clause**: Equipment not collected within 90 days of completion or inspection will be subject to a storage fee of 50 INR per day. Equipment unclaimed after 180 days will be considered abandoned. The shop reserves the right to sell or dispose of the equipment to recover diagnostics, parts, and storage costs.

#### 37.2.3 Data & Settings Loss Disclaimer
- **Clause**: The service center is not responsible for the loss or corruption of custom settings, profiles, presets, or media stored on memory cards or internal memory. Customers are advised to remove memory cards and back up settings before checking in equipment.

#### 37.2.4 Liquid & Impact Damage Risks
- **Clause**: Equipment checked in with liquid or impact damage carries a high risk of failure during diagnostics or disassembly due to corrosion or internal structural weakness. The service center is not liable for further degradation or failures that occur during diagnostic handling.

---

### 37.3 Repair Warranty Mappings

Warranties for repairs and replacement parts are printed on Tax Invoices:
- **Labor Warranty**: Repairs include a 30-day warranty on labor from the date of collection (`service_date`), covering only the specific components serviced.
- **Spare Parts Warranty**: OEM replacement parts carry warranties determined by their manufacturers (typically 90 days to 1 year). Third-party or refurbished components carry a flat 30-day warranty.
- **Warranty Exclusions**: Warranties do not cover subsequent water exposure, physical impacts, misuse, or repairs performed by unauthorized service centers.

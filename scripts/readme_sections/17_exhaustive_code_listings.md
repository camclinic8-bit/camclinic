## 22. PDF Rendering Coordinates & Canvas Geometry

This section details the coordinate grids, padding, line heights, page dimensions, and rendering math used by the jsPDF engine in `src/lib/utils/pdf.ts` to generate A4 documents.

---

### 22.1 A4 Page Specifications & Boundaries
The PDF documents are designed for standard A4 paper sizes using the metric system (millimeters):
- **Page Width ($W_{page}$)**: 210 mm.
- **Page Height ($H_{page}$)**: 297 mm.
- **Left/Right Margins ($M_{x}$)**: 12 mm. This sets the usable content width ($W_{content}$) to:
  $$W_{content} = W_{page} - 2 \times M_{x} = 210 - 24 = 186 \text{ mm}$$
- **Top/Bottom Margins ($M_{y}$)**: 12 mm.

---

### 22.2 Grid Layout Systems

```
0 mm ------------------------------------------------------------- 210 mm
     |                                                           |
     |   12 mm [Margin]                                          |
     |   +---------------------------------------------------+   |
     |   |                   HEADER CARD                     |   |
     |   |                                                   |   |
     |   |  Logo Panel (60mm)   |   Company Details (91mm)   |   |
     |   |                      |                            |   |
     |   +---------------------------------------------------+   |
     |   |                 CUSTOMER & JOB INFO               |   |
     |   |                                                   |   |
     |   |  Customer (93mm)     |   Job Details (93mm)       |   |
     |   +---------------------------------------------------+   |
     |   |                 PRODUCTS TABLE                    |   |
     |   |                                                   |   |
     |   |  # | Model | Serial | Condition | Remarks         |   |
     |   +---------------------------------------------------+   |
     |   |                 BILLING SUMMARY                   |   |
     |   |                                                   |   |
     |   |                                Subtotal           |   |
     |   |                                GST (18%)          |   |
     |   |                                Grand Total        |   |
     |   |                                Balance Due        |   |
     |   +---------------------------------------------------+   |
     |   |                 FOOTER NOTES & T&C                |   |
     |   +---------------------------------------------------+   |
     |   |                 SIGNATURE BLOCKS                  |   |
     |   +---------------------------------------------------+   |
     |   +---------------------------------------------------+   |
     |   |                   PAGE NUMBER                     |   |
     |   +---------------------------------------------------+   |
     |                                                           |
297 mm -------------------------------------------------------------
```

#### 22.2.1 Header Card Layout (Starting at $Y = 10$ mm)
- **Outer Box**: Drawn from $X = 12$ mm to $X = 198$ mm. Width = 186 mm, Height = 38 mm.
- **Divider Line**: Drawn vertically at $X = 95$ mm.
- **Logo Panel**: Starts at $X = 12$ mm, extending to $X = 95$ mm (width = 83 mm). The logo image (width = 60 mm, height = 22.9 mm) is horizontally and vertically centered:
  $$X_{logo} = 12 + \frac{83 - 60}{2} = 23.5 \text{ mm}$$
  $$Y_{logo} = 10 + \frac{38 - 22.9}{2} = 17.55 \text{ mm}$$
- **Contact Details Panel**: Starts at $X = 95$ mm, extending to $X = 198$ mm (width = 103 mm). Addresses and contact text are right-aligned with a 3mm safety margin:
  $$X_{text\_align} = 198 - 3 = 195 \text{ mm}$$

#### 22.2.2 Customer & Job Info Card (Starting at $Y = 52$ mm)
- **Outer Box**: Starts at $Y = 52$ mm with a height of 24 mm.
- **Divider Line**: Drawn vertically at $X = 105$ mm.
- **Customer Box**: Left column starts at $X = 12$ mm (width = 93 mm).
- **Job Details Box**: Right column starts at $X = 105$ mm (width = 93 mm).
- **Line Heights**: Text lines are spaced by 4.5 mm to prevent overlaps.

#### 22.2.3 Products Details Table (Starting at $Y = 80$ mm)
- **Width**: Spans the full content width (186 mm).
- **Columns Structure**:
  1. Index (`#`): 8 mm.
  2. Product Description: 42 mm.
  3. Serial Number: 30 mm.
  4. Cosmetic Condition: 22 mm.
  5. Reported Issues: 34 mm.
  6. Accessories & Remarks: 34 mm.
  7. Warranty: 16 mm.

#### 22.2.4 Spare Parts & Labor Table (Starting at $Y = 145$ mm)
- **Width**: Spans the full content width (186 mm).
- **Columns Structure**:
  1. Index (`#`): 10 mm.
  2. Description: 80 mm.
  3. HSN Code: 24 mm.
  4. Quantity: 16 mm.
  5. Unit Price: 26 mm.
  6. Total Amount: 30 mm.

---

### 22.3 PDF Font Sizing & Typography Standards

To ensure clean and legible documentation, all generated PDFs follow these typography rules:
- **Primary Font**: Helvetica (built-in PDF standard font).
- **Section Headers**: 9 pt bold. Used for block labels (e.g. "CUSTOMER INFORMATION", "BILLING DETAILS").
- **Body Details / Values**: 7.5 pt regular. Used for customer details, table rows, and description fields.
- **Label Prefixes**: 7.5 pt bold. Used for key names (e.g. "MOB:", "EMAIL:", "GSTIN:").
- **Table Headers**: 7.5 pt bold. White text (`[255, 255, 255]`) rendered on a solid black header background (`[0, 0, 0]`).
- **Footer Text**: 6.5 pt regular. Used for terms disclaimers and page numbers.

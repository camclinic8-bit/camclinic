## 30. Complete System Utility Code Listings

This section provides the complete source code listings for the core utility libraries and UI helper components.

---

### 30.1 Currency Formatter (`src/lib/utils/currency.ts`)
```typescript
import { formatINR } from './currency';

/**
 * Formats a numeric value into the Indian Rupee (INR) currency format (₹).
 * Handles rounding parameters and matches standard Indian numbering groupings (e.g. 1,00,000).
 */
export function formatINR(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '₹0.00';
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}
```

---

### 30.2 Date Formatter Wrapper (`src/lib/utils/dates.ts`)
```typescript
import { format, parseISO, isValid } from 'date-fns';

export function formatDate(dateStr: string | null | undefined, formatStr = 'dd-MMM-yyyy'): string {
  if (!dateStr) return '—';
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return '—';
    return format(date, formatStr);
  } catch {
    return '—';
  }
}

export function formatDateTime(dateStr: string | null | undefined, formatStr = 'dd-MMM-yyyy hh:mm a'): string {
  if (!dateStr) return '—';
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return '—';
    return format(date, formatStr);
  } catch {
    return '—';
  }
}

export function getLocalToday(): string {
  return new Date().toISOString().slice(0, 10);
}
```

---

### 30.3 Profile Initials Utility (`src/lib/utils/initials.ts`)
```typescript
export function nameInitials(name: string | null | undefined): string {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}
```

---

### 30.4 Job Numbers Generator (`src/lib/utils/jobNumber.ts`)
```typescript
export function generateTempJobNumber(branchCode: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randSeq = Math.floor(1000 + Math.random() * 9000);
  return `CC-${dateStr}-${randSeq}-TEMP`;
}
```

---

### 30.5 Product Details Summary Formatter (`src/lib/utils/jobProducts.ts`)
```typescript
export interface MinimalProduct {
  brand: string | null;
  model: string | null;
}

export function summarizeJobProductsLine(
  products: MinimalProduct[] | null | undefined,
  options: { maxEach?: number; maxLine?: number } = {}
): { line: string; full: string } {
  if (!products || products.length === 0) {
    return { line: '—', full: '—' };
  }

  const maxEach = options.maxEach ?? 32;
  const maxLine = options.maxLine ?? 72;

  const names = products.map((p) => {
    const brand = p.brand?.trim() || '';
    const model = p.model?.trim() || '';
    let combined = brand && model ? `${brand} ${model}` : brand || model || 'Unknown Product';
    if (combined.length > maxEach) {
      combined = combined.slice(0, maxEach) + '...';
    }
    return combined;
  });

  const full = names.join(', ');
  let line = full;
  if (line.length > maxLine) {
    line = line.slice(0, maxLine) + '...';
  }

  return { line, full };
}
```

---

### 30.6 Product Normalization Utility (`src/lib/utils/normalizeJobProduct.ts`)
```typescript
import { ProductCondition } from '@/types/enums';

export function normalizeJobProductCondition(cond: unknown): ProductCondition[] {
  if (!cond) return [];
  if (Array.isArray(cond)) {
    return cond.filter((c): c is ProductCondition => 
      ['good', 'dusty', 'scratches', 'damage', 'not_working', 'dead', 'liquid_damage'].includes(String(c))
    );
  }
  if (typeof cond === 'string') {
    const split = cond.split(',').map(s => s.trim());
    return split.filter((c): c is ProductCondition => 
      ['good', 'dusty', 'scratches', 'damage', 'not_working', 'dead', 'liquid_damage'].includes(c)
    );
  }
  return [];
}
```

---

### 30.7 Table Component implementation (`src/components/ui/Table.tsx`)
```typescript
'use client';

import { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}

export function Table({ children, className = '', containerClassName = 'overflow-x-auto' }: TableProps) {
  return (
    <div className={containerClassName}>
      <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <thead className="bg-gray-50">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>;
}

export function TableRow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <tr className={`hover:bg-gray-50 ${className}`}>{children}</tr>;
}

export function TableHead({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm text-gray-900 ${className}`}>{children}</td>;
}

export function TableEmpty({
  message = 'No data available',
  colSpan = 100,
}: {
  message?: string;
  colSpan?: number;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-sm text-gray-500">
        {message}
      </td>
    </tr>
  );
}
```

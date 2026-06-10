## 24. React UI Component Library & Styles Architecture

This section documents the props, rendering mechanics, CSS classes, and style systems for the core UI components in the `src/components/` directory.

---

### 24.1 Component Specifications

#### 24.1.1 Chip Input Component (`src/components/ui/ChipInput.tsx`)
Allows users to enter lists of items (e.g. custom product conditions, accessories) as visual chips by pressing `Enter` or `,`.

- **Component Signature**:
  ```typescript
  interface ChipInputProps {
    label?: string;
    placeholder?: string;
    value: string[];
    onChange: (value: string[]) => void;
    error?: string;
  }
  ```
- **State and Key Listeners**:
  - `inputValue` (string state): Tracks the current input text.
  - `onKeyDown(e)`: Intercepts `Enter` or `,` keys:
    ```typescript
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = inputValue.trim();
      if (val && !value.includes(val)) {
        onChange([...value, val]);
      }
      setInputValue('');
    }
    ```
  - `removeChip(index)`: Removes the chip at the specified index from the array.

#### 24.1.2 Product Warranty Fields Component (`src/components/jobs/ProductWarrantyFields.tsx`)
Manages conditional form fields for product warranties (warranty description, expiry date, images).

- **Component Signature**:
  ```typescript
  interface ProductWarrantyFieldsProps {
    control: Control<any>;
    index: number;
    register: UseFormRegister<any>;
    setValue: UseFormSetValue<any>;
  }
  ```
- **Behavior**:
  - Monitors the `has_warranty` checkbox using React Hook Form's `useWatch` hook.
  - If `has_warranty` is checked, it renders inputs for the warranty description, expiry date, and receipt file uploads.
  - Automatically clears warranty values if `has_warranty` is unchecked to prevent submitting stale data.

#### 24.1.3 Job Priority Badge Component (`src/components/jobs/JobPriorityBadge.tsx`)
Renders color-coded badges for job priorities.

- **Badges Variant Map**:
  - `immediate`: Solid red badge (`bg-red-100 text-red-800 ring-red-600/20`).
  - `high`: Solid orange badge (`bg-orange-100 text-orange-800 ring-orange-600/20`).
  - `medium`: Solid blue badge (`bg-blue-100 text-blue-800 ring-blue-600/20`).
  - `low`: Solid gray badge (`bg-gray-100 text-gray-800 ring-gray-600/20`).

#### 24.1.4 Job Status Badge Component (`src/components/jobs/JobStatusBadge.tsx`)
Renders color-coded badges for job statuses:
- `new`: Light blue (`bg-sky-50 text-sky-700 border-sky-200`).
- `inspected`: Light purple (`bg-purple-50 text-purple-700 border-purple-200`).
- `pending_approval`: Light yellow (`bg-yellow-50 text-yellow-700 border-yellow-200`).
- `quote_sent`: Light orange (`bg-amber-50 text-amber-700 border-amber-200`).
- `approved`: Medium green (`bg-emerald-50 text-emerald-700 border-emerald-200`).
- `disapproved`: Medium red (`bg-rose-50 text-rose-700 border-rose-200`).
- `spare_parts_pending`: Dark yellow (`bg-orange-50 text-orange-700 border-orange-200`).
- `in_progress`: Solid blue (`bg-blue-50 text-blue-700 border-blue-200`).
- `completed`: Solid green (`bg-green-50 text-green-700 border-green-200`).
- `cancelled`: Solid gray (`bg-gray-50 text-gray-700 border-gray-200`).

---

### 24.2 Tailwind CSS v4 Configuration & Layout Engine

Cam Clinic uses Tailwind CSS v4.0 with vanilla CSS imports to manage styling.

#### 24.2.1 Color Palette Variables (`globals.css`)
Tailwind v4 maps theme colors to custom properties in `globals.css`:
```css
@import "tailwindcss";

:root {
  --background: #f9fafb;
  --foreground: #111827;
  --primary: #2563eb;       /* Royal Blue */
  --primary-hover: #1d4ed8;
  --border: #e5e7eb;
}
```

#### 24.2.2 CSS Scrollbar Utilities
Custom scrollbar classes are defined using CSS variables:
```css
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
```

#### 24.2.3 Layout Breakpoints
The UI uses responsive layout classes based on screen widths:
- **Mobile** (`< 640px`): Single-column grids, hidden table columns (except Job and Customer columns), and a collapsible mobile sidebar.
- **Tablet** (`>= 768px`): Display columns for Products and Status. Expanded toolbar filtering.
- **Laptop / Desktop** (`>= 1024px`): Full table listings with sticky headers, side-by-side splits, and a persistent navigation sidebar.

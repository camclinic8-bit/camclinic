# Cam Clinic — Components

## UI Primitives `src/components/ui/`

| File | Exports | Props / Behavior |
|---|---|---|
| `Button.tsx` | `Button` (forwardRef) | variant: primary/secondary/outline/ghost/danger, size: sm/md/lg, isLoading (shows Loader2 spinner) |
| `Input.tsx` | `Input` (forwardRef) | label, error, type (password has Eye/EyeOff toggle) |
| `Select.tsx` | `Select` (forwardRef) | label, error, options: {value,label}[], placeholder. Native select |
| `Card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` | Composable: Card=bg-white rounded shadow-sm, Header=border-b, Title=text-lg font-semibold, Content=p-4, Footer=border-t bg-gray-50 |
| `Badge.tsx` | `Badge` | variant: default/success/warning/danger/info/gray, size: sm/md. Rounded pill |
| `Modal.tsx` | `Modal` | isOpen, onClose, title, size: sm/md/lg/xl. Backdrop click + Escape close, scroll lock |
| `Table.tsx` | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableEmpty` | Table=overflow-x-auto wrapper. TableEmpty takes colSpan (default 100) |
| `ChipInput.tsx` | `ChipInput` (memo) | value: string[], onChange. Enter/comma adds, Backspace removes last, blur adds. Blue pills with X |
| `ErrorBoundary.tsx` | `ErrorBoundary` (class) | Shows "Something went wrong" + refresh. Dev mode: stack trace in `<details>` |
| `index.ts` | barrel | Re-exports all above |

## Job Components `src/components/jobs/`

| File | Exports | Props / Behavior |
|---|---|---|
| `JobCard.tsx` | `JobCard` | job: JobWithRelations. Link card, priority color left-border. Prefetches detail on hover/focus |
| `JobPriorityBadge.tsx` | `JobPriorityBadge` | priority: JobPriority, size. Maps: immediate→danger, high→warning, medium→info, low→gray |
| `JobStatusBadge.tsx` | `JobStatusBadge` | status: JobStatus, size. Maps all 10 statuses |
| `ProductWarrantyFields.tsx` | `ProductWarrantyFields` | control, index, register, setValue. useWatch on has_warranty, shows/hides warranty fields |

## Layout Components `src/components/layout/`

| File | Exports | Props / Behavior |
|---|---|---|
| `Sidebar.tsx` | `Sidebar` | Responsive: mobile drawer w/ backdrop, desktop collapsible (64px ↔ 4.25rem). Role-filtered nav: all→Dashboard/Customers/Reports; SA/SM/SI→Team/Branches. Bottom: user info + sign out |
| `Header.tsx` | `Header` | title: string. White bar, title, optional BranchSelector (if canViewAllBranches), bell icon |
| `BranchSelector.tsx` | `BranchSelector` | Uses useBranches() + branchStore. Dropdown with "All Branches". Skeleton when loading |
| `index.ts` | barrel | Re-exports Sidebar, Header, BranchSelector |

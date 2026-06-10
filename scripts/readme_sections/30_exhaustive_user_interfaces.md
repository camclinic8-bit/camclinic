## 36. User Interface Layouts & Design Geometry

This section documents the visual designs, flex grids, side-by-side card proportions, padding values, hover animations, and responsive breakpoints of the dashboard pages.

---

### 36.1 Dashboard Layout Geometry
The main application shell uses a two-panel structure: a navigation sidebar on the left and a content panel on the right.

#### 36.1.1 Sidebar Navigation Panel
- **Proportions**:
  - Desktop: Fixed width of `w-64` (256px).
  - Mobile: Collapsible panel toggled via a hamburger button in the header.
- **Styling**: Solid white background (`bg-white`) bordered by a light gray border (`border-r border-gray-200`).
- **Items**: Flex list item elements with 10px spacing.
- **Animations**: Left-border slide-ins and background color transitions on hover.

#### 36.1.2 Main Content Viewport
- **Grid Layout**: Flex column structure with full height (`h-screen overflow-hidden`).
- **Padding**: Responsive layout padding (`p-4` on mobile screens, `lg:p-6` on desktops).
- **Background**: Light gray canvas (`bg-gray-50`) to highlight card surfaces.

---

### 36.2 Card Component Proportions
Metric cards and table panels use a structured flex system:
- **Card Surface**: Solid white backgrounds (`bg-white`) with subtle shadow overlays (`shadow-sm`) and light gray borders (`border-gray-200/80`).
- **Metric Cards Grid**:
  - Displays as a two-column grid on mobile (`grid-cols-2`).
  - Scales to three columns on tablets (`md:grid-cols-3`).
  - Scales to six columns on desktops (`lg:grid-cols-6`).
  - Each metric card has a fixed height (76px) containing a rounded icon badge (36x36px) and text summaries.

---

### 36.3 Form Layout Fields & Alignment
Form elements in the **New Job** and **Edit Job** pages are structured into three main blocks:

#### 36.3.1 Customer Information Card
- **Search Panel**: Full-width container featuring a search bar. The search results dropdown uses absolute positioning and is capped at a max height of 192px with vertical overflow scrolling.
- **Onboard Form**: A grid that displays as one column on mobile and two columns on desktop (`grid grid-cols-1 sm:grid-cols-2 gap-4`).

#### 36.3.2 Job Details Card
- **Branch Selection**: A two-column selector.
- **Assignment & Priority Grid**:
  - Displays as one column on mobile.
  - Scales to three columns on desktops (`grid grid-cols-1 md:grid-cols-3 gap-4`).
- **Charges & Delivery Dates**:
  - Displays as one column on mobile.
  - Scales to three columns on desktops.

#### 36.3.3 Products Listing Array
- **Intake Row Box**: Each product is wrapped in a gray border box with 16px padding.
- **Brand & Model Grid**: A three-column grid.
- **Condition Grids**: A checkbox list grouped in a two-column layout.
- **Accessories Selection**: Renders as a list of checkbox buttons with 8px gaps.

---

### 36.4 Responsive Tables & Scroll Mechanics
Table lists are designed to remain readable on small screens:
- **Mobile Viewport**: The table is wrapped in a scroll container that allows horizontal scrolling. Columns like Products, Created, Total, and Technician are hidden on small viewports to keep the table clean.
- **Avatars**: The first column (**Job**) displays a name initials avatar (32x32px) and the job number.
- **Sticky Column Stacking**: The Job column has a left shadow overlay (`shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`) and a sticky left position. This keeps the job number visible while horizontal scrolling is active.

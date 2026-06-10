## 33. Software Architecture Theories & Design Patterns

This section documents the software engineering design principles, Clean Architecture guidelines, and optimization methods applied in the Cam Clinic codebase.

---

### 33.1 SOLID Design Principles in React & TypeScript

SOLID design principles are applied to ensure modularity and ease of maintenance:

#### 33.1.1 Single Responsibility Principle (SRP)
Each component and module has a single responsibility:
- **UI Components**: Components in `src/components/ui/` (such as `Button`, `Input`, `Table`) are strictly presentational. They receive data and call handlers via props, and do not manage business logic or database operations.
- **Data Hook Layer**: Hooks in `src/hooks/` (like `useJobs`, `useAuth`) manage server state queries and cache updates, separating data fetching from UI components.
- **Zustand Stores**: Stores in `src/stores/` manage global client state variables (such as auth context or active branch selections) in isolation from database logic.

#### 33.1.2 Open/Closed Principle (OCP)
System modules are designed to be open for extension but closed for modification.
- **Badge Variant Systems**: Components like `JobStatusBadge` and `JobPriorityBadge` map categories to styles using configuration objects (lookup maps) rather than nested `if/else` checks. Adding a new priority or status requires updating the lookup map without changing the component's core rendering logic.
- **Flexible Table Wrapper**: The `Table` component supports custom wrappers by accepting an optional `containerClassName` prop. This allows the Jobs list page to disable the default overflow wrapper for custom scroll behaviors without changing the table component itself.

#### 33.1.3 Liskov Substitution Principle (LSP)
TypeScript interfaces are structured to allow subclassing or parameter replacements safely:
- **Form Fields Components**: Custom form input fields (like `Input` and `Select`) extend standard HTML input properties (`React.InputHTMLAttributes<HTMLInputElement>`). They can be used as drop-in replacements for standard HTML elements.

#### 33.1.4 Interface Segregation Principle (ISP)
Interfaces are split into small, client-specific definitions:
- **Specialized Interfaces**: Custom model types in `src/types/` are split into small interfaces. For example, `Job` contains only job card attributes, while `JobWithRelations` extends it to include customer and technician details. This ensures components only import the specific fields they need.

#### 33.1.5 Dependency Inversion Principle (DIP)
High-level modules depend on abstractions (interfaces) rather than low-level implementations:
- **Client Factory initializers**: Components do not instantiate database client engines directly. Instead, database client instances are fetched from helper initializers (like `createClient()`). This allows switching between SSR server-side, browser client, or mock testing clients without changing the query logic in hooks or API controllers.

---

### 33.2 Clean Architecture & Layered Boundaries

The application enforces boundaries between layers to protect the business logic:

```
+-------------------------------------------------------------+
|                     1. PRESENTATION LAYER                   |
|         React Components, Tailwind CSS, jsPDF Views         |
+------------------------------+------------------------------+
                               | Uses Hooks / Actions
                               v
+-------------------------------------------------------------+
|                      2. DATA CONTROL LAYER                  |
|         React Query Custom Hooks, Zustand Stores            |
+------------------------------+------------------------------+
                               | Uses DB APIs / Clients
                               v
+-------------------------------------------------------------+
|                      3. DATABASE INTEGRATION                |
|             Supabase Clients, Mappings, Schemas             |
+-------------------------------------------------------------+
```

1. **Presentation Layer**: React views and PRESENTATION components. They consume data exposed by custom hooks and update stores via actions.
2. **Data Control Layer**: Zustand stores and React Query hooks. They coordinate caching, manage mutations, and handle cache invalidation.
3. **Database Integration Layer**: Supabase clients, TypeScript types, and database queries. They map API endpoints to database records.

---

### 33.3 Performance Optimization Theories

To support large datasets (10,000+ jobs), the application implements several performance optimization techniques:

- **React Memoization**: Expensive calculations (like flattening paginated database pages using `useMemo`) are cached. Re-renders only run if the reference parameters change.
- **Scroll Throttling**: The mouse-drag scrolling callback uses requestAnimationFrame to synchronize scroll calculations with screen refreshes, preventing rendering lag.
- **Debounced Inputs**: Searching indices (such as searching customers by phone or name) uses a 250ms debounce window. This prevents database queries from firing on every keystroke, reducing server load.

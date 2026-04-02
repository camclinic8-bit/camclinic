# Role-Based Access Control (RBAC) Implementation

## Overview
This document outlines the role-based access control (RBAC) system implemented for the Cam Clinic application to ensure users only see and access data relevant to their role and branch.

## User Roles and Permissions

### 1. Super Admin / Owner
- **Full Access**: Can view and manage all data across all branches
- **Branch Management**: Can create, update, and delete branches
- **User Management**: Can create and manage users for any branch
- **Job Management**: Can view and manage all jobs across all branches
- **Customer Management**: Can view and manage all customers across all branches
- **Reports**: Full access to all reports and analytics

### 2. Service Manager
- **Branch Access**: Can view all branches (for job assignment purposes)
- **Job Management**: Full access to jobs in their assigned branch only
- **Customer Management**: Full access to customers in their branch only
- **Technician Management**: Can create, update, and manage technicians for their branch
- **Reports**: Access to reports for their branch only
- **Cross-Branch Assignment**: Can assign jobs to other branches for delivery/service

### 3. Service Incharge
- **Branch Access**: Can view all branches (for job assignment purposes)
- **Job Management**: Full access to jobs in their assigned branch only
- **Customer Management**: Can view customers in their branch only
- **Limited User Management**: Can view technicians and service incharges in their branch
- **Reports**: Access to reports for their branch only

### 4. Technician
- **Limited Access**: Can ONLY see their own branch information
- **Job Access**: Can ONLY view jobs assigned to them
- **Customer Access**: Can ONLY view customers for jobs assigned to them
- **Profile Access**: Can only view and update their own profile
- **No Management**: Cannot manage other users, branches, or system settings

## Database-Level Security (RLS Policies)

### Implementation Details
The system uses PostgreSQL Row Level Security (RLS) policies to enforce data access at the database level. This ensures that even if someone bypasses the frontend, they cannot access unauthorized data.

### Key Policies Implemented:

#### Profiles Table
- **Super Admin**: Can view all profiles in their shop
- **Service Manager**: Can view profiles in their branch only
- **Service Incharge**: Can view profiles in their branch only
- **Technician**: Can only view their own profile

#### Jobs Table
- **Super Admin**: Can view all jobs across all branches
- **Service Manager**: Can view all jobs in their branch
- **Service Incharge**: Can view all jobs in their branch
- **Technician**: Can ONLY view jobs assigned to them

#### Customers Table
- **Super Admin**: Can view all customers across all branches
- **Service Manager**: Can view customers in their branch only
- **Service Incharge**: Can view customers in their branch only
- **Technician**: Can view customers only for their assigned jobs

#### Branches Table
- **Super Admin**: Can view and manage all branches
- **Service Manager**: Can view all branches (for assignment)
- **Service Incharge**: Can view all branches (for assignment)
- **Technician**: Can only view their own branch

## Frontend Implementation

### React Query Hooks
All data fetching hooks have been updated to:
1. Include user role and ID in query keys for proper caching
2. Filter data based on user role
3. Disable queries for unauthorized roles

### UI Components
- **Sidebar Navigation**: Menu items are filtered based on user role
- **Data Tables**: Only show data the user is authorized to see
- **Forms**: Limit options based on user permissions (e.g., branch selection)

### Example Restrictions:
```javascript
// Technicians only see their assigned jobs
const actualFilters = user?.role === 'technician' 
  ? { ...filters, assignedTechnicianId: user.id }
  : filters;

// Service managers cannot view technicians management
enabled: !!user && (user?.role === 'super_admin' || user?.role === 'service_manager')
```

## Migration Instructions

To apply the new RLS policies:

1. **Manual Execution** (Recommended):
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase/migrations/004_update_rls_policies.sql`
   - Execute the SQL

2. **Key Changes in Migration**:
   - Drops existing policies
   - Creates new role-specific policies
   - Implements branch-level restrictions
   - Adds technician-specific limitations

## Security Considerations

### Defense in Depth
1. **Database Level**: RLS policies prevent unauthorized data access
2. **API Level**: Middleware checks authentication
3. **Frontend Level**: UI components hide unauthorized features
4. **Query Level**: React Query filters data client-side

### Important Notes
- Technicians are strictly limited to their assigned jobs only
- Service managers can assign jobs to other branches for delivery
- Service incharges have similar permissions to service managers but limited to their branch
- Super admins have unrestricted access within their shop
- All cross-branch data is filtered by shop_id for multi-tenant isolation

## Testing the Implementation

### Test Scenarios:
1. **Technician Login**:
   - Should only see their assigned jobs
   - Should only see their branch in branch selector
   - Should not see Technicians or Branches menu items

2. **Service Manager Login**:
   - Should see all jobs in their branch
   - Should see all branches for assignment
   - Should manage technicians for their branch

3. **Super Admin Login**:
   - Should see all data across all branches
   - Should have access to all management features
   - Should be able to manage users for any branch

## Future Enhancements

1. **Audit Logging**: Track who accesses what data
2. **Time-Based Access**: Restrict access based on business hours
3. **IP Restrictions**: Limit access from specific locations
4. **Data Encryption**: Encrypt sensitive data at rest

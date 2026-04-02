'use client';

import { useState } from 'react';
import { User, Shield, Building2, UserPlus } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { useAllUsers, useUpdateUserRole } from '@/hooks/useTechnicians';
import { useBranches } from '@/hooks/useBranches';
import { useQueryClient } from '@tanstack/react-query';
import { USER_ROLE_LABELS, UserRole } from '@/types/enums';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const { data: users, isLoading, error, refetch } = useAllUsers();
  const { data: branches } = useBranches();
  const updateRole = useUpdateUserRole();
  const queryClient = useQueryClient();

  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('technician');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    role: 'technician' as UserRole,
    branchId: '',
  });

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <Header title="Settings" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <p className="text-gray-500">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const roleOptions = Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const branchOptions = [
    { value: '', label: 'No Branch' },
    ...(branches || []).map(b => ({ value: b.id, label: b.name })),
  ];

  const handleEditUser = (userId: string, role: UserRole, branchId: string | null) => {
    setEditingUser(userId);
    setSelectedRole(role);
    setSelectedBranch(branchId || '');
  };

  const handleSaveRole = async (userId: string) => {
    try {
      await updateRole.mutateAsync({
        userId,
        role: selectedRole,
        branchId: selectedBranch || null,
      });
      toast.success('User role updated successfully');
      setEditingUser(null);
      
      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      await queryClient.invalidateQueries({ queryKey: ['technicians'] });
      await queryClient.invalidateQueries({ queryKey: ['serviceIncharges'] });
      refetch();
    } catch (error) {
      console.error('Update role error:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleResetPassword = (userId: string) => {
    setPasswordUserId(userId);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handleSavePassword = async () => {
    if (!passwordUserId || !newPassword) return;
    
    setIsUpdatingPassword(true);
    try {
      const response = await fetch('/api/users/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: passwordUserId, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      toast.success('Password updated successfully');
      setShowPasswordModal(false);
      setPasswordUserId(null);
      setNewPassword('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // Use API route with service role to create user instantly
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUserForm.email,
          password: newUserForm.password,
          fullName: newUserForm.fullName,
          phone: newUserForm.phone,
          role: newUserForm.role,
          branchId: newUserForm.branchId || null,
          shopId: currentUser?.shop_id || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      toast.success('User created successfully! They can login immediately.');
      setShowAddModal(false);
      setNewUserForm({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        role: 'technician',
        branchId: '',
      });
      
      // Invalidate multiple queries to ensure fresh data
      await queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      await queryClient.invalidateQueries({ queryKey: ['technicians'] });
      await queryClient.invalidateQueries({ queryKey: ['serviceIncharges'] });
      
      // Force refetch for immediate UI update
      await refetch();
      
      // Show additional feedback
      setTimeout(() => {
        toast.info('User list refreshed');
      }, 500);
    } catch (error) {
      console.error('Create user error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="Settings" />
      
      <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Shield className="h-5 w-5" />
                User Management
              </CardTitle>
              <Button onClick={() => setShowAddModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-500">Loading users...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <p className="text-red-600">Failed to load users</p>
                <Button onClick={() => refetch()} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users && users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-full">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.full_name}</p>
                              {user.phone && (
                                <p className="text-xs text-gray-500">{user.phone}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingUser === user.id ? (
                            <Select
                              options={roleOptions}
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                              className="w-40"
                            />
                          ) : (
                            <Badge variant="info">{USER_ROLE_LABELS[user.role]}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingUser === user.id ? (
                            <Select
                              options={branchOptions}
                              value={selectedBranch}
                              onChange={(e) => setSelectedBranch(e.target.value)}
                              className="w-40"
                            />
                          ) : (
                            <span className="text-sm text-gray-600">
                              {branches?.find(b => b.id === user.branch_id)?.name || '-'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? 'success' : 'gray'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.id !== currentUser?.id && (
                            editingUser === user.id ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveRole(user.id)}
                                  isLoading={updateRole.isPending}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingUser(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditUser(user.id, user.role, user.branch_id)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleResetPassword(user.id)}
                                >
                                  Reset Password
                                </Button>
                              </div>
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableEmpty message="No users found" />
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Building2 className="h-5 w-5" />
              Role Descriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">Super Admin</p>
                <p className="text-gray-600">Full access to all features, can manage users, branches, and settings.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">Service Manager</p>
                <p className="text-gray-600">Can manage jobs, assign tasks to technicians, view reports, and manage customers.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">Service Incharge</p>
                <p className="text-gray-600">Can create and manage jobs, assign to technicians, and update job status.</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">Technician</p>
                <p className="text-gray-600">Can view assigned jobs, update job status, and add technician notes.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New User"
        size="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full Name"
            value={newUserForm.fullName}
            onChange={(e) => setNewUserForm(f => ({ ...f, fullName: e.target.value }))}
            required
            placeholder="Enter full name"
          />
          <Input
            label="Email"
            type="email"
            value={newUserForm.email}
            onChange={(e) => setNewUserForm(f => ({ ...f, email: e.target.value }))}
            required
            placeholder="Enter email address"
          />
          <Input
            label="Password"
            type="password"
            value={newUserForm.password}
            onChange={(e) => setNewUserForm(f => ({ ...f, password: e.target.value }))}
            required
            placeholder="Enter password (min 6 characters)"
            minLength={6}
          />
          <Input
            label="Phone (Optional)"
            value={newUserForm.phone}
            onChange={(e) => setNewUserForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="Enter phone number"
          />
          <Select
            label="Role"
            options={roleOptions}
            value={newUserForm.role}
            onChange={(e) => setNewUserForm(f => ({ ...f, role: e.target.value as UserRole }))}
          />
          <Select
            label="Branch (Optional)"
            options={branchOptions}
            value={newUserForm.branchId}
            onChange={(e) => setNewUserForm(f => ({ ...f, branchId: e.target.value }))}
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isCreating}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordUserId(null);
          setNewPassword('');
        }}
        title="Reset User Password"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter a new password for this user. They will be able to login immediately with the new password.
          </p>
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password (min 6 characters)"
            minLength={6}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordUserId(null);
                setNewPassword('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePassword}
              isLoading={isUpdatingPassword}
              disabled={newPassword.length < 6}
            >
              Update Password
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

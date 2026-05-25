'use client';

import { useMemo, useState } from 'react';
import { User, Shield, Building2, UserPlus, Users2, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { useTeamMembers, useUpdateUserProfile } from '@/hooks/useTechnicians';
import { useBranches } from '@/hooks/useBranches';
import { useQueryClient } from '@tanstack/react-query';
import { USER_ROLE_LABELS, UserRole } from '@/types/enums';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils/dates';
import { toast } from 'sonner';
import { Profile } from '@/types/user';

const ROLE_SORT: Record<UserRole, number> = {
  super_admin: 0,
  service_manager: 1,
  service_incharge: 2,
  technician: 3,
};

function mergeTeamList(prev: Profile[] | undefined, profile: Profile): Profile[] {
  const list = prev ?? [];
  const without = list.filter((x) => x.id !== profile.id);
  return [...without, profile].sort((a, b) => {
    const rd = ROLE_SORT[a.role] - ROLE_SORT[b.role];
    if (rd !== 0) return rd;
    return a.full_name.localeCompare(b.full_name);
  });
}

export default function TeamPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const { data: members, isLoading, isFetching, error, refetch } = useTeamMembers();
  const { data: branches } = useBranches();
  const updateProfile = useUpdateUserProfile();
  const queryClient = useQueryClient();

  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('technician');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedActive, setSelectedActive] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalStep, setAddModalStep] = useState<'form' | 'success'>('form');
  const [createdProfile, setCreatedProfile] = useState<Profile | null>(null);
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

  const sortedMembers = useMemo(() => {
    if (!members?.length) return [];
    return [...members].sort((a, b) => {
      const rd = ROLE_SORT[a.role] - ROLE_SORT[b.role];
      if (rd !== 0) return rd;
      return a.full_name.localeCompare(b.full_name);
    });
  }, [members]);

  const roleOptions = Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const branchOptions = [
    { value: '', label: 'No Branch' },
    ...(branches || []).map((b) => ({ value: b.id, label: b.name })),
  ];

  const statusEditOptions = [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  const handleEditUser = (
    userId: string,
    role: UserRole,
    branchId: string | null,
    isActive: boolean
  ) => {
    setEditingUser(userId);
    setSelectedRole(role);
    setSelectedBranch(branchId || '');
    setSelectedActive(isActive);
  };

  const handleSaveEdit = async (userId: string) => {
    try {
      await updateProfile.mutateAsync({
        userId,
        role: selectedRole,
        branchId: selectedBranch || null,
        is_active: selectedActive,
      });
      setEditingUser(null);
      await queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      await queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      refetch();
    } catch {
      // Hook shows error toast
    }
  };

  const handleSetActive = async (userId: string, is_active: boolean) => {
    if (userId === currentUser?.id) return;
    if (!is_active) {
      const ok = window.confirm(
        'Deactivate this user? They will not be able to sign in until an admin reactivates them.'
      );
      if (!ok) return;
    }
    try {
      await updateProfile.mutateAsync({ userId, is_active });
      await queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      await queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      refetch();
    } catch {
      // Hook shows error toast
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
      await queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const resetAddUserForm = () => {
    setNewUserForm({
      email: '',
      password: '',
      fullName: '',
      phone: '',
      role: 'technician',
      branchId: '',
    });
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddModalStep('form');
    setCreatedProfile(null);
    resetAddUserForm();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserForm.email,
          password: newUserForm.password,
          fullName: newUserForm.fullName,
          phone: newUserForm.phone,
          role: newUserForm.role,
          branchId: newUserForm.branchId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      const profile = data.profile as Profile | undefined;
      if (profile) {
        queryClient.setQueriesData<Profile[]>({ queryKey: ['teamMembers'] }, (old) =>
          mergeTeamList(old, profile)
        );
      }

      await queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      await queryClient.invalidateQueries({ queryKey: ['technicians'] });
      await queryClient.invalidateQueries({ queryKey: ['serviceIncharges'] });
      await queryClient.invalidateQueries({ queryKey: ['teamMembers'] });

      if (profile) {
        setCreatedProfile(profile);
        setAddModalStep('success');
        resetAddUserForm();
        toast.success('Team member added');
      } else {
        toast.success('User created successfully');
        closeAddModal();
        await refetch();
      }
    } catch (err) {
      console.error('Create user error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddAnotherUser = () => {
    setAddModalStep('form');
    setCreatedProfile(null);
    resetAddUserForm();
  };

  const branchName = (branchId: string | null) =>
    branchId ? branches?.find((b) => b.id === branchId)?.name || '—' : '—';

  // ─── Non–super-admin: read-only team list (emails from /api/team) ───
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <Header title="Team" />

        <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Users2 className="h-5 w-5" />
                Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingBlock />
              ) : error ? (
                <ErrorBlock onRetry={() => refetch()} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMembers.length > 0 ? (
                      sortedMembers.map((m: Profile) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium text-gray-900">{m.full_name}</TableCell>
                          <TableCell className="text-gray-700 break-all max-w-[200px]">
                            {m.email?.trim() ? m.email : '—'}
                          </TableCell>
                          <TableCell className="text-gray-700 tabular-nums">
                            {m.phone?.trim() ? m.phone : '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="info">{USER_ROLE_LABELS[m.role]}</Badge>
                          </TableCell>
                          <TableCell className="text-gray-600">{branchName(m.branch_id)}</TableCell>
                          <TableCell>
                            <Badge variant={m.is_active ? 'success' : 'gray'}>
                              {m.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-600 whitespace-nowrap">
                            {formatDate(m.created_at)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableEmpty message="No team members found" colSpan={7} />
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Super admin: full user management (same as former Settings page) ───
  return (
    <div className="flex flex-col h-full bg-gray-50">
      <Header title="Team" />

      <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Shield className="h-5 w-5" />
                User Management
              </CardTitle>
              <Button
                onClick={() => {
                  setAddModalStep('form');
                  setCreatedProfile(null);
                  resetAddUserForm();
                  setShowAddModal(true);
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative">
            {isFetching && !isLoading && (
              <p className="text-xs text-blue-600 mb-2" role="status">
                Syncing team list…
              </p>
            )}
            {isLoading ? (
              <LoadingBlock />
            ) : error ? (
              <ErrorBlock onRetry={() => refetch()} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMembers.length > 0 ? (
                    sortedMembers.map((userRow) => (
                      <TableRow key={userRow.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-full shrink-0">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">{userRow.full_name}</p>
                              {userRow.email?.trim() && (
                                <p className="text-xs text-gray-500 break-all">{userRow.email}</p>
                              )}
                              {userRow.phone?.trim() && (
                                <p className="text-xs text-gray-500">{userRow.phone}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingUser === userRow.id ? (
                            <Select
                              options={roleOptions}
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                              className="w-40"
                            />
                          ) : (
                            <Badge variant="info">{USER_ROLE_LABELS[userRow.role]}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingUser === userRow.id ? (
                            <Select
                              options={branchOptions}
                              value={selectedBranch}
                              onChange={(e) => setSelectedBranch(e.target.value)}
                              className="w-40"
                            />
                          ) : (
                            <span className="text-sm text-gray-600">
                              {branches?.find((b) => b.id === userRow.branch_id)?.name || '—'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingUser === userRow.id ? (
                            <Select
                              options={statusEditOptions}
                              value={selectedActive ? 'true' : 'false'}
                              onChange={(e) => setSelectedActive(e.target.value === 'true')}
                              className="w-32"
                            />
                          ) : (
                            <Badge variant={userRow.is_active ? 'success' : 'gray'}>
                              {userRow.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600 whitespace-nowrap text-sm">
                          {formatDate(userRow.created_at)}
                        </TableCell>
                        <TableCell>
                          {userRow.id !== currentUser?.id &&
                            (editingUser === userRow.id ? (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveEdit(userRow.id)}
                                  isLoading={updateProfile.isPending}
                                >
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2 items-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleEditUser(
                                      userRow.id,
                                      userRow.role,
                                      userRow.branch_id,
                                      userRow.is_active
                                    )
                                  }
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleResetPassword(userRow.id)}
                                >
                                  Reset Password
                                </Button>
                                {userRow.is_active ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-amber-700 border-amber-200 hover:bg-amber-50"
                                    onClick={() => handleSetActive(userRow.id, false)}
                                    isLoading={updateProfile.isPending}
                                  >
                                    Deactivate
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-700 border-green-200 hover:bg-green-50"
                                    onClick={() => handleSetActive(userRow.id, true)}
                                    isLoading={updateProfile.isPending}
                                  >
                                    Activate
                                  </Button>
                                )}
                              </div>
                            ))}
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
                <p className="text-gray-600">
                  Full access to all features, can manage team members, branches, and jobs across the shop.
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">Service Manager</p>
                <p className="text-gray-600">
                  Can manage jobs, assign tasks to technicians, view reports, and manage customers.
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">Service Incharge</p>
                <p className="text-gray-600">
                  Can create and manage jobs, assign to technicians, and update job status.
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">Technician</p>
                <p className="text-gray-600">
                  Can view assigned jobs, update job status, and add technician notes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={closeAddModal}
        title={addModalStep === 'success' ? 'Team member added' : 'Add New User'}
        size="md"
      >
        {addModalStep === 'success' && createdProfile ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <CheckCircle2 className="h-8 w-8 shrink-0 text-green-600" aria-hidden />
              <div className="min-w-0 flex-1 space-y-3 text-sm">
                <p className="font-semibold text-green-900">
                  Account is ready. They can sign in with the email and password you entered.
                </p>
                <dl className="space-y-2 border-t border-green-200/80 pt-3">
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">Name</dt>
                    <dd className="font-medium text-gray-900 text-right">{createdProfile.full_name}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">Email</dt>
                    <dd className="break-all font-medium text-gray-900 text-right">
                      {createdProfile.email?.trim() || '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">Phone</dt>
                    <dd className="text-right text-gray-900">
                      {createdProfile.phone?.trim() || '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">Role</dt>
                    <dd>
                      <Badge variant="info">{USER_ROLE_LABELS[createdProfile.role]}</Badge>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">Branch</dt>
                    <dd className="text-right text-gray-900">{branchName(createdProfile.branch_id)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-gray-600">Status</dt>
                    <dd>
                      <Badge variant={createdProfile.is_active ? 'success' : 'gray'}>
                        {createdProfile.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </dd>
                  </div>
                </dl>
                <p className="text-xs text-green-800/90">
                  The table below updates automatically; you can verify the new row there.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={handleAddAnotherUser}>
                Add another user
              </Button>
              <Button type="button" onClick={closeAddModal}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateUser} className="space-y-4">
            <Input
              label="Full Name"
              value={newUserForm.fullName}
              onChange={(e) => setNewUserForm((f) => ({ ...f, fullName: e.target.value }))}
              required
              placeholder="Enter full name"
            />
            <Input
              label="Email"
              type="email"
              value={newUserForm.email}
              onChange={(e) => setNewUserForm((f) => ({ ...f, email: e.target.value }))}
              required
              placeholder="Enter email address"
            />
            <Input
              label="Password"
              type="password"
              value={newUserForm.password}
              onChange={(e) => setNewUserForm((f) => ({ ...f, password: e.target.value }))}
              required
              placeholder="Enter password (min 6 characters)"
              minLength={6}
            />
            <Input
              label="Phone (Optional)"
              value={newUserForm.phone}
              onChange={(e) => setNewUserForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Enter phone number"
            />
            <Select
              label="Role"
              options={roleOptions}
              value={newUserForm.role}
              onChange={(e) => setNewUserForm((f) => ({ ...f, role: e.target.value as UserRole }))}
            />
            <Select
              label="Branch (Optional)"
              options={branchOptions}
              value={newUserForm.branchId}
              onChange={(e) => setNewUserForm((f) => ({ ...f, branchId: e.target.value }))}
            />
            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={closeAddModal}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isCreating}>
                Create User
              </Button>
            </div>
          </form>
        )}
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

function LoadingBlock() {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      <p className="text-gray-500">Loading users...</p>
    </div>
  );
}

function ErrorBlock({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <p className="text-red-600">Failed to load users</p>
      <Button onClick={onRetry} variant="outline">
        Try Again
      </Button>
    </div>
  );
}

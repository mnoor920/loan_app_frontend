'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/ui/dashboardlayout';
import { Users, Search, Filter, MoreVertical, Eye, ShieldCheck, ShieldX, Key, X, Wallet } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import GenerateCodeModal from '@/components/admin/GenerateCodeModal';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [passwordModal, setPasswordModal] = useState<{ isOpen: boolean; userId: string; userName: string }>({
    isOpen: false,
    userId: '',
    userName: ''
  });
  const [walletCodeModal, setWalletCodeModal] = useState<{ isOpen: boolean; userId: string; userName: string }>({
    isOpen: false,
    userId: '',
    userName: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  // Check authentication and admin role
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'admin' && user.role !== 'superadmin') {
      router.push('/userdashboard');
      return;
    }
  }, [user, authLoading, router]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/users/activated', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          // Transform the data to match the expected interface
          const transformedUsers = (data.users || []).map((user: any) => ({
            id: user.id,
            firstName: user.firstName || user.first_name || 'Unknown',
            lastName: user.lastName || user.last_name || 'User',
            email: user.email || 'No email',
            phone: user.phone || user.phone_number,
            role: user.role || 'user',
            status: user.isActive === false ? 'suspended' : (user.activationStatus === 'completed' ? 'active' : 'inactive'),
            isActive: user.isActive !== false,
            createdAt: user.createdAt || user.created_at,
            lastLogin: user.lastLogin || user.last_login
          }));
          setUsers(transformedUsers);
        } else {
          console.error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-950 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated or not admin
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return null;
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        showToast('success', `User account ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
        setUsers(users.map(u => u.id === userId ? {
          ...u,
          isActive: !currentStatus,
          status: !currentStatus ? (u.status === 'suspended' ? 'active' : u.status) : 'suspended'
        } : u));
      } else {
        showToast('error', 'Failed to update user status');
      }
    } catch (error) {
      showToast('error', 'An error occurred while updating user status');
    } finally {
      setUpdating(false);
      setOpenDropdown(null);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showToast('error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/users/${passwordModal.userId}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      if (response.ok) {
        showToast('success', 'Password changed successfully');
        setPasswordModal({ isOpen: false, userId: '', userName: '' });
        setNewPassword('');
      } else {
        showToast('error', 'Failed to change password');
      }
    } catch (error) {
      showToast('error', 'An error occurred while changing password');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-900';
      case 'inactive':
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-900';
      case 'suspended':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-900';
    }
  };

  return (
    <DashboardLayout userName={user?.firstName || 'Admin'}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Users Management</h1>
            <p className="text-slate-600">Manage all registered users</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="capitalize text-sm text-gray-900 dark:text-gray-100">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>

                        {openDropdown === user.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenDropdown(null)}
                            ></div>
                            <div className="absolute right-6 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    router.push(`/adminusers/${user.id}`);
                                    setOpenDropdown(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Profile
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(user.id, user.isActive)}
                                  disabled={updating}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                                >
                                  {user.isActive ? (
                                    <>
                                      <ShieldX className="w-4 h-4 mr-2 text-red-500" />
                                      Deactivate Account
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheck className="w-4 h-4 mr-2 text-green-500" />
                                      Activate Account
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setPasswordModal({ isOpen: true, userId: user.id, userName: `${user.firstName} ${user.lastName}` });
                                    setOpenDropdown(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Key className="w-4 h-4 mr-2" />
                                  Change Password
                                </button>
                                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                <button
                                  onClick={() => {
                                    setWalletCodeModal({ isOpen: true, userId: user.id, userName: `${user.firstName} ${user.lastName}` });
                                    setOpenDropdown(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <div className="">
                                    <Wallet className="w-4 h-4 mr-2 text-blue-500" />
                                  </div>
                                  Generate Wallet Code
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Change Password
              </h3>
              <button
                onClick={() => setPasswordModal({ ...passwordModal, isOpen: false })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enter a new password for <span className="font-bold text-gray-900 dark:text-gray-100">{passwordModal.userName}</span>.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setPasswordModal({ ...passwordModal, isOpen: false })}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
                >
                  {updating ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Wallet Code Modal */}
      {walletCodeModal.isOpen && (
        <GenerateCodeModal
          isOpen={walletCodeModal.isOpen}
          onClose={() => setWalletCodeModal({ isOpen: false, userId: '', userName: '' })}
          userId={walletCodeModal.userId}
          applicantName={walletCodeModal.userName}
          codeType="wallet"
        />
      )}
    </DashboardLayout>
  );
}
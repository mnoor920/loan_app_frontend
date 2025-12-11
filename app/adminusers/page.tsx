'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/ui/dashboardlayout';
import { Users, Search, Filter } from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
}

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

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
            role: 'user', // Default role since activation users are regular users
            status: user.activationStatus === 'completed' ? 'active' : 'inactive',
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
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => router.push(`/adminusers/${user.id}`)}
                          className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
                        >
                          View Profile
                        </button>
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
    </DashboardLayout>
  );
}
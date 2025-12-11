'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/ui/dashboardlayout';
import UserProfileEditor from '@/components/admin/UserProfileEditor';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();

  const userId = params.userId as string;

  // Check authentication and admin role
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && user && user.role !== 'admin' && user.role !== 'superadmin') {
      router.push('/userdashboard');
      return;
    }
  }, [user, authLoading, router]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-950 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated or not admin (will redirect)
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return null;
  }

  return (
    <DashboardLayout userName={user?.firstName || 'Admin'}>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <button 
            onClick={() => router.push('/admin/dashboard')}
            className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
          >
            Admin
          </button>
          <span className="mx-2">/</span>
          <button 
            onClick={() => router.push('/admin/dashboard')}
            className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
          >
            Users
          </button>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-gray-100">User Profile</span>
        </div>

        {/* Back Button */}
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </button>
        </div>

        {/* User Profile Editor Component */}
        <UserProfileEditor userId={userId} />
      </div>
    </DashboardLayout>
  );
}
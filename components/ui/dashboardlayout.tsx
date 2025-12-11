'use client'
import { useState } from 'react';
import Sidebar from './sidebar';
import AdminSidebar from './adminsidebar';
import TopBar from './topbar';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string;
}

const DashboardLayout = ({ children, userName }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen relative">
      
      {/* Switch sidebars based on role */}
      {user?.role === 'admin' || user?.role === 'superadmin' ? (
        <AdminSidebar
          userName={userName || user?.firstName || 'User'}
          userAvatar={undefined}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      ) : (
        <Sidebar
          userName={userName || user?.firstName || 'User'}
          userAvatar={undefined}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      )}

      <TopBar 
        userName={userName || user?.firstName || 'User'}
        userAvatar={undefined}
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      <main className="pt-16 lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;

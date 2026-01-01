'use client'
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  PlusCircle,
  CreditCard,
  FileText,
  User,
  Settings,
  HelpCircle,
  LogOut,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  userName?: string;
  userAvatar?: string;
  isOpen?: boolean;
  onClose?: () => void;
  isAccountActivated?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  userName = 'John',
  userAvatar,
  isOpen = false,
  onClose,
  isAccountActivated = true
}) => {
  const pathname = usePathname();
  const { logout } = useAuth();

  const mainNavItems = [
    { href: '/userdashboard', label: 'Dashboard', icon: LayoutDashboard, requiresActivation: false },
    // { href: '/myloans', label: 'My Loans', icon: Wallet, requiresActivation: true },
    // { href: '/loan', label: 'Apply for a Loan', icon: PlusCircle, requiresActivation: true },
    // { href: '/wallet', label: 'Wallet', icon: Wallet, requiresActivation: true },
    { href: '/profile', label: 'Profile', icon: User, requiresActivation: false },
  ];

  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        flex flex-col h-screen w-64 bg-white border-r border-slate-200 shadow-xl lg:shadow-none
        fixed left-0 top-0 z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
              <span className="font-bold text-lg">B</span>
            </div>
            <span className="text-lg font-bold tracking-tight">BrightLend</span>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-white/10 rounded-lg transition-colors text-white/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4">
          <div className="mb-2 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Menu
          </div>
          <ul className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const isDisabled = item.requiresActivation && !isAccountActivated;

              return (
                <li key={item.href}>
                  {isDisabled ? (
                    <div
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed opacity-50 relative group"
                      title="Complete account activation to access this feature"
                    >
                      <Icon className="w-5 h-5 text-slate-300" />
                      <span>{item.label}</span>
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${active
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span>{item.label}</span>
                      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Bottom Actions */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="mb-2 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Settings
            </div>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors group"
                >
                  <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
                  <span>Sign Out</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* User Profile Snippet Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold border border-emerald-200">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800 truncate max-w-[120px]">{userName}</span>
              <span className="text-xs text-slate-500">Member</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
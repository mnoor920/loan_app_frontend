'use client'
import { Search, Bell, Menu, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBadge from '../notifications/NotificationBadge';

interface TopBarProps {
  userName?: string;
  userAvatar?: string;
  onSearchChange?: (value: string) => void;
  onMenuClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ 
  userName = 'John',
  userAvatar,
  onSearchChange,
  onMenuClick 
}) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  // Generate user initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-20 bg-white/80 backdrop-blur-md z-40 border-b border-slate-200">
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        {/* Left Side - Menu Button + Search */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          {/* Mobile Menu Button */}
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>

          {/* Search Bar */}
          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search loans, transactions..."
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-900 placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Notification Badge */}
          <NotificationBadge />

          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

          {/* User Avatar with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 hover:bg-slate-50 rounded-xl p-1.5 pr-3 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                {userAvatar ? (
                  <Image 
                    src={userAvatar} 
                    alt={userName}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <span className="text-sm font-bold text-white">
                    {getInitials(userName)}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-bold text-slate-700 leading-none mb-0.5">
                  {userName}
                </span>
                <span className="text-xs text-slate-500">
                  User
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900">{userName}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                
                <div className="p-1">
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-700 rounded-lg transition-colors">
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-700 rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </div>
                
                <div className="border-t border-slate-100 p-1 mt-1">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;

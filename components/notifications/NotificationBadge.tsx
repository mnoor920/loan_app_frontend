'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

interface NotificationBadgeProps {
  className?: string;
  onClick?: () => void;
}

export default function NotificationBadge({ className = '', onClick }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/user/notifications', {
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
          const unread = (data.notifications || []).filter((n: any) => !n.read).length;
          setUnreadCount(unread);
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={onClick}
      className={`relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${className}`}
    >
      <Bell className="w-5 h-5" />
      
      {!loading && unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      
      {loading && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></span>
      )}
    </button>
  );
}
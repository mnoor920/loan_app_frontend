'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info,
  CreditCard,
  User
} from 'lucide-react';

interface UserNotification {
  id: string;
  type: 'loan_status_changed' | 'loan_details_modified' | 'profile_updated';
  title: string;
  message: string;
  data: {
    targetId?: string;
    targetType?: string;
    adminName?: string;
    reason?: string;
    oldValue?: any;
    newValue?: any;
  };
  read: boolean;
  createdAt: string;
}

interface NotificationBannerProps {
  className?: string;
}

export default function NotificationBanner({ className = '' }: NotificationBannerProps) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user/notifications?limit=10', {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        setError(data.message || 'Failed to load notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/user/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Helper functions
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'loan_status_changed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'loan_details_modified':
        return <CreditCard className="w-5 h-5 text-blue-500" />;
      case 'profile_updated':
        return <User className="w-5 h-5 text-purple-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Don't render if no notifications and no error
  if (!loading && notifications.length === 0 && !error) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 z-20">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Notifications
                </h3>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                      <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-600 dark:text-red-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">{error}</p>
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex-shrink-0"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    // Navigate to full notifications page if it exists
                  }}
                  className="w-full text-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
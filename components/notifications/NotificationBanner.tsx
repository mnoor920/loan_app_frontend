'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';

interface UserNotification {
  id: string;
  type: 'loan_status_changed' | 'loan_details_modified' | 'profile_updated';
  title: string;
  message: string;
  data: {
    loanId?: string;
    oldStatus?: string;
    newStatus?: string;
    modifiedFields?: string[];
    adminName?: string;
  };
  read: boolean;
  createdAt: string;
}

interface NotificationBannerProps {
  className?: string;
}

export default function NotificationBanner({ className = '' }: NotificationBannerProps) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/user/notifications', {
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
          setNotifications(data.notifications || []);
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

    fetchNotifications();
  }, []);

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
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    
    try {
      await Promise.all(
        unreadNotifications.map(notification => 
          fetch(`/api/user/notifications/${notification.id}/read`, {
            method: 'PUT',
            credentials: 'include'
          })
        )
      );
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Helper functions
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'loan_status_changed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'loan_details_modified':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'profile_updated':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'loan_status_changed':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'loan_details_modified':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'profile_updated':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayNotifications = showAll ? notifications : notifications.slice(0, 3);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Error Loading Notifications</p>
            <p className="text-xs text-red-700 dark:text-red-400 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 text-center ${className}`}>
        <Bell className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">No notifications yet</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          You'll see updates about your loans and profile here
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
            {notifications.length > 3 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                {showAll ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showAll ? 'Show less' : `Show all (${notifications.length})`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {displayNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 transition-colors ${
              !notification.read 
                ? getNotificationColor(notification.type)
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium ${
                      !notification.read 
                        ? 'text-gray-900 dark:text-gray-100' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {notification.title}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      !notification.read 
                        ? 'text-gray-700 dark:text-gray-300' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {notification.message}
                    </p>
                    
                    {/* Additional context based on notification type */}
                    {notification.type === 'loan_status_changed' && notification.data.oldStatus && notification.data.newStatus && (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        Status changed from <span className="font-medium">{notification.data.oldStatus}</span> to{' '}
                        <span className="font-medium">{notification.data.newStatus}</span>
                      </div>
                    )}
                    
                    {notification.type === 'loan_details_modified' && notification.data.modifiedFields && (
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        Modified: {notification.data.modifiedFields.join(', ')}
                      </div>
                    )}
                    
                    {notification.data.adminName && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                        Updated by {notification.data.adminName}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {formatDate(notification.createdAt)}
                    </span>
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
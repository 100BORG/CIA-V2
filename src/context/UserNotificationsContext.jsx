import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

// Create context
const UserNotificationsContext = createContext();

// Custom hook for using the context
export const useUserNotifications = () => {
  const context = useContext(UserNotificationsContext);
  if (!context) {
    throw new Error('useUserNotifications must be used within a UserNotificationsProvider');
  }
  return context;
};

// Provider component
export const UserNotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Load notifications on component mount and when user changes
  useEffect(() => {
    loadUserNotifications();
    
    // Add event listeners for real-time updates
    window.addEventListener('userUpdated', loadUserNotifications);
    window.addEventListener('login', loadUserNotifications);
    window.addEventListener('invoicesUpdated', loadUserNotifications);
    
    return () => {
      window.removeEventListener('userUpdated', loadUserNotifications);
      window.removeEventListener('login', loadUserNotifications);
      window.removeEventListener('invoicesUpdated', loadUserNotifications);
    };
  }, []);
  
  // Load notifications for current user
  const loadUserNotifications = async () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      // Load notifications from Supabase
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });
      const userNotifications = !error && data ? data : [];
      setNotifications(userNotifications);
      // Count unread notifications
      const unread = userNotifications.filter(notification => !notification.read).length;
      setUnreadCount(unread);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  };
  
  // Add a new notification
  const addNotification = (message, type = 'info', data = {}) => {
    const userId = localStorage.getItem('userId');
    
    if (!userId) return false;
    
    const newNotification = {
      id: `notification_${Date.now()}`,
      timestamp: new Date().toISOString(),
      message,
      type, // 'info', 'success', 'warning', 'error'
      read: false,
      data
    };
    
    // Add to state
    setNotifications(prevNotifications => [newNotification, ...prevNotifications]);
    setUnreadCount(prevCount => prevCount + 1);
    
    // Store in localStorage
    const userNotifications = JSON.parse(localStorage.getItem(`notifications_${userId}`)) || [];
    localStorage.setItem(`notifications_${userId}`, JSON.stringify([
      newNotification,
      ...userNotifications
    ]));
    
    return true;
  };
  
  // Mark a notification as read
  const markAsRead = (notificationId) => {
    const userId = localStorage.getItem('userId');
    
    if (!userId) return false;
    
    // Update state
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true } 
        : notification
    );
    
    setNotifications(updatedNotifications);
    
    // Count remaining unread notifications
    const unread = updatedNotifications.filter(notification => !notification.read).length;
    setUnreadCount(unread);
    
    // Update localStorage
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updatedNotifications));
    
    return true;
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    const userId = localStorage.getItem('userId');
    
    if (!userId) return false;
    
    // Update state
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true
    }));
    
    setNotifications(updatedNotifications);
    setUnreadCount(0);
    
    // Update localStorage
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updatedNotifications));
    
    return true;
  };
  
  // Clear all notifications
  const clearAllNotifications = () => {
    const userId = localStorage.getItem('userId');
    
    if (!userId) return false;
    
    // Update state
    setNotifications([]);
    setUnreadCount(0);
    
    // Update localStorage
    localStorage.setItem(`notifications_${userId}`, JSON.stringify([]));
    
    return true;
  };

  // Remove a notification by id
  const removeNotification = async (notificationId) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return false;
    // Remove from Supabase
    await supabase.from('notifications').delete().eq('id', notificationId);
    // Remove from local state
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    setNotifications(updatedNotifications);
    // Update unread count
    const unread = updatedNotifications.filter(n => !n.read).length;
    setUnreadCount(unread);
    // Update localStorage (optional, for offline support)
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updatedNotifications));
    return true;
  };

  const contextValue = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    removeNotification, // <-- add to context
  };

  return (
    <UserNotificationsContext.Provider value={contextValue}>
      {children}
    </UserNotificationsContext.Provider>
  );
};
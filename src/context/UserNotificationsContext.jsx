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
    // Get current user from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
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
  const addNotification = async (message, type = 'info', data = {}) => {
    // Get current user from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    if (!userId) return false;
    
    const newNotification = {
      id: `notification_${Date.now()}`,
      user_id: userId,
      timestamp: new Date().toISOString(),
      message,
      type, // 'info', 'success', 'warning', 'error'
      read: false,
      data
    };
    
    // Add to state
    setNotifications(prevNotifications => [newNotification, ...prevNotifications]);
    setUnreadCount(prevCount => prevCount + 1);
    
    // Store in Supabase
    const { error } = await supabase
      .from('notifications')
      .insert([newNotification]);
        if (error) {
      console.error('Error storing notification in Supabase:', error);
      return false;
    }
    
    return true;
  };
    // Mark a notification as read
  const markAsRead = async (notificationId) => {
    // Get current user from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
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
    
    // Update in Supabase
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error updating notification in Supabase:', error);
      return false;
    }
    
    return true;
  };
    // Mark all notifications as read
  const markAllAsRead = async () => {
    // Get current user from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    if (!userId) return false;
    
    // Update state
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true
    }));
    
    setNotifications(updatedNotifications);
    setUnreadCount(0);
    
    // Update in Supabase
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error updating notifications in Supabase:', error);
      return false;
    }
    
    return true;
  };
    // Clear all notifications
  const clearAllNotifications = async () => {
    // Get current user from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    if (!userId) return false;
    
    // Update state
    setNotifications([]);
    setUnreadCount(0);
    
    // Delete from Supabase
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting notifications from Supabase:', error);
      return false;
    }
    
    return true;
  };
  // Remove a notification by id
  const removeNotification = async (notificationId) => {
    // Get current user from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    if (!userId) return false;
    
    // Remove from Supabase
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting notification from Supabase:', error);
      return false;
    }
    
    // Remove from local state
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    setNotifications(updatedNotifications);
    
    // Update unread count
    const unread = updatedNotifications.filter(n => !n.read).length;
    setUnreadCount(unread);
    
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
import React, { useState, useRef, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { useUserNotifications } from '../context/UserNotificationsContext';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useUserNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format timestamp to relative time (e.g., "5 minutes ago")
  const getRelativeTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    markAsRead(notification.id);

    // Navigate if relevant
    if (notification.data && notification.data.invoiceId) {
      navigate(`/invoice/${notification.data.invoiceId}`);
    }
    
    // Close dropdown
    setShowDropdown(false);
  };

  return (
    <div className="notification-bell-container" style={{ position: 'relative' }}>
      <button
        className="notification-bell-button"
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          padding: '5px',
          fontSize: '20px',
          color: 'var(--text-color)'
        }}
      >
        <FiBell />
        {unreadCount > 0 && (
          <span
            className="notification-badge"
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="notifications-dropdown"
          style={{
            position: 'absolute',
            top: '40px',
            right: '0',
            width: '350px',
            maxHeight: '400px',
            backgroundColor: 'var(--card-bg)',
            borderRadius: '8px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            className="notifications-header"
            style={{
              padding: '15px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-color)',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div
            className="notifications-list"
            style={{
              overflowY: 'auto',
              maxHeight: '350px'
            }}
          >
            {notifications.length === 0 ? (
              <div
                className="empty-notifications"
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: 'var(--light-text)'
                }}
              >
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    backgroundColor: notification.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    position: 'relative'
                  }}
                >
                  {/* Delete (X) button */}
                  <button
                    onClick={e => { e.stopPropagation(); removeNotification(notification.id); }}
                    title="Delete notification"
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--light-text)',
                      fontSize: '16px',
                      cursor: 'pointer',
                      zIndex: 2
                    }}
                  >
                    ×
                  </button>
                  {/* Unread indicator */}
                  {!notification.read && (
                    <span
                      className="unread-indicator"
                      style={{
                        display: 'block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-color)',
                        position: 'absolute',
                        top: '18px',
                        left: '5px'
                      }}
                    />
                  )}
                  <div style={{ marginLeft: '12px' }} onClick={() => handleNotificationClick(notification)}>
                    <div
                      className="notification-message"
                      style={{
                        fontSize: '14px',
                        fontWeight: notification.read ? 'normal' : 'bold',
                        marginBottom: '5px'
                      }}
                    >
                      {notification.message}
                    </div>
                    <div
                      className="notification-time"
                      style={{
                        fontSize: '12px',
                        color: 'var(--light-text)'
                      }}
                    >
                      {getRelativeTime(notification.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
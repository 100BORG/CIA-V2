import React, { useState, useEffect } from 'react';

// Renamed to NotificationDisplay to match the updated context
const NotificationDisplay = ({ notification, onClose, duration = 5000 }) => {
  const [visible, setVisible] = useState(true);
  
  // Auto-hide the notification after duration
  useEffect(() => {
    if (!notification) return;
    
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [notification, onClose, duration]);
  
  // Handle manual close
  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };
  
  if (!notification || !visible) return null;
  
  // Support for backward compatibility when notification is just a string
  const message = typeof notification === 'string' ? notification : notification.message;
  const type = typeof notification === 'string' ? 'error' : (notification.type || 'error');
  
  return (
    <div className="notification-display">
      <div className={`notification-content ${type}`}>
        <span className="notification-message">{message}</span>
        <button className="notification-close" onClick={handleClose}>×</button>
      </div>
    </div>
  );
};

export default NotificationDisplay;
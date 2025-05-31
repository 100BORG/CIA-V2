// filepath: c:\Users\manth\Documents\GitHub\CIA\src\context\NotificationContext.jsx
import React, { createContext, useState, useContext } from 'react';

// Renamed to NotificationContext to better reflect its purpose
const NotificationContext = createContext({
  notification: null,
  setNotification: () => {},
  clearNotification: () => {}
});

export const NotificationProvider = ({ children }) => {
  // Changed structure to include type and message
  const [notification, setNotificationState] = useState(null);
  
  const setNotification = (message, type = 'error') => {
    setNotificationState({ message, type });
  };
  
  const clearNotification = () => setNotificationState(null);
  
  return (
    <NotificationContext.Provider value={{ 
      notification, 
      setNotification, 
      clearNotification,
      // For backward compatibility
      error: notification?.message,
      setError: (message) => setNotification(message, 'error'),
      clearError: clearNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Primary hook for notifications
export const useNotification = () => useContext(NotificationContext);

// For backward compatibility
export const useError = useNotification;

export default NotificationProvider;
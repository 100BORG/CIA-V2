import React, { createContext, useState, useContext } from 'react';

// Renamed to NotificationContext to better reflect its purpose
const NotificationContext = createContext({
  notification: null,
  setNotification: () => {},
  clearNotification: () => {}
});

export const ErrorProvider = ({ children }) => {
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

// Renamed to useNotification for clarity, but kept useError for backward compatibility
export const useNotification = () => useContext(NotificationContext);
export const useError = useNotification;

export default NotificationContext;
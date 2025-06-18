import React, { createContext, useContext, useState, useEffect } from 'react';

// Example: You can replace this with real user fetching logic
const defaultUser = {
  id: 'anonymous',
  name: 'Anonymous User',
  role: 'user',
  position: '',
};

const UserRoleContext = createContext({
  currentUser: defaultUser,
  isAdmin: false,
  setCurrentUser: () => {},
});

export const UserRoleProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(defaultUser);
  const isAdmin = currentUser.role === 'admin';

  // Example: Replace with real user loading logic
  useEffect(() => {
    // Fetch user data here if needed
  }, []);

  return (
    <UserRoleContext.Provider value={{ currentUser, isAdmin, setCurrentUser }}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => useContext(UserRoleContext);

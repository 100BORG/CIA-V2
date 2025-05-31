import React, { createContext, useContext, useState, useEffect } from 'react';

// Create context
const UserRoleContext = createContext();

// Custom hook for using the context
export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};

// Provider component
export const UserRoleProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState('client');
  
  useEffect(() => {
    // First run a cleanup to remove the demo user if it exists
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const filteredUsers = users.filter(user => user.email !== 'user@example.com' && user.id !== 'demo_user');
    
    // If any users were removed, update localStorage
    if (users.length !== filteredUsers.length) {
      localStorage.setItem('users', JSON.stringify(filteredUsers));
      console.log('Demo user removed from the system');
    }
    
    // Update all user roles and positions to ensure defaults are correct
    const updatedUsers = filteredUsers.map(user => {
      // Only admin@example.com should have admin role and position, others get client
      if (user.email === 'admin@example.com') {
        return { 
          ...user, 
          role: 'admin',
          position: 'admin' 
        };
      } else {
        return { 
          ...user, 
          role: 'client',
          position: 'client'
        };
      }
    });
    
    // Save the updated users back to localStorage
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    // Check for existing admin user
    const adminUser = updatedUsers.find(user => user.email === 'admin@example.com');
    
    // Create admin user if it doesn't exist
    if (!adminUser) {
      const newAdminUser = {
        id: 'admin_user',
        name: 'Administrator',
        email: 'admin@example.com',
        password: 'admin123', // In a real app, this would be hashed
        role: 'admin',
        position: 'admin',
        createdAt: new Date().toISOString()
      };
      
      updatedUsers.push(newAdminUser);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      console.log('Admin user created with credentials: admin@example.com / admin123');
    }
    
    // Get current user
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');
    
    if (userId || userEmail) {
      // If current user is the demo user, log them out
      if (userId === 'demo_user' || userEmail === 'user@example.com') {
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('isLoggedIn');
        setCurrentUser(null);
        setUserRole('client');
        setIsAdmin(false);
        return;
      }
      
      const user = updatedUsers.find(u => u.id === userId || u.email === userEmail);
      
      if (user) {
        setCurrentUser(user);
        // Set role and update user position based on email
        const role = user.email === 'admin@example.com' ? 'admin' : 'client';
        setUserRole(role);
        setIsAdmin(user.email === 'admin@example.com');
        
        // Ensure the position is also updated in localStorage
        if (user.email === 'admin@example.com') {
          localStorage.setItem('userPosition', 'admin');
        } else {
          localStorage.setItem('userPosition', 'client');
        }
      }
    }
  }, []);
  
  // Update when user logs in or out
  useEffect(() => {
    const handleUserUpdate = () => {
      const users = JSON.parse(localStorage.getItem('users')) || [];
      const userId = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail');
      
      if (userId || userEmail) {
        const user = users.find(u => u.id === userId || u.email === userEmail);
        
        if (user) {
          // Ensure the user has the correct role and position based on email
          const updatedUser = {
            ...user,
            role: user.email === 'admin@example.com' ? 'admin' : 'client',
            position: user.email === 'admin@example.com' ? 'admin' : 'client'
          };
          
          // Update the user in storage if role or position changed
          if (updatedUser.role !== user.role || updatedUser.position !== user.position) {
            const updatedUsers = users.map(u => 
              u.id === updatedUser.id ? updatedUser : u
            );
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            
            // Also update userPosition in localStorage
            localStorage.setItem('userPosition', updatedUser.position);
          }
          
          setCurrentUser(updatedUser);
          setUserRole(updatedUser.role);
          setIsAdmin(updatedUser.email === 'admin@example.com');
        } else {
          setCurrentUser(null);
          setUserRole('client');
          setIsAdmin(false);
        }
      } else {
        setCurrentUser(null);
        setUserRole('client');
        setIsAdmin(false);
      }
    };
    
    window.addEventListener('userUpdated', handleUserUpdate);
    window.addEventListener('login', handleUserUpdate);
    window.addEventListener('logout', handleUserUpdate);
    
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
      window.removeEventListener('login', handleUserUpdate);
      window.removeEventListener('logout', handleUserUpdate);
    };
  }, []);

  /**
   * Check if the current user has a specific permission
   * @param {string} permission - The permission to check
   * @returns {boolean} - Whether the user has the permission
   */
  const hasPermission = (permission) => {
    // Admin has all permissions
    if (isAdmin) return true;
    
    // For specific permissions
    switch (permission) {
      case 'assign-invoice':
        return isAdmin; // Only admins can assign invoices
      case 'create-invoice':
        return true; // Everyone can create invoices
      case 'delete-invoice':
        return isAdmin; // Only admins can delete invoices
      default:
        return false;
    }
  };

  const contextValue = {
    currentUser,
    userRole,
    isAdmin,
    hasPermission
  };

  return (
    <UserRoleContext.Provider value={contextValue}>
      {children}
    </UserRoleContext.Provider>
  );
};
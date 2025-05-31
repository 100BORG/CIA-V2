import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';

/**
 * Custom hook for authentication management
 * @returns {Object} Authentication methods and state
 */
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const session = supabase.auth.session();
    setIsAuthenticated(!!session);
    if (session) {
      setUserEmail(session.user.email);
    }
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email || '');
    });
    return () => {
      listener?.unsubscribe();
    };
  }, []);

  // Login method
  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) setIsAuthenticated(true);
    return error;
  };

  // Logout method
  const logout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserEmail('');
  };

  // Return auth state and methods
  return {
    isAuthenticated,
    userEmail,
    login,
    logout,
    updateActivity: () => {}, // Not needed with Supabase session
  };
};

export default useAuth;
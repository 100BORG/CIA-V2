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


import { supabase } from '../config/supabaseClient';

export const UserRoleProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(defaultUser);
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('Supabase auth error:', userError);
        }
        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, role, position')
            .eq('id', user.id)
            .single();
          if (profileError) {
            console.error('Supabase profile fetch error:', profileError);
          }
          if (profile) {
            setCurrentUser({
              id: profile.id,
              name: profile.full_name || user.email,
              role: profile.role || 'user',
              position: profile.position || '',
            });
          } else {
            setCurrentUser({
              id: user.id,
              name: user.email,
              role: 'user',
              position: '',
            });
          }
        } else {
          setCurrentUser(defaultUser);
        }
      } catch (err) {
        console.error('Error in fetchUserProfile:', err);
        setCurrentUser(defaultUser);
      }
    };
    fetchUserProfile();
  }, []);

  return (
    <UserRoleContext.Provider value={{ currentUser, isAdmin, setCurrentUser }}>
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = () => useContext(UserRoleContext);

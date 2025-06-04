import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import LoginPage from './pages/LoginPage'
import InvoicePage from './pages/InvoicePage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'
import DiagnosticPage from './pages/DiagnosticPage'
import DebugPage from './pages/DebugPage'
import DemoPage from './pages/DemoPage'
import CompanyPage from './pages/CompanyPage'
import ClientPage from './pages/ClientPage'
import BinPage from './pages/BinPage'
import DescriptionPage from './pages/DescriptionPage'
import NotificationDisplay from './components/ErrorDisplay'
import Modal from './components/Modal'
import { useNotification } from './context/ErrorContext'
import { supabase } from './config/supabaseClient'
import { storage } from './utils/storage'
import { userStore } from './utils/userStore'

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [sessionTimer, setSessionTimer] = useState(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { notification, setNotification, clearNotification } = useNotification()
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(true)
  // Check authentication and dark mode on initial load
  useEffect(() => {
    async function initializeApp() {
      setIsLoading(true);
      
      // Check for active session
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      // Get dark mode preference from Supabase
      if (session) {
        const darkModePreference = await userStore.getDarkModePreference();
        setDarkMode(darkModePreference);
        if (darkModePreference) {
          document.body.classList.add('dark-mode');
        }
        
        // Update user positions in users table (one-time migration)
        await updateUserPositions();
      } else {
        // Default to dark mode for non-authenticated users
        setDarkMode(true);
        document.body.classList.add('dark-mode');
      }
      
      setIsLoading(false);
    }
    
    initializeApp();
    
    // Setup auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });
    
    // Setup global error handler
    window.addEventListener('error', handleGlobalError);
    
    return () => {
      subscription?.unsubscribe();
      window.removeEventListener('error', handleGlobalError);
    };
  }, []);

  // Function to update user positions from "client" to "Invoicing Associate"
  const updateUserPositions = async () => {
    try {
      // Get users with position "client" who aren't admins
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('position', 'client')
        .neq('role', 'admin');
      
      if (error) {
        console.error('Error fetching users:', error);
        return;
      }
      
      // Update positions to "Invoicing Associate"
      for (const user of users) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ position: 'Invoicing Associate' })
          .eq('id', user.id);
          
        if (updateError) {
          console.error(`Error updating user ${user.id}:`, updateError);
        }
      }
      
      console.log('Updated users with position "client" to "Invoicing Associate"');
    } catch (err) {
      console.error('Error in updateUserPositions:', err);
    }
  };

  // Handle global errors
  const handleGlobalError = (event) => {
    console.error('Global error:', event.error)
    const errorMessage = event.error ? event.error.message : 'Unknown error'
    setNotification(`Error: ${errorMessage}`, 'error')
  }
  // Update body class when dark mode changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
    storage.set('darkMode', darkMode)
  }, [darkMode])
  // Setup session timeout
  useEffect(() => {
    if (isAuthenticated) {
      // Clear any existing timer
      if (sessionTimer) clearTimeout(sessionTimer)
      
      // Start new timer
      const timer = setTimeout(async () => {
        // Get last active time from Supabase
        const lastActivity = await storage.get('lastActivity')
        const now = new Date().getTime()
        
        // If it's been too long since the last activity, log the user out
        if (lastActivity && now - parseInt(lastActivity) > SESSION_TIMEOUT) {
          handleLogout()
          setNotification('Your session has expired. Please log in again.', 'warning')
        }
      }, SESSION_TIMEOUT)
      
      setSessionTimer(timer)
      
      // Update last activity time
      storage.updateLastActivity()
    }
    
    return () => {
      if (sessionTimer) clearTimeout(sessionTimer)
    }
  }, [isAuthenticated, location])

  // Redirect based on authentication status
  useEffect(() => {
    // Only redirect for main app routes that require authentication
    if (isAuthenticated && location.pathname === '/login') {
      navigate('/dashboard')
    } else if (isAuthenticated && location.pathname === '/') {
      navigate('/dashboard')
    } else if (!isAuthenticated && 
              location.pathname !== '/login' && 
              location.pathname !== '/demo' && 
              location.pathname !== '/debug' && 
              location.pathname !== '/diagnostic') {
      navigate('/login')
    }
  }, [isAuthenticated, location.pathname, navigate])
  const handleLogin = async (email, userId, userName, phone, position, role) => {
    // Store user data in Supabase
    await storage.set('userRole', role || 'user');
    
    // Set default position based on role
    let finalPosition = position;
    
    // If position is not provided, set default based on role
    if (!finalPosition || finalPosition === '') {
      if (role === 'admin') {
        finalPosition = 'Admin';
      } else {
        finalPosition = 'Invoicing Associate';
      }
    }
    
    // Store user data in Supabase user_preferences
    await storage.set('isLoggedIn', true);
    await storage.set('userEmail', email);
    await storage.set('userId', userId || 'demo_user');
    await storage.set('userName', userName || email.split('@')[0]);
    await storage.set('userPhone', phone || '');
    await storage.set('userPosition', finalPosition);
    await storage.set('lastLogin', new Date().toString());
    await storage.updateLastActivity();

    // --- Ensure default descriptions are saved after login ---
    const existingDescriptions = await storage.get('serviceDescriptions');
    if (!existingDescriptions) {
      const defaultDescriptions = [
        { id: 1, text: 'US Federal Corporation Income Tax Return (Form 1120)' },
        { id: 2, text: 'Foreign related party disclosure form with respect to a foreign subsidiary (Form 5417)' },
        { id: 3, text: 'Foreign related party disclosure form with respect to a foreign shareholders (Form 5472)' },
        { id: 4, text: 'Application for Automatic Extension of Time To File Business Income Tax (Form 7004)' }
      ];
      await storage.set('serviceDescriptions', defaultDescriptions);
    }
    // --------------------------------------------------------

    setIsAuthenticated(true);
    window.dispatchEvent(new Event('login'));
    navigate('/');
  }

  const handleLogout = () => {
    setShowLogoutModal(true);
  };
  const confirmLogout = async () => {
    // Sign out with Supabase Auth
    await supabase.auth.signOut();
    
    // Remove user-specific data
    await storage.remove('isLoggedIn');
    await storage.remove('userEmail');
    await storage.remove('userRole');
    await storage.remove('userPosition');
    
    setIsAuthenticated(false);
    setShowLogoutModal(false);
    navigate('/login');
  };

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode)
  }

  return (
    <div className="App">
      {notification && (
        <NotificationDisplay 
          notification={notification} 
          onClose={() => clearNotification()} 
          duration={5000} 
        />
      )}
      
      <Modal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        title="Confirm Logout"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </button>
            <button className="btn" onClick={confirmLogout}>
              Logout
            </button>
          </>
        }
      >
        <p>Are you sure you want to sign out? Any unsaved changes will be lost.</p>
      </Modal>
      
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? 
            <Navigate to="/dashboard" replace /> : 
            <LoginPage onLogin={handleLogin} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        } />
        
        <Route path="/dashboard" element={
          isAuthenticated ? 
            <DashboardPage 
              onLogout={handleLogout} 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode}
            /> : 
            <Navigate to="/login" replace />
        } />
        
        <Route path="/invoice/:id" element={
          isAuthenticated ? 
            <InvoicePage 
              onLogout={handleLogout} 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode}
            /> : 
            <Navigate to="/login" replace />
        } />
        
        <Route path="/invoice/new" element={
          isAuthenticated ? 
            <InvoicePage 
              onLogout={handleLogout} 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode}
            /> : 
            <Navigate to="/login" replace />
        } />
        
        <Route path="/profile" element={
          isAuthenticated ? 
            <ProfilePage 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode}
            /> : 
            <Navigate to="/login" replace />
        } />
        
        <Route path="/company" element={
          isAuthenticated ? 
            <CompanyPage 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode}
            /> : 
            <Navigate to="/login" replace />
        } />
        
        <Route path="/bin" element={
          isAuthenticated ? 
            <BinPage 
              onLogout={handleLogout} 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode}
            /> : 
            <Navigate to="/login" replace />
        } />

        <Route path="/client" element={
          isAuthenticated ? 
            <ClientPage 
              onLogout={handleLogout} 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode}
            /> : 
            <Navigate to="/login" replace />
        } />

        <Route path="/description" element={
          isAuthenticated ? 
            <DescriptionPage 
              onLogout={handleLogout} 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode}
            /> : 
            <Navigate to="/login" replace />
        } />

        {/* Debug and diagnostic routes - no auth required */}
        <Route path="/debug" element={<DebugPage />} />
        <Route path="/diagnostic" element={<DiagnosticPage />} />
        <Route path="/demo" element={<DemoPage />} />
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

export default App

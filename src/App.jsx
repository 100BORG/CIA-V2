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

  // Check authentication and dark mode on initial load
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    setIsAuthenticated(isLoggedIn)
    
    // Check dark mode preference, default to true if not set
    const darkModeInStorage = localStorage.getItem('darkMode')
    const savedDarkMode = darkModeInStorage === null ? true : darkModeInStorage === 'true'
    setDarkMode(savedDarkMode)
    if (savedDarkMode) {
      document.body.classList.add('dark-mode')
    }

    // Update all users with position "client" to "Invoicing Associate"
    updateUserPositions();

    // Setup global error handler
    window.addEventListener('error', handleGlobalError)
    return () => {
      window.removeEventListener('error', handleGlobalError)
    }
  }, [])

  // Function to update user positions from "client" to "Invoicing Associate"
  const updateUserPositions = () => {
    // Get all users from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    let updated = false;

    // Update any user with position "client" to "Invoicing Associate" (if they're not admin)
    const updatedUsers = users.map(user => {
      if (user.position && user.position.toLowerCase() === 'client' && user.role !== 'admin') {
        updated = true;
        return {
          ...user,
          position: 'Invoicing Associate'
        };
      }
      return user;
    });

    // Save back to localStorage if any user was updated
    if (updated) {
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      console.log('Updated users with position "client" to "Invoicing Associate"');
    }

    // Also update current user if needed
    const currentUserId = localStorage.getItem('userId');
    const currentUserPosition = localStorage.getItem('userPosition');
    const currentUserRole = localStorage.getItem('userRole');
    
    if (currentUserId && 
        currentUserPosition && 
        currentUserPosition.toLowerCase() === 'client' &&
        currentUserRole !== 'admin') {
      localStorage.setItem('userPosition', 'Invoicing Associate');
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
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  // Setup session timeout
  useEffect(() => {
    if (isAuthenticated) {
      // Clear any existing timer
      if (sessionTimer) clearTimeout(sessionTimer)
      
      // Start new timer
      const timer = setTimeout(() => {
        // Get last active time from local storage
        const lastActivity = localStorage.getItem('lastActivity')
        const now = new Date().getTime()
        
        // If it's been too long since the last activity, log the user out
        if (lastActivity && now - parseInt(lastActivity) > SESSION_TIMEOUT) {
          handleLogout()
          setNotification('Your session has expired. Please log in again.', 'warning')
        }
      }, SESSION_TIMEOUT)
      
      setSessionTimer(timer)
      
      // Update last activity time
      localStorage.setItem('lastActivity', new Date().getTime().toString())
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

  const handleLogin = (email, userId, userName, phone, position, role) => {
    // Store role in localStorage
    localStorage.setItem('userRole', role || 'user');
    
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
    
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('userEmail', email)
    localStorage.setItem('userId', userId || 'demo_user')
    localStorage.setItem('userName', userName || email.split('@')[0])
    localStorage.setItem('userPhone', phone || '')
    localStorage.setItem('userPosition', finalPosition)
    localStorage.setItem('lastLogin', new Date().toString())
    localStorage.setItem('lastActivity', new Date().getTime().toString())

    // --- Ensure default descriptions are saved after login ---
    if (!localStorage.getItem('serviceDescriptions')) {
      const defaultDescriptions = [
        { id: 1, text: 'US Federal Corporation Income Tax Return (Form 1120)' },
        { id: 2, text: 'Foreign related party disclosure form with respect to a foreign subsidiary (Form 5417)' },
        { id: 3, text: 'Foreign related party disclosure form with respect to a foreign shareholders (Form 5472)' },
        { id: 4, text: 'Application for Automatic Extension of Time To File Business Income Tax (Form 7004)' }
      ];
      localStorage.setItem('serviceDescriptions', JSON.stringify(defaultDescriptions));
    }
    // --------------------------------------------------------

    setIsAuthenticated(true)
    window.dispatchEvent(new Event('login'));
    navigate('/')
  }

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userPosition');
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

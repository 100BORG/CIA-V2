// Redirect script to handle initial routing
// This script runs before React takes over routing

(function() {
  // Base path for GitHub Pages deployment
  const basePath = '/CIA';
  
  // Get current path
  const currentPath = window.location.pathname;
  
  // Convert absolute paths to include the base path for GitHub Pages
  const adjustPath = (path) => {
    if (path === '/') return basePath + '/';
    return basePath + path;
  };
  
  // Non-protected routes - with adjusted paths
  const publicRoutes = [
    basePath + '/login',
    basePath + '/debug',
    basePath + '/diagnostic',
    basePath + '/demo'
  ];
  
  // Check if user is logged in
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  // Redirect logic
  if (!isLoggedIn && !publicRoutes.includes(currentPath) && currentPath !== basePath + '/') {
    // Not logged in and trying to access protected route - redirect to login
    window.location.href = adjustPath('/login');
  } else if (isLoggedIn && currentPath === basePath + '/login') {
    // Already logged in and trying to access login page - redirect to app
    window.location.href = adjustPath('/');
  }
  
  // Check for session timeout
  const lastActivity = localStorage.getItem('lastActivity');
  if (isLoggedIn && lastActivity) {
    const now = new Date().getTime();
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    
    if (now - parseInt(lastActivity) > SESSION_TIMEOUT) {
      // Session timed out - log out and redirect
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userEmail');
      
      if (currentPath !== basePath + '/login') {
        window.location.href = adjustPath('/login?timeout=true');
      }
    } else {
      // Update activity timestamp
      localStorage.setItem('lastActivity', now.toString());
    }
  }
})();
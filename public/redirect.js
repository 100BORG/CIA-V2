// Redirect script to handle initial routing
// This script runs before React takes over routing

(async function() {
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
  
  // Import Supabase client from script tag
  // Note: Make sure supabase-js is loaded before this script
  const supabase = window.supabaseClient;

  // Check if user is logged in using Supabase Auth
  const { data: { session } } = await supabase.auth.getSession();
  const isLoggedIn = !!session;
  
  // Redirect logic
  if (!isLoggedIn && !publicRoutes.includes(currentPath) && currentPath !== basePath + '/') {
    // Not logged in and trying to access protected route - redirect to login
    window.location.href = adjustPath('/login');
  } else if (isLoggedIn && currentPath === basePath + '/login') {
    // Already logged in and trying to access login page - redirect to app
    window.location.href = adjustPath('/');
  }
  
  // Check for session timeout
  if (isLoggedIn) {
    // If logged in, check for session timeout in user_sessions table
    const { data: userSession } = await supabase
      .from('user_sessions')
      .select('last_activity')
      .eq('user_id', session.user.id)
      .single();
      
    if (userSession) {
      const now = new Date().getTime();
      const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
      const lastActivity = userSession.last_activity ? new Date(userSession.last_activity).getTime() : 0;
      
      if (now - lastActivity > SESSION_TIMEOUT) {
        // Session timed out - log out and redirect
        await supabase.auth.signOut();
        
        if (currentPath !== basePath + '/login') {
          window.location.href = adjustPath('/login?timeout=true');
        }
      } else {
        // Update activity timestamp
        await supabase
          .from('user_sessions')
          .upsert({
            user_id: session.user.id,
            last_activity: new Date().toISOString()
          });
      }
    }
  }
})();
import { useState, useEffect, useRef } from 'react';
import { FiArrowRight, FiUserPlus, FiUser, FiMail, FiPhone, FiBriefcase, FiLock, FiEye, FiEyeOff, FiSun, FiMoon, FiArrowLeft } from 'react-icons/fi';
import './LoginPage.css'; // Import the CSS file
import { supabase } from '../config/supabaseClient';

const LoginPage = ({ onLogin, darkMode, toggleDarkMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formAnimation, setFormAnimation] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  
  // Refs for form fields
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const nameRef = useRef(null);

  // Set up animations
  useEffect(() => {
    // Trigger animation after component mounts
    setTimeout(() => setFadeIn(true), 100);
  }, []);

  // Effect for managing browser history and popstate
  useEffect(() => {
    const handlePopState = (event) => {
      const newIsRegistering = event.state ? event.state.isRegistering : window.location.hash === '#register';
      if (isRegistering !== newIsRegistering) {
        setIsRegistering(newIsRegistering);
        setError('');
        setShowPassword(false);
        setShowConfirmPassword(false);
        // Trigger form change animation
        setFormAnimation(true);
        setTimeout(() => setFormAnimation(false), 500);
      }
    };

    // Initial setup based on URL hash
    const initialIsRegistering = window.location.hash === '#register';
    if (isRegistering !== initialIsRegistering) {
        setIsRegistering(initialIsRegistering);
    }
    // Ensure history state matches the component state
    window.history.replaceState({ isRegistering: initialIsRegistering }, '', window.location.href);

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []); // Run once on mount

  // Animation for form switch, now also handles focusing
  useEffect(() => {
    if (formAnimation) { // Only run focus logic if formAnimation was triggered
      setTimeout(() => {
        if (isRegistering && nameRef.current) {
          nameRef.current.focus();
        } else if (!isRegistering && emailRef.current) {
          emailRef.current.focus();
        }
      }, 100); // Delay focus slightly after animation starts
    }
  }, [formAnimation, isRegistering]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      if (!email || !password || !confirmPassword || !name) {
        setError('Please fill in all required fields');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      setIsLoading(true);
      // Supabase sign up
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone,
            position: position || 'Invoicing Associate',
            role: 'user',
          },
        },
      });
      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }
      // Insert user profile into users table
      await supabase.from('users').insert({
        id: data.user.id,
        email,
        name,
        phone,
        position: position || 'Invoicing Associate',
        role: 'user',
        created_at: new Date().toISOString(),
      });
      // Auto-login after registration
      onLogin(email, data.user.id, name, phone, position || 'Invoicing Associate', 'user');
      setIsLoading(false);
    } else {
      // Login
      if (!email || !password) {
        setError('Please enter both email and password');
        return;
      }
      setIsLoading(true);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }
      // Fetch user profile from users table
      const { data: userProfile } = await supabase.from('users').select('*').eq('id', data.user.id).single();
      onLogin(email, data.user.id, userProfile?.name || '', userProfile?.phone || '', userProfile?.position || '', userProfile?.role || 'user');
      setIsLoading(false);
    }
  };
  
  const toggleMode = (e) => {
    if (e) e.preventDefault(); // Prevent default if called from an event (e.g., <a> tag click)

    const newIsRegistering = !isRegistering;
    
    // Update component state first
    setIsRegistering(newIsRegistering);
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormAnimation(true); // Trigger animation
    setTimeout(() => setFormAnimation(false), 500);


    // Then update browser history
    if (newIsRegistering) {
      window.history.pushState({ isRegistering: true }, 'Create Account', '#register');
    } else {
      // Going back to login, remove #register from URL
      // Check current hash to avoid pushing same state if already on login page without hash
      if (window.location.hash === '#register') {
        window.history.pushState({ isRegistering: false }, 'Sign In', window.location.pathname);
      } else {
        // If already on login page (no hash), replace state to ensure it's correct
        window.history.replaceState({ isRegistering: false}, 'Sign In', window.location.pathname);
      }
    }
  };

  return (
    <div className={`login-page-light-mode ${fadeIn ? 'fade-in' : ''} ${darkMode ? 'dark-mode' : ''}`}>
      <div className="theme-switch-wrapper login-theme-switch">
        <label className="theme-switch">
          <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
          <span className="slider">
            <span className="sun-icon"><FiSun /></span>
            <span className="moon-icon"><FiMoon /></span>
          </span>
        </label>
      </div>
      <div className="login-container">
        <div className={`login-card ${formAnimation ? 'form-change' : ''}`}>
          {/* Left Content */}
          <div className="login-content">
            <div className="brand">
              <div className="brand-logo">
                <div className="brand-dots">
                  <div className="dot dot-black"></div>
                  <div className="dot dot-gray"></div>
                  <div className="dot dot-yellow"></div>
                </div>
              </div>
              <span className="brand-name">ML Finance Solutions</span>
            </div>
            
            <h1 className="login-title">{isRegistering ? 'Create Account' : 'Welcome Back'}</h1>
            <p className="login-subtitle">
              {isRegistering 
                ? 'Register to access our invoice generation system' 
                : 'Access the invoice generator with your account'}
            </p>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit} className="login-form">
              {isRegistering && (
                <div className="form-group">
                  <label className="form-label" htmlFor="name">
                    <FiUser className="input-icon" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    ref={nameRef}
                    placeholder="Enter your full name"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  <FiMail className="input-icon" />
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  ref={emailRef}
                  placeholder="Enter your email address"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              {isRegistering && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">
                      <FiPhone className="input-icon" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      placeholder="Enter your phone number"
                      className="form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="position">
                      <FiBriefcase className="input-icon" />
                      Position/Title
                    </label>
                    <input
                      type="text"
                      id="position"
                      placeholder="Enter your job title"
                      className="form-input"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                    />
                  </div>
                </>
              )}
              
              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  <FiLock className="input-icon" />
                  Password *
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    ref={passwordRef}
                    placeholder="Enter your password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              
              {isRegistering && (
                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPassword">
                    <FiLock className="input-icon" />
                    Confirm Password *
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      placeholder="Confirm your password"
                      className="form-input"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex="-1"
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>
              )}
              
              <div className="form-actions">
                {!isRegistering && (
                  <div className="remember-forgot">
                    <div className="remember-me">
                      <input type="checkbox" id="rememberMe" />
                      <label htmlFor="rememberMe">Remember me</label>
                    </div>
                    <a href="#" className="forgot-link">Forgot Password?</a>
                  </div>
                )}
                
                <button 
                  type="submit" 
                  className="login-button" 
                  disabled={isLoading}
                >
                  <span className="button-text">
                    {isLoading ? 'PROCESSING...' : (isRegistering ? 'CREATE ACCOUNT' : 'SIGN IN')}
                  </span>
                  {!isLoading && <FiArrowRight className="button-icon" />}
                  <div className={`spinner ${isLoading ? 'active' : ''}`}></div>
                </button>
                
                <div className="mode-toggle">
                  {isRegistering ? 'Already have an account?' : "Don't have an account?"} 
                  <a href="#" onClick={toggleMode} className="toggle-link">
                    {isRegistering ? 'Sign in' : 'Create account'}
                  </a>
                </div>
              </div>
            </form>
          </div>
          
          {/* Right Image */}
          <div className="login-image">
            <div className="image-overlay">
            </div>
            <img 
              src="https://niceillustrations.com/wp-content/uploads/2023/02/cartoon-invoice-768x768.png" 
              alt="Person using laptop" 
              className="illustration"
            />
          </div>
        </div>
        
        <div className="login-footer">
          <p>&copy; {new Date().getFullYear()} ML Finance Solutions. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
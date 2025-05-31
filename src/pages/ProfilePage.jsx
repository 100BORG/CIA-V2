import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUpload, FiCamera, FiTrash2, FiSun, FiMoon } from 'react-icons/fi';
import { defaultLogo } from '../assets/logoData';
import Modal from '../components/Modal';
import { useUserRole } from '../context/UserRoleContext'; // Import the hook
import { supabase } from '../config/supabaseClient';
import './ProfilePage.css';

const ProfilePage = ({ darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole(); // Get the isAdmin status
  
  // Initialize state with data from Supabase
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'johndoe@example.com',
    position: 'CEO',
    phone: '',
    avatar: defaultLogo
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch user data from Supabase on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          setError('User not authenticated');
          return;
        }
        const userId = userData.user.id;
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('name, email, phone, position, avatar')
          .eq('id', userId)
          .single();
        
        if (profileError) {
          setError('Error fetching profile data');
          return;
        }
        
        setFormData({
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          position: profileData.position,
          avatar: profileData.avatar || defaultLogo
        });
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          avatar: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      // Get current user (async)
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        setIsSaving(false);
        setSaveSuccess(false);
        setError('User not authenticated');
        return;
      }
      const userId = userData.user.id;
      // Update user profile in Supabase
      const { error: updateError } = await supabase.from('users').update({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        avatar: formData.avatar,
        updated_at: new Date().toISOString(),
      }).eq('id', userId);
      setIsSaving(false);
      if (updateError) {
        setSaveSuccess(false);
        setError(updateError.message);
        return;
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setIsSaving(false);
      setSaveSuccess(false);
      setError('An unexpected error occurred.');
    }
  };
  
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    const user = supabase.auth.user();
    if (!user) {
      setIsDeleting(false);
      setError('User not authenticated');
      return;
    }
    // Remove user from users table
    await supabase.from('users').delete().eq('id', user.id);
    // Remove user from auth
    await supabase.auth.admin.deleteUser(user.id);
    setIsDeleting(false);
    navigate('/login');
  };
  
  // Loading skeleton components
  const ProfileHeaderSkeleton = () => (
    <div className="profile-header">
      <div className="profile-avatar-container">
        <div 
          className="profile-avatar-skeleton"
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: darkMode ? '#3a4252' : '#e5e7eb',
            animation: 'pulse 1.5s ease-in-out infinite alternate'
          }}
        />
      </div>
      <div>
        <div 
          className="profile-name-skeleton"
          style={{
            height: '32px',
            width: '200px',
            background: darkMode ? '#3a4252' : '#e5e7eb',
            borderRadius: '6px',
            marginBottom: '8px',
            animation: 'pulse 1.5s ease-in-out infinite alternate'
          }}
        />
        <div 
          className="profile-email-skeleton"
          style={{
            height: '20px',
            width: '250px',
            background: darkMode ? '#3a4252' : '#e5e7eb',
            borderRadius: '4px',
            animation: 'pulse 1.5s ease-in-out infinite alternate'
          }}
        />
      </div>
    </div>
  );

  const FormFieldSkeleton = ({ width = '100%' }) => (
    <div className="form-group">
      <div 
        style={{
          height: '16px',
          width: '120px',
          background: darkMode ? '#3a4252' : '#e5e7eb',
          borderRadius: '4px',
          marginBottom: '8px',
          animation: 'pulse 1.5s ease-in-out infinite alternate'
        }}
      />
      <div 
        style={{
          height: '40px',
          width: width,
          background: darkMode ? '#3a4252' : '#e5e7eb',
          borderRadius: '8px',
          animation: 'pulse 1.5s ease-in-out infinite alternate'
        }}
      />
    </div>
  );

  const ProfileFormSkeleton = () => (
    <div className="profile-content">
      <div className="profile-section">
        <div 
          style={{
            height: '24px',
            width: '180px',
            background: darkMode ? '#3a4252' : '#e5e7eb',
            borderRadius: '4px',
            marginBottom: '20px',
            animation: 'pulse 1.5s ease-in-out infinite alternate'
          }}
        />
        <FormFieldSkeleton />
        <FormFieldSkeleton />
        <FormFieldSkeleton />
        <FormFieldSkeleton />
      </div>
      
      <div className="profile-actions">
        <div 
          style={{
            height: '40px',
            width: '80px',
            background: darkMode ? '#3a4252' : '#e5e7eb',
            borderRadius: '6px',
            animation: 'pulse 1.5s ease-in-out infinite alternate'
          }}
        />
        <div 
          style={{
            height: '40px',
            width: '120px',
            background: darkMode ? '#3a4252' : '#e5e7eb',
            borderRadius: '6px',
            animation: 'pulse 1.5s ease-in-out infinite alternate'
          }}
        />
      </div>
    </div>
  );
  
  return (
    <div className="profile-container">
      {/* Theme toggle button */}
      <button 
        className="profile-theme-toggle" 
        onClick={toggleDarkMode}
        title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
      </button>

      <Link to="/dashboard" className="profile-back-btn">
        <FiArrowLeft /> Back to Dashboard
      </Link>
      
      {isLoading ? (
        // Loading skeleton
        <>
          <ProfileHeaderSkeleton />
          <ProfileFormSkeleton />
        </>
      ) : (
        // Actual content
        <>
          <div className="profile-header">
            <div 
              className="profile-avatar-container"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <img src={formData.avatar} alt={formData.name} className="profile-avatar" />
              <label htmlFor="avatar-upload" className={`avatar-upload-overlay ${isHovering ? 'visible' : ''}`}>
                <FiCamera size={24} />
                <span>Change Photo</span>
              </label>
              <input 
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>
            <div>
              <h1 className="profile-name">{formData.name}</h1>
              <p className="profile-email">{formData.email}</p>
            </div>
          </div>
          
          <div className="profile-content">
            <form onSubmit={handleSubmit}>
              <div className="profile-section">
                <h3>Personal Information</h3>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(123) 456-7890"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="position">Position/Title</label>
                  <input
                    type="text"
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              {saveSuccess && (
                <div className="success-message">
                  Profile updated successfully!
                </div>
              )}
              
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              
              <div className="profile-actions">
                <Link to="/dashboard" className="btn btn-secondary">Cancel</Link>
                <button type="submit" className="btn" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
            
            {/* Danger Zone Section - Conditionally render based on isAdmin */}
            {!isAdmin && (
              <div className="profile-section danger-zone">
                <h3>Danger Zone</h3>
                <p>Delete your account permanently. This action cannot be undone.</p>
                <button 
                  className="btn btn-danger" 
                  onClick={() => setShowDeleteModal(true)}
                  disabled={isDeleting}
                >
                  <FiTrash2 style={{ marginRight: '8px' }} /> 
                  {isDeleting ? 'Deleting Account...' : 'Delete Account'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* Delete Account Confirmation Modal - Conditionally render based on isAdmin */}
      {!isAdmin && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Account"
          actions={
            <>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </>
          }
        >
          <p>Are you sure you want to delete your account? This will:</p>
          <ul>
            <li>Remove all your account information</li>
            <li>Unassign any invoices assigned to you</li>
            <li>Log you out immediately</li>
          </ul>
          <p style={{ fontWeight: 'bold' }}>This action cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
};

export default ProfilePage;
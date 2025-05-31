// DescriptionPage.jsx - Dedicated page for service description management
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiTrash2, FiPlus, FiSun, FiMoon } from 'react-icons/fi';
import './ClientPage.css'; // Reuse ClientPage styling
import { supabase } from '../config/supabaseClient';

const DescriptionPage = ({ darkMode, toggleDarkMode }) => {
  // Add a ref to track if we're dispatching our own events
  const isSelfDispatch = React.useRef(false);

  // Get descriptions from Supabase
  const [descriptions, setDescriptions] = useState([]);
  const [activeDescriptionId, setActiveDescriptionId] = useState(null);
  const [newDescription, setNewDescription] = useState({
    text: ''
  });
  const [isAddingDescription, setIsAddingDescription] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleDescriptionChange = (e) => {
    const { value } = e.target;
    setNewDescription({
      ...newDescription,
      text: value
    });
  };
  
  const handleEditDescription = (id) => {
    setActiveDescriptionId(id);
    const descriptionToEdit = descriptions.find(desc => desc.id === id);
    setNewDescription(descriptionToEdit);
    setIsAddingDescription(true);
  };
  
  // Delete description from Supabase
  const handleDeleteDescription = async (id) => {
    if (window.confirm('Are you sure you want to delete this description?')) {
      await supabase.from('descriptions').delete().eq('id', id);
      const { data } = await supabase.from('descriptions').select('*').order('id', { ascending: true });
      setDescriptions(data);
    }
  };
  
  const handleAddDescription = () => {
    setIsAddingDescription(true);
    setActiveDescriptionId(null);
    setNewDescription({
      text: ''
    });
  };
  
  // Save or update description in Supabase
  const handleSaveDescription = async () => {
    if (!newDescription.text) return;
    let result;
    if (activeDescriptionId !== null) {
      // Update existing
      result = await supabase.from('descriptions').update({ text: newDescription.text }).eq('id', activeDescriptionId);
    } else {
      // Add new
      result = await supabase.from('descriptions').insert([{ text: newDescription.text }]);
    }
    if (!result.error) {
      // Refresh list
      const { data } = await supabase.from('descriptions').select('*').order('id', { ascending: true });
      setDescriptions(data);
      setIsAddingDescription(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };
  
  const handleCancelDescriptionEdit = () => {
    setIsAddingDescription(false);
  };

  // Fetch descriptions from Supabase on mount
  useEffect(() => {
    const fetchDescriptions = async () => {
      let { data, error } = await supabase.from('descriptions').select('*').order('id', { ascending: true });
      if (!error && data) setDescriptions(data);
    };
    fetchDescriptions();
  }, []);

  return (
    <div className="client-container">
      <Link to="/dashboard" className="client-back-btn">
        <FiArrowLeft /> Back to Dashboard
      </Link>
      
      <div className="client-header">
        <h1>Service Descriptions</h1>
        <p>Manage your service descriptions for invoicing</p>
      </div>
      
      <button className="btn-toggle-theme" onClick={toggleDarkMode} title="Toggle Dark Mode">
        {darkMode ? <FiSun /> : <FiMoon />}
      </button>
      
      {!isAddingDescription ? (
        <div className="clients-section">
          <div className="section-header">
            <h3>My Descriptions</h3>
            <button className="btn-add" onClick={handleAddDescription}>
              <FiPlus /> Add Description
            </button>
          </div>
          
          <div className="clients-list">
            {descriptions.map(description => (
              <div key={description.id} className="client-card">
                <div className="client-card-header">
                  <div className="client-info">
                    <h4>{description.text}</h4>
                  </div>
                </div>
                <div className="client-actions">
                  <button className="btn-icon" onClick={() => handleEditDescription(description.id)} title="Edit">
                    <FiSave />
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDeleteDescription(description.id)} title="Delete">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
            
            {descriptions.length === 0 && (
              <div className="no-clients">
                <p>You haven't added any service descriptions yet.</p>
                <button className="btn" onClick={handleAddDescription}>
                  <FiPlus /> Add Your First Description
                </button>
              </div>
            )}
          </div>
          
          {saveSuccess && (
            <div className="success-message">
              Description updated successfully!
            </div>
          )}
        </div>
      ) : (
        <div className="client-form">
          <h3>{activeDescriptionId !== null ? 'Edit Description' : 'Add New Description'}</h3>
          
          <div className="form-group">
            <label htmlFor="descriptionText">Description Text*</label>
            <textarea
              id="descriptionText"
              name="text"
              value={newDescription.text}
              onChange={handleDescriptionChange}
              rows={3}
              required
            ></textarea>
          </div>
          
          <div className="client-form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancelDescriptionEdit}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={handleSaveDescription}>
              {activeDescriptionId !== null ? 'Update Description' : 'Add Description'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DescriptionPage;
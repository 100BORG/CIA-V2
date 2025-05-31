// CompanyPage.jsx - Dedicated page for company management
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiUpload, FiTrash2, FiPlus, FiSun, FiMoon } from 'react-icons/fi';
import { defaultLogo } from '../assets/logoData';
import { supabase } from '../config/supabaseClient';
import './CompanyPage.css';

const CompanyPage = ({ darkMode, toggleDarkMode }) => {
  // Get companies from Supabase
  const [companies, setCompanies] = useState([]);
  const [activeCompanyId, setActiveCompanyId] = useState(null);
  const [newCompany, setNewCompany] = useState({
    name: '',
    logo: defaultLogo,
    address: '',
    gstin: '',
    bankDetails: {
      accountName: '',
      bankName: '',
      accountNumber: '',
      ifscCode: ''
    }
  });
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase.from('companies').select('*');
      if (!error) setCompanies(data || []);
    };
    fetchCompanies();
  }, []);
  
  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('bankDetails.')) {
      const bankField = name.split('.')[1];
      setNewCompany({
        ...newCompany,
        bankDetails: {
          ...newCompany.bankDetails,
          [bankField]: value
        }
      });
    } else {
      setNewCompany({
        ...newCompany,
        [name]: value
      });
    }
  };
  
  const handleEditCompany = (id) => {
    setActiveCompanyId(id);
    const companyToEdit = companies.find(company => company.id === id);
    setNewCompany(companyToEdit);
    setIsAddingCompany(true);
  };
  
  const handleDeleteCompany = async (id) => {
    if (window.confirm('Are you sure you want to delete this company? All invoices associated with this company will also be deleted.')) {
      await supabase.from('companies').delete().eq('id', id);
      // Optionally, delete invoices for this company
      await supabase.from('invoices').delete().eq('companyId', id);
      // Refresh companies
      const { data } = await supabase.from('companies').select('*');
      setCompanies(data || []);
    }
  };
  
  // New function to handle file uploads
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewCompany({
          ...newCompany,
          logo: event.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCompany = () => {
    setIsAddingCompany(true);
    setActiveCompanyId(null);
    setNewCompany({
      name: '',
      logo: defaultLogo,
      address: '',
      gstin: '',
      bankDetails: {
        accountName: '',
        bankName: '',
        accountNumber: '',
        ifscCode: ''
      }
    });
  };
  
  const handleSaveCompany = async () => {
    if (!newCompany.name) {
      alert('Company name is required');
      return;
    }
    let result;
    if (activeCompanyId !== null) {
      // Update existing company
      result = await supabase.from('companies').update({ ...newCompany }).eq('id', activeCompanyId);
    } else {
      // Add new company
      result = await supabase.from('companies').insert([{ ...newCompany }]);
    }
    if (result.error) {
      alert(result.error.message);
      return;
    }
    // Refresh companies
    const { data } = await supabase.from('companies').select('*');
    setCompanies(data || []);
    setIsAddingCompany(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };
  
  const handleCancelCompanyEdit = () => {
    setIsAddingCompany(false);
  };
  
  return (
    <div className="company-container">
      <Link to="/dashboard" className="company-back-btn">
        <FiArrowLeft /> Back to Dashboard
      </Link>
      
      <div className="company-header">
        <h1>Company Management</h1>
        <p>Manage your companies for invoicing</p>
      </div>
      
      <button className="btn-toggle-theme" onClick={toggleDarkMode} title="Toggle Dark Mode">
        {darkMode ? <FiSun /> : <FiMoon />}
      </button>
      
      {!isAddingCompany ? (
        <div className="companies-section">
          <div className="section-header">
            <h3>My Companies</h3>
            <button className="btn-add" onClick={handleAddCompany}>
              <FiPlus /> Add Company
            </button>
          </div>
          
          <div className="companies-list">
            {companies.map(company => (
              <div key={company.id} className="company-card">
                <div className="company-card-header">
                  <img src={company.logo} alt={company.name} className="company-logo" />
                  <div className="company-info">
                    <h4>{company.name}</h4>
                    <p className="company-gstin">{company.gstin}</p>
                  </div>
                </div>
                <div className="company-address">
                  <p>{company.address}</p>
                </div>
                <div className="company-actions">
                  <button className="btn-icon" onClick={() => handleEditCompany(company.id)} title="Edit">
                    <FiSave />
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDeleteCompany(company.id)} title="Delete">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
            
            {companies.length === 0 && (
              <div className="no-companies">
                <p>You haven't added any companies yet.</p>
                <button className="btn" onClick={handleAddCompany}>
                  <FiPlus /> Add Your First Company
                </button>
              </div>
            )}
          </div>
          
          {saveSuccess && (
            <div className="success-message">
              Company information updated successfully!
            </div>
          )}
        </div>
      ) : (
        <div className="company-form">
          <h3>{activeCompanyId !== null ? 'Edit Company' : 'Add New Company'}</h3>
          
          <div className="logo-upload-section">
            <img src={newCompany.logo} alt="Company Logo" className="company-logo-preview" />
            <div className="logo-upload-actions">
              <div className="file-upload-container">
                <label htmlFor="logoUpload" className="btn-upload">
                  <FiUpload /> Upload Custom Logo
                </label>
                <input 
                  type="file" 
                  id="logoUpload" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload} 
                />
              </div>
            </div>
            <small>(Upload your company logo)</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="companyName">Company Name*</label>
            <input
              type="text"
              id="companyName"
              name="name"
              value={newCompany.name}
              onChange={handleCompanyChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="companyAddress">Address</label>
            <textarea
              id="companyAddress"
              name="address"
              value={newCompany.address}
              onChange={handleCompanyChange}
              rows={3}
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="companyGstin">GSTIN</label>
            <input
              type="text"
              id="companyGstin"
              name="gstin"
              value={newCompany.gstin}
              onChange={handleCompanyChange}
            />
          </div>
          
          <div className="company-bank-details">
            <h4>Bank Details</h4>
            
            <div className="form-group">
              <label htmlFor="bankName">Bank Name</label>
              <input
                type="text"
                id="bankName"
                name="bankDetails.bankName"
                value={newCompany.bankDetails.bankName}
                onChange={handleCompanyChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="accountName">Account Name</label>
              <input
                type="text"
                id="accountName"
                name="bankDetails.accountName"
                value={newCompany.bankDetails.accountName}
                onChange={handleCompanyChange}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="accountNumber">Account Number</label>
                <input
                  type="text"
                  id="accountNumber"
                  name="bankDetails.accountNumber"
                  value={newCompany.bankDetails.accountNumber}
                  onChange={handleCompanyChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="ifscCode">IFSC Code</label>
                <input
                  type="text"
                  id="ifscCode"
                  name="bankDetails.ifscCode"
                  value={newCompany.bankDetails.ifscCode}
                  onChange={handleCompanyChange}
                />
              </div>
            </div>
          </div>
          
          <div className="company-form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancelCompanyEdit}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={handleSaveCompany}>
              {activeCompanyId !== null ? 'Update Company' : 'Add Company'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyPage;
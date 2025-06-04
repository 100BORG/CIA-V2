// BinPage.jsx - For managing deleted invoices
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArchive, FiArrowLeft, FiTrash2, FiRefreshCw, FiClock, FiAlertTriangle } from 'react-icons/fi';
import { supabase } from '../config/supabaseClient';
import '../App.css';
import './BinPage.css';

const BinPage = ({ onLogout, darkMode, toggleDarkMode }) => {  const navigate = useNavigate();
  const [deletedInvoices, setDeletedInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get current user on component mount
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Load deleted invoices from Supabase on component mount
  useEffect(() => {
    if (currentUserId) {
      loadDeletedInvoices();
    }
  }, [currentUserId]);

  // Load deleted invoices from Supabase
  const loadDeletedInvoices = async () => {
    setIsLoading(true);
    // Fetch invoices where deletedAt is not null, deletedBy is current user, and deletedAt within 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('deletedBy', currentUserId)
      .not('deletedAt', 'is', null)
      .gte('deletedAt', thirtyDaysAgo)
      .order('deletedAt', { ascending: false });
    if (!error) setDeletedInvoices(data || []);
    setIsLoading(false);
  };

  // Restore invoice from bin (set deletedAt and deletedBy to null)
  const restoreInvoice = async (invoiceId) => {
    setIsLoading(true);
    await supabase.from('invoices').update({ deletedAt: null, deletedBy: null }).eq('id', invoiceId);
    // After restore, also refresh dashboard invoices if possible
    if (window.location.pathname !== '/dashboard') {
      // If not on dashboard, just reload bin
      await loadDeletedInvoices();
    } else {
      // If on dashboard, trigger a refresh event
      window.dispatchEvent(new Event('invoicesUpdated'));
      await loadDeletedInvoices();
    }
    alert('Invoice has been restored successfully.');
  };

  // Permanently delete an invoice (delete row from Supabase)
  const permanentlyDeleteInvoice = async (invoiceId) => {
    if (window.confirm('Are you sure you want to permanently delete this invoice? This action cannot be undone.')) {
      setIsLoading(true);
      await supabase.from('invoices').delete().eq('id', invoiceId);
      await loadDeletedInvoices();
      alert('Invoice has been permanently deleted.');
    }
  };

  // Empty the bin (remove all deleted invoices for this user)
  const emptyBin = async () => {
    if (window.confirm('Are you sure you want to permanently delete all invoices in the bin? This action cannot be undone.')) {
      setIsLoading(true);
      const ids = deletedInvoices.map(inv => inv.id);
      if (ids.length > 0) {
        await supabase.from('invoices').delete().in('id', ids);
      }
      await loadDeletedInvoices();
      alert('Bin has been emptied successfully.');
    }
  };

  // Calculate time left before permanent deletion
  const getTimeLeft = (deletedAt) => {
    const deleteTime = new Date(deletedAt);
    const expiryTime = new Date(deleteTime.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days after deletion
    const now = new Date();
    const daysLeft = Math.ceil((expiryTime - now) / (24 * 60 * 60 * 1000));
    if (daysLeft === 1) {
      return '1 day left';
    } else {
      return `${daysLeft} days left`;
    }
  };
  
  // Header with navigation, title, and theme toggle
  const Header = () => (
    <header className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 80 }}>
      <div className="header-left" style={{ position: 'absolute', left: 0, top: 0, height: '100%', display: 'flex', alignItems: 'center', paddingLeft: 24 }}>
        <div className="back-button" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 28, color: darkMode ? '#fff' : '#232a36' }}>
          <FiArrowLeft />
        </div>
      </div>
      <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', width: '100%' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 38, fontWeight: 800, color: darkMode ? '#fff' : '#232a36', margin: 0 }}><FiArchive size={38} /> Invoice Bin</h1>
      </div>
      <div className="header-right" style={{ width: 48 }}></div>
    </header>
  );
  
  return (
    <div className="bin-page">
      <Header />
      <div className="bin-content" style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="bin-description" style={{
          background: darkMode ? '#232a36' : '#fff',
          boxShadow: darkMode ? '0 1px 4px #10131a33' : '0 1px 4px #e0e7ef33',
          borderRadius: 16,
          marginBottom: 32,
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 24
        }}>
          <div className="bin-info" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 18, fontWeight: 600, color: darkMode ? '#fff' : '#232a36' }}>
              <FiClock size={22} />
              Deleted invoices are kept for 30 days before permanent removal.
            </div>
            <div style={{ color: darkMode ? '#bfc7d5' : '#6b7280', marginTop: 6, fontSize: 15 }}>
              You can restore invoices to your active list or delete them permanently at any time.
            </div>
          </div>
          {deletedInvoices.length > 0 && (
            <div className="bin-actions">
              <button onClick={emptyBin} className="btn btn-danger" style={{
                background: 'linear-gradient(90deg, #ef4444 60%, #b91c1c 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 16,
                padding: '10px 24px',
                fontWeight: 600,
                fontSize: 16,
                boxShadow: darkMode ? '0 2px 8px #10131a33' : '0 2px 8px #e0e7ef33',
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <FiTrash2 /> Empty Bin
              </button>
            </div>
          )}
        </div>
        {isLoading ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading deleted invoices...</p>
          </div>
        ) : deletedInvoices.length === 0 ? (
          <div className="empty-bin" style={{
            background: darkMode ? '#232a36' : '#fff',
            borderRadius: 16,
            boxShadow: darkMode ? '0 1px 4px #10131a33' : '0 1px 4px #e0e7ef33',
            marginTop: 40,
            padding: '64px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 18
          }}>
            <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 18 }}>
              <rect x="15" y="35" width="80" height="40" rx="16" fill={darkMode ? '#232a36' : '#e3eafc'} />
              <rect x="30" y="50" width="50" height="8" rx="4" fill={darkMode ? '#3b82f6' : '#60a5fa'} />
              <rect x="30" y="62" width="28" height="6" rx="3" fill={darkMode ? '#334155' : '#cbd5e1'} />
              <circle cx="85" cy="70" r="7" fill={darkMode ? '#3b82f6' : '#60a5fa'} />
              <rect x="45" y="25" width="20" height="8" rx="4" fill={darkMode ? '#bfc7d5' : '#cbd5e1'} />
            </svg>
            <h2 style={{ fontWeight: 700, fontSize: 26, color: darkMode ? '#fff' : '#232a36', marginBottom: 6 }}>Bin is empty</h2>
            <div style={{ color: darkMode ? '#bfc7d5' : '#6b7280', fontSize: 17, marginBottom: 18 }}>No deleted invoices were found.</div>
            <button onClick={() => navigate('/dashboard')} className="btn" style={{
              background: 'linear-gradient(90deg, #3b82f6 60%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              padding: '10px 28px',
              fontWeight: 600,
              fontSize: 16,
              boxShadow: darkMode ? '0 2px 8px #10131a33' : '0 2px 8px #e0e7ef33',
              marginTop: 8
            }}>
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="bin-invoice-list" style={{ marginTop: 24 }}>
            <table className="bin-table" style={{
              background: darkMode ? '#232a36' : '#fff',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: darkMode ? '0 1px 4px #10131a33' : '0 1px 4px #e0e7ef33',
              fontSize: 16
            }}>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Deleted On</th>
                  <th>Time Left</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedInvoices.map((invoice, idx) => {
                  const deletedDate = new Date(invoice.deletedAt).toLocaleDateString();
                  const timeLeft = getTimeLeft(invoice.deletedAt);
                  return (
                    <tr key={invoice.id} style={{ background: idx % 2 === 0 ? (darkMode ? '#232a36' : '#f6f8fa') : 'transparent', transition: 'background 0.2s' }}>
                      <td style={{ fontWeight: 600 }}>{invoice.invoiceNumber}</td>
                      <td>{invoice.recipientName || 'N/A'}</td>
                      <td>{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                      <td>
                        <span style={{ color: '#3b82f6', fontWeight: 600 }}>${invoice.totalUSD ? invoice.totalUSD.toFixed(2) : '0.00'}</span>
                        <span style={{ color: '#6b7280', marginLeft: 6 }}>/ ₹{invoice.totalINR ? invoice.totalINR.toFixed(2) : '0.00'}</span>
                      </td>
                      <td>{deletedDate}</td>
                      <td><span style={{ color: '#f59e0b', fontWeight: 500 }}>{timeLeft}</span></td>
                      <td>
                        <div className="bin-actions" style={{ gap: 8 }}>
                          <button 
                            onClick={() => restoreInvoice(invoice.id)}
                            className="btn btn-secondary bin-action-btn"
                            title="Restore Invoice"
                            style={{
                              background: 'linear-gradient(90deg, #60a5fa 60%, #3b82f6 100%)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 10,
                              fontWeight: 600,
                              fontSize: 15,
                              padding: '7px 18px',
                              display: 'flex', alignItems: 'center', gap: 7,
                              boxShadow: darkMode ? '0 1px 4px #10131a33' : '0 1px 4px #e0e7ef33',
                            }}
                          >
                            <FiRefreshCw /> Restore
                          </button>
                          <button
                            onClick={() => permanentlyDeleteInvoice(invoice.id)}
                            className="btn btn-danger bin-action-btn"
                            title="Delete Permanently"
                            style={{
                              background: 'linear-gradient(90deg, #ef4444 60%, #b91c1c 100%)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 10,
                              fontWeight: 600,
                              fontSize: 15,
                              padding: '7px 18px',
                              display: 'flex', alignItems: 'center', gap: 7,
                              boxShadow: darkMode ? '0 1px 4px #10131a33' : '0 1px 4px #e0e7ef33',
                            }}
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BinPage;
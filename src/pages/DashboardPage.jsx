import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiSettings, FiLogOut, FiUser, FiPlus, FiChevronDown, FiUsers, FiTrash2, FiDownload, FiMenu } from 'react-icons/fi';
import { FiSun, FiMoon, FiArchive, FiList } from 'react-icons/fi';
import '../App.css';
import { defaultLogo } from '../assets/logoData';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import NotificationBell from '../components/NotificationBell';
import { useUserRole } from '../context/UserRoleContext';
import { useUserNotifications } from '../context/UserNotificationsContext';
import Modal from '../components/Modal';
import { supabase } from '../config/supabaseClient';

const DashboardPage = ({ onLogout, darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const { isAdmin, hasPermission } = useUserRole();
  const { addNotification } = useUserNotifications();
  
  // Get current user name from localStorage for loading state
  const currentUserName = localStorage.getItem('userName') || 'User';
  
  // Add state for bulk download progress
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [downloadStatus, setDownloadStatus] = useState('');
  
  const [companies, setCompanies] = useState([]);
  
  // State for selected company and dashboard view
  const [selectedCompany, setSelectedCompany] = useState(null);

  // State for clients and selected client
  const [clients, setClients] = useState([]);
  
  const [selectedClient, setSelectedClient] = useState(null);
  
  // State for users
  const [users, setUsers] = useState([]);
  
  const [showAllInvoices, setShowAllInvoices] = useState(true);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Invoice status state
  const [invoiceStatuses, setInvoiceStatuses] = useState(() => {
    const savedStatuses = localStorage.getItem('invoiceStatuses');
    return savedStatuses ? JSON.parse(savedStatuses) : {};
  });
  
  // Sort state
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showSortOptions, setShowSortOptions] = useState(false);
    // State for saved invoices
  const [savedInvoices, setSavedInvoices] = useState([]);
  
  // Loading state for initial dashboard data fetch
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Current user ID
  const currentUserId = localStorage.getItem('userId') || 'demo_user';
  const currentUser = users.find(u => u.id === currentUserId);
  const isCurrentUserAdmin = currentUser?.role === 'admin';

  // State for current user's avatar
  const [userAvatar, setUserAvatar] = useState(localStorage.getItem('userAvatar') || '');

  // --- Auto-select invoicing associate after login ---
  useEffect(() => {
    if (currentUser && !isCurrentUserAdmin) {
      setSelectedAssignee(currentUserId);
      setShowAllInvoices(false);
      setSelectedCompany(null);
      setSelectedClient(null);
    } else if (isCurrentUserAdmin) {
      setShowAllInvoices(true);
      setSelectedAssignee(null);
      setSelectedCompany(null);
      setSelectedClient(null);
    }
  // Also run when isCurrentUserAdmin changes
  }, [currentUserId, users.length, isCurrentUserAdmin]);

  // Download modal state
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadOption, setDownloadOption] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sidebar toggle for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Update localStorage when selected company changes
  useEffect(() => {
    if (selectedCompany) {
      localStorage.setItem('selectedCompany', JSON.stringify(selectedCompany));
      setShowAllInvoices(false);
      setSelectedAssignee(null);
    }
  }, [selectedCompany]);
  
  // Save invoice statuses to localStorage when they change
  useEffect(() => {
    localStorage.setItem('invoiceStatuses', JSON.stringify(invoiceStatuses));
  }, [invoiceStatuses]);
    // Fetch all data from Supabase on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setIsInitialLoading(true);
        const { data: companies } = await supabase.from('companies').select('*');
        setCompanies(companies || []);
        const { data: clients } = await supabase.from('clients').select('*');
        setClients(clients || []);
        const { data: users } = await supabase.from('users').select('*');
        setUsers(users || []);
        // Only fetch invoices that are NOT deleted
        const { data: invoices } = await supabase.from('invoices').select('*').is('deletedAt', null);
        setSavedInvoices(invoices || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchAll();
  }, []);
  
  // Presave default service descriptions for all users on app load
  useEffect(() => {
    const defaultDescriptions = [
      { id: 1, text: 'US Federal Corporation Income Tax Return (Form 1120)' },
      { id: 2, text: 'Foreign related party disclosure form with respect to a foreign subsidiary (Form 5417)' },
      { id: 3, text: 'Foreign related party disclosure form with respect to a foreign shareholders (Form 5472)' },
      { id: 4, text: 'Application for Automatic Extension of Time To File Business Income Tax (Form 7004)' }
    ];
    const savedDescriptions = localStorage.getItem('serviceDescriptions');
    if (!savedDescriptions) {
      localStorage.setItem('serviceDescriptions', JSON.stringify(defaultDescriptions));
    }
  }, []);
  
  // Replace all localStorage CRUD for companies, clients, users, invoices with Supabase queries in all relevant handlers
  // ...existing code...

  const handleCompanySelect = (company) => {
    setSelectedCompany(company);
    setShowAllInvoices(false);
    setSelectedAssignee(null);
    setSelectedClient(null);
  };
  
  const handleShowAllInvoices = () => {
    setShowAllInvoices(true);
    setSelectedAssignee(null);
    setSelectedCompany(null);
    setSelectedClient(null);
  };
  
  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setShowAllInvoices(false);
    setSelectedAssignee(null);
    setSelectedCompany(null);
  };
  
  const handleAssigneeSelect = (userId) => {
    setSelectedAssignee(userId);
    setShowAllInvoices(false);
    setSelectedCompany(null);
    setSelectedClient(null);
  };
  
  // Sort handlers
  const handleSortChange = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default desc direction
      setSortField(field);
      setSortDirection('desc');
    }
    setShowSortOptions(false);
  };
  
  const toggleSortOptions = () => {
    setShowSortOptions(!showSortOptions);
  };
  
  const getSortLabel = () => {
    const labels = {
      'date': 'Date',
      'name': 'Company Name',
      'amount': 'Amount',
      'status': 'Status'
    };
    return `Sort by: ${labels[sortField]} (${sortDirection === 'asc' ? 'Ascending' : 'Descending'})`;
  };
  
  const handleCreateInvoice = () => {
    navigate('/invoice/new');
  };
  
  // Format date for display (DD/MM/YYYY)
  const formatDateForDisplay = (dateString) => {
    const d = new Date(dateString);
    const month = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  };

  // Function to download all visible invoices as PDFs
  const downloadAllInvoices = async (dateRange = null) => {
    // Get the filtered invoices
    let filteredInvoices = sortInvoices(savedInvoices).filter(invoice => {
      // If a company is selected, only show invoices for that company
      if (!showAllInvoices && selectedCompany && !selectedAssignee) {
        // Check if the companyId is missing or doesn't match
        if (!invoice.companyId || invoice.companyId !== selectedCompany.id) {
          // As a fallback, also check if the company name matches
          if (invoice.senderName !== selectedCompany.name) {
            return false;
          }
        }
      }
      
      // If an assignee is selected, only show invoices assigned to them
      if (selectedAssignee) {
        if (invoice.assigneeId !== selectedAssignee) {
          return false;
        }
      }
      
      // Filter by search term if provided
      if (searchTerm && 
          !invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !invoice.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !invoice.recipientName?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    // Filter by date range if provided
    if (dateRange && dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      filteredInvoices = filteredInvoices.filter(inv => {
        const invDate = new Date(inv.invoiceDate);
        return invDate >= start && invDate <= end;
      });
    }
    
    if (filteredInvoices.length === 0) {
      alert('No invoices to download.');
      return;
    }
    
    // Ask for confirmation if there are many invoices
    if (filteredInvoices.length > 5) {
      if (!window.confirm(`You are about to download ${filteredInvoices.length} invoices as separate PDF files. This might take a while. Continue?`)) {
        return;
      }
    }
    
    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: filteredInvoices.length });
    setDownloadStatus('Preparing to download invoices...');
    
    try {
      // Create an offscreen container to render invoices
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      document.body.appendChild(container);
      
      // Inject required styles
      const style = document.createElement('style');
      style.innerHTML = `
        .a4-preview-container {
          width: 210mm;
          min-height: 297mm;
          padding: 5mm;
          background-color: #fff;
          font-family: 'Arial', sans-serif;
          box-sizing: border-box;
          color: #333;
          position: relative;
        }
        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
        }
        .preview-logo {
          max-width: 120px;
          height: auto;
        }
        .company-name-header h1 {
          font-size: 24px;
          color: #3b82f6;
          margin-top: 10px;
        }
        .invoice-title h2 {
          font-size: 28px;
          color: #3b82f6;
          border: 2px solid #3b82f6;
          padding: 10px 20px;
          border-radius: 5px;
        }
        .details-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .bill-to-section h3 {
          color: #3b82f6;
          margin-bottom: 10px;
          font-size: 16px;
        }
        .customer-info {
          display: flex;
          flex-wrap: wrap;
        }
        .service-table table {
          width: 100%;
          border-collapse: collapse;
        }
        .service-table th {
          background-color: #f3f4f6;
          padding: 10px;
          text-align: left;
          font-weight: bold;
        }
        .service-table td {
          padding: 10px;
          border-bottom: 1px solid #e5e7eb;
        }
        .totals-section {
          margin-top: 20px;
          margin-left: auto;
          width: 50%;
        }
        .totals-section table {
          width: 100%;
        }
        .totals-section td {
          padding: 8px 0;
        }
        .grand-total {
          font-weight: bold;
          color: #3b82f6;
          border-top: 2px solid #e5e7eb;
          font-size: 16px;
        }        .text-right {
          text-align: right;
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
      
      // Process each invoice one by one
      for (let i = 0; i < filteredInvoices.length; i++) {
        const invoice = filteredInvoices[i];
        setDownloadProgress({ current: i + 1, total: filteredInvoices.length });
        setDownloadStatus(`Generating PDF ${i + 1}/${filteredInvoices.length}: ${invoice.invoiceNumber}`);
        
        // Create invoice HTML
        const invoiceHtml = renderInvoiceHtml(invoice);
        container.innerHTML = invoiceHtml;
        
        // Wait a bit for rendering to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Generate PDF
        const element = container.querySelector('.a4-preview-container');
        if (!element) {
          console.error('Could not find invoice element to render');
          continue;
        }
        
        try {
          // Convert to canvas
          const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          
          // Create PDF
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          
          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          // Add image to PDF
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          
          // Save PDF
          pdf.save(`Invoice_${invoice.invoiceNumber}.pdf`);
          
          // Give the browser some time to process the download
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`Error generating PDF for invoice ${invoice.invoiceNumber}:`, error);
          setDownloadStatus(`Error generating PDF for invoice ${invoice.invoiceNumber}: ${error.message}`);
        }
      }
      
      // Cleanup
      document.body.removeChild(container);
      document.head.removeChild(style);
      
      setDownloadStatus(`Successfully downloaded ${filteredInvoices.length} invoices!`);
      
      // Reset after a delay
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadStatus('');
      }, 3000);
      
    } catch (error) {
      console.error('Error in bulk download process:', error);
      setDownloadStatus(`Error: ${error.message}`);
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadStatus('');
      }, 3000);
    }
  };
  
  // Helper function to render invoice HTML
  const renderInvoiceHtml = (invoiceData) => {
    const exchangeRate = invoiceData.exchangeRate || 82;
    
    // Process invoice items to ensure consistent structure
    const normalizedItems = invoiceData.items.map(item => {
      if (!item.type) {
        return {
          ...item,
          type: 'main',
          subServices: item.subServices || item.nestedRows || []
        };
      }
      return {
        ...item,
        subServices: item.subServices || []
      };
    });
    
    // Helper function to render service items
    const renderServiceItems = () => {
      let html = '';
      
      normalizedItems.forEach((item, index) => {
        if (item.type === 'main') {
          // Main service row
          html += `
            <tr class="main-service-row" style="background-color: #f5f5f5">
              <td colspan="3">
                <strong style="font-size: 1.1rem">${item.name || 'Service'}</strong>
              </td>
            </tr>
          `;
          
          // Sub-services
          if (item.subServices && item.subServices.length > 0) {
            item.subServices.forEach(subService => {
              html += `
                <tr class="sub-service-row">
                  <td style="padding-left: 20px">
                    <strong>${subService.name || 'Sub-service'}</strong>
                    ${subService.description ? `<p>${subService.description}</p>` : ''}
                  </td>
                  <td class="text-right">$${parseFloat(subService.amountUSD || 0).toFixed(2)}</td>
                  <td class="text-right">₹${parseFloat(subService.amountINR || 0).toFixed(2)}</td>
                </tr>
              `;
            });
          } else {
            html += `
              <tr>
                <td colspan="3" style="padding-left: 20px; color: #666">
                  No sub-services available
                </td>
              </tr>
            `;
          }
        } else {
          // Regular service item
          html += `
            <tr>
              <td>
                <strong>${item.name || 'Service'}</strong>
                <p>${item.description || ''}</p>
              </td>
              <td class="text-right">$${parseFloat(item.amountUSD || 0).toFixed(2)}</td>
              <td class="text-right">₹${parseFloat(item.amountINR || 0).toFixed(2)}</td>
            </tr>
          `;
        }
      });
      
      return html;
    };
    
    return `
      <div class="a4-preview-container" id="invoicePreviewContent">
        <!-- 1. Top Header Section with Company Logo and Invoice Title -->
        <div class="preview-header">
          <div class="company-info">
            <img 
              class="preview-logo" 
              src="${invoiceData.logoUrl || defaultLogo}" 
              alt="Company Logo" 
            />
            <div class="company-name-header">
              <h1>${invoiceData.senderName || 'Your Company'}</h1>
            </div>
          </div>
          <div class="invoice-title">
            <h2>INVOICE</h2>
          </div>
        </div>
        
        <!-- 2. Company and Invoice Details Section -->
        <div class="details-section">
          <div class="company-details">
            <p>${invoiceData.senderAddress || 'Company Address'}</p>
            <p>GSTIN: ${invoiceData.senderGSTIN || 'N/A'}</p>
          </div>
          <div class="invoice-details">
            <div class="invoice-number">
              <p><strong>Invoice #:</strong> ${invoiceData.invoiceNumber}</p>
            </div>
            <div class="invoice-date">
              <p><strong>Date:</strong> ${formatDateForDisplay(invoiceData.invoiceDate)}</p>
            </div>
          </div>
        </div>
        
        <!-- 3. Client Information Section -->
        <div class="bill-to-section">
          <h3>Bill To:</h3>
          <div class="customer-info">
            <div class="info-row full-width">
              <p><strong>${invoiceData.recipientName || 'Client Name'}</strong></p>
            </div>
            <div class="info-row full-width">
              <p>${invoiceData.recipientAddress || 'Client Address'}</p>
            </div>
            <div class="info-row half-width">
              <p><strong>Phone:</strong> ${invoiceData.recipientPhone || 'N/A'}</p>
            </div>
            <div class="info-row half-width">
              <p><strong>Email:</strong> ${invoiceData.recipientEmail || 'N/A'}</p>
            </div>
            <div class="info-row half-width">
              <p><strong>GSTIN:</strong> ${invoiceData.recipientGSTIN || 'N/A'}</p>
            </div>
            <div class="info-row half-width">
              <p><strong>PAN:</strong> ${invoiceData.recipientPAN || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <!-- 4. Invoice Rate Information -->
        <div class="invoice-summary">
          <div class="rate-info">
            <p><strong>USD to INR Rate:</strong> ${exchangeRate}</p>
            <p><strong>GST Rate:</strong> ${invoiceData.taxRate || 5}%</p>
          </div>
        </div>
        
        <!-- 5. Service Items Table -->
        <div class="service-table">
          <table>
            <thead>
              <tr>
                <th style="width: 70%">Description</th>
                <th style="width: 15%">Amount (USD)</th>
                <th style="width: 15%">Amount (INR)</th>
              </tr>
            </thead>
            <tbody>
              ${renderServiceItems()}
            </tbody>
          </table>
        </div>
        
        <!-- 6. Totals Section -->
        <div class="totals-section">
          <table>
            <tbody>
              <tr>
                <td>Subtotal:</td>
                <td class="text-right">
                  $${invoiceData.subtotalUSD.toFixed(2)} / 
                  ₹${invoiceData.subtotalINR.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>GST (${invoiceData.taxRate}%):</td>
                <td class="text-right">
                  $${invoiceData.taxAmountUSD.toFixed(2)} / 
                  ₹${invoiceData.taxAmountINR.toFixed(2)}
                </td>
              </tr>
              <tr class="grand-total">
                <td>Grand Total:</td>
                <td class="text-right">
                  $${invoiceData.totalUSD.toFixed(2)} / 
                  ₹${invoiceData.totalINR.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- 7. Bank Details -->
        <div class="bank-details">
          <h3>Beneficiary Account Details</h3>
          <div class="account-info">
            <div class="info-row full-width">
              <p><strong>Account Name:</strong> ${invoiceData.accountName || 'N/A'}</p>
            </div>
            <div class="info-row full-width">
              <p><strong>Bank Name:</strong> ${invoiceData.bankName || 'N/A'}</p>
            </div>
            <div class="info-row half-width">
              <p><strong>Account Number:</strong> ${invoiceData.accountNumber || 'N/A'}</p>
            </div>
            <div class="info-row half-width">
              <p><strong>IFSC Code:</strong> ${invoiceData.ifscCode || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <!-- 8. Footer Section -->
        <div class="invoice-footer">
          <p>Thank you for your business!</p>
        </div>
      </div>
    `;
  };
    // Function to toggle invoice status
  const toggleInvoiceStatus = async (e, invoiceId) => {
    e.stopPropagation();
    const invoice = savedInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    const statusOptions = ['Paid', 'Pending', 'Draft', 'Cancelled'];
    const currentStatus = invoice.status || invoiceStatuses[invoiceId] || 'Pending';
    const currentIndex = statusOptions.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusOptions.length;
    const newStatus = statusOptions[nextIndex];

    // Update status in Supabase
    const { error } = await supabase.from('invoices').update({ status: newStatus }).eq('id', invoiceId);
    if (error) {
      alert('Failed to update status: ' + error.message);
      return;
    }
    // Update local state after successful update
    const updatedInvoices = savedInvoices.map(inv =>
      inv.id === invoiceId ? { ...inv, status: newStatus } : inv
    );
    setSavedInvoices(updatedInvoices);
    setInvoiceStatuses(prevStatuses => ({
      ...prevStatuses,
      [invoiceId]: newStatus
    }));
  };
  
  // Function to assign an invoice to a user
  const assignInvoice = async (e, invoiceId, assigneeId) => {
    e.stopPropagation(); // Prevent navigating to invoice detail page
    // Check if user has permission to assign invoices
    if (!hasPermission('assign-invoice')) {
      alert('Only administrators can assign invoices to users.');
      return;
    }
    // Get the previous assignee to check if this is a new assignment
    const invoice = savedInvoices.find(inv => inv.id === invoiceId);
    const previousAssigneeId = invoice?.assigneeId;
    const assigneeName = users.find(user => user.id === assigneeId)?.name || 'Unassigned';
    // Update in Supabase
    const { error } = await supabase.from('invoices').update({ assigneeId, assigneeName }).eq('id', invoiceId);
    if (error) {
      alert('Failed to assign invoice: ' + error.message);
      return;
    }
    // Update the invoice with the new assignee in local state
    const updatedInvoices = savedInvoices.map(invoice => {
      if (invoice.id === invoiceId) {
        return {
          ...invoice,
          assigneeId,
          assigneeName
        };
      }
      return invoice;
    });
    setSavedInvoices(updatedInvoices);
    // Send notification to the assignee if this is a new assignment
    if (assigneeId && assigneeId !== previousAssigneeId) {
      const updatedInvoice = updatedInvoices.find(inv => inv.id === invoiceId);
      const assignee = users.find(user => user.id === assigneeId);
      if (assignee) {
        // Save notification to Supabase
        await supabase.from('notifications').insert([
          {
            user_id: assigneeId,
            message: `You have been assigned a new invoice: ${updatedInvoice.invoiceNumber}`,
            type: 'info',
            read: false,
            data: { invoiceId, invoiceNumber: updatedInvoice.invoiceNumber },
            timestamp: new Date().toISOString()
          }
        ]);
        // Save notification to Supabase for the admin (current user)
        if (isCurrentUserAdmin) {
          await supabase.from('notifications').insert([
            {
              user_id: currentUserId,
              message: `Invoice has been assigned to ${assignee.name}`,
              type: 'success',
              read: false,
              data: { invoiceId, invoiceNumber: updatedInvoice.invoiceNumber, assigneeName: assignee.name },
              timestamp: new Date().toISOString()
            }
          ]);
        }
        // Always trigger in-app notification for the assignee if they are the current user
        if (assigneeId === currentUserId) {
          addNotification(`You have been assigned a new invoice: ${updatedInvoice.invoiceNumber}`, 'info', {
            invoiceId,
            invoiceNumber: updatedInvoice.invoiceNumber
          });
        }
        // Show a success notification to the admin
        if (isCurrentUserAdmin) {
          addNotification(`Invoice has been assigned to ${assignee.name}`, 'success', {
            invoiceId,
            invoiceNumber: updatedInvoice.invoiceNumber,
            assigneeName: assignee.name
          });
        } else {
          addNotification('Invoice assigned successfully!', 'success');
        }
      }
    }
    window.dispatchEvent(new Event('invoicesUpdated'));
  };
  
  // Function to get assignee name from ID
  const getAssigneeName = (assigneeId) => {
    if (!assigneeId) return 'Unassigned';
    const assignee = users.find(user => user.id === assigneeId);
    return assignee ? assignee.name : 'Unknown User';
  };
  
  // Function to sort invoices
  const sortInvoices = (invoices) => {
    return [...invoices].sort((a, b) => {
      let comparison = 0;
      
      // Extract the values to compare based on the sort field
      let aValue, bValue;
      switch (sortField) {
        case 'date':
          aValue = new Date(a.invoiceDate);
          bValue = new Date(b.invoiceDate);
          break;
        case 'name':
          aValue = a.senderName;
          bValue = b.senderName;
          break;
        case 'amount':
          aValue = a.totalUSD;
          bValue = b.totalUSD;
          break;
        case 'status':
          aValue = a.status || 'Pending';
          bValue = b.status || 'Pending';
          break;
        default:
          aValue = a.timestamp || 0;
          bValue = b.timestamp || 0;
      }
      
      // Compare the values
      if (aValue < bValue) {
        comparison = -1;
      } else if (aValue > bValue) {
        comparison = 1;
      }
      
      // Reverse for descending order
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };
  
  // Effect to sync user avatar from users array
  useEffect(() => {
    // Find current user in users array to get the latest avatar
    const loggedInUserId = localStorage.getItem('userId');
    if (loggedInUserId) {
      const currentUser = users.find(user => user.id === loggedInUserId);
      if (currentUser && currentUser.avatar) {
        // Update local state and localStorage if needed
        setUserAvatar(currentUser.avatar);
        if (currentUser.avatar !== localStorage.getItem('userAvatar')) {
          localStorage.setItem('userAvatar', currentUser.avatar);
        }
      } else {
        setUserAvatar('');
        localStorage.removeItem('userAvatar');
      }
    }

    // Listen for profile updates
    const handleUserUpdated = () => {
      const updatedUsers = JSON.parse(localStorage.getItem('users')) || [];
      const loggedInUserId = localStorage.getItem('userId');
      const updatedUser = updatedUsers.find(user => user.id === loggedInUserId);
      if (updatedUser && updatedUser.avatar) {
        setUserAvatar(updatedUser.avatar);
      } else {
        setUserAvatar('');
      }
    };

    window.addEventListener('userUpdated', handleUserUpdated);

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdated);
    };
  }, [users]);

  // Effect to update avatar/profile info when userId changes (e.g., after login/logout)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'userId') {
        const newUserId = e.newValue;
        const updatedUsers = JSON.parse(localStorage.getItem('users')) || [];
        const updatedUser = updatedUsers.find(user => user.id === newUserId);
        if (updatedUser && updatedUser.avatar) {
          setUserAvatar(updatedUser.avatar);
          localStorage.setItem('userAvatar', updatedUser.avatar);
        } else {
          setUserAvatar('');
          localStorage.removeItem('userAvatar');
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // --- FILTER COMPANIES AND CLIENTS FOR NON-ADMIN USERS ---
  // For non-admins, only show companies assigned/created and clients with their invoices
  let filteredCompanies = companies;
  let filteredClients = clients;
  if (!isCurrentUserAdmin) {
    // Companies: Only those where the user is the creator or has an assigned invoice
    const userCompanyIds = new Set();
    // 1. Companies where user is the creator (has a 'createdBy' field matching userId)
    companies.forEach(company => {
      if (company.createdBy === currentUserId) userCompanyIds.add(company.id);
    });
    // 2. Companies where user is assigned an invoice
    savedInvoices.forEach(inv => {
      if (inv.assigneeId === currentUserId && inv.companyId) userCompanyIds.add(inv.companyId);
    });
    filteredCompanies = companies.filter(company => userCompanyIds.has(company.id));

    // Clients: Only those that have at least one invoice assigned/created by this user
    const userClientNames = new Set();
    savedInvoices.forEach(inv => {
      if (inv.assigneeId === currentUserId && inv.recipientName) userClientNames.add(inv.recipientName);
    });
    filteredClients = clients.filter(client => userClientNames.has(client.name));
  }

  // Sync invoice statuses with savedInvoices when they change
  useEffect(() => {
    // Update the invoiceStatuses state with status from each invoice
    if (savedInvoices && savedInvoices.length > 0) {
      setInvoiceStatuses(prevStatuses => {
        const newStatuses = { ...prevStatuses };
        
        // Add/update statuses from savedInvoices
        savedInvoices.forEach(invoice => {
          if (invoice.status) {
            newStatuses[invoice.id] = invoice.status;
          }
        });
        
        return newStatuses;
      });
    }
  }, [savedInvoices]);

  // Listen for invoice bin/restore updates and refresh invoices
  useEffect(() => {
    const refreshInvoices = async () => {
      const { data: invoices } = await supabase.from('invoices').select('*').is('deletedAt', null);
      setSavedInvoices(invoices || []);
    };
    const handler = () => refreshInvoices();
    window.addEventListener('invoicesUpdated', handler);
    return () => window.removeEventListener('invoicesUpdated', handler);
  }, []);
  
  return (
    <div className="dashboard-container">
      {/* Mobile sidebar toggle button */}
      <button
        className="sidebar-toggle-btn"
        onClick={() => setSidebarOpen(prev => !prev)}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        <FiMenu size={28} />
      </button>
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}
      {/* Sidebar with company list */}
      <aside className={`dashboard-sidebar${sidebarOpen ? ' open' : ''}`}>
        {/* Removed sidebar-close-btn ("X") button */}
        <div className="company-logo-container">
          <img src="/images/c-logo.png" alt="ML Finance Solutions Invoice" className="main-company-logo" />
          <div className="sidebar-title">
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '2px', color: 'var(--sidebar-text)' }}>ML Finance Invoice</h3>
            <p style={{ fontSize: '12px', fontWeight: '400', margin: 0, color: 'var(--light-text)', opacity: 0.8 }}>Invoice Automation</p>
          </div>
        </div>
        
        <div className="company-list">
          {/* Sidebar for admin: Show All Invoices, Companies, Invoicing Associates, Clients */}
          {isCurrentUserAdmin ? (
            <>
              <div 
                className={`company-item ${showAllInvoices ? 'active' : ''}`}
                onClick={handleShowAllInvoices}
              >
                <FiUser className="company-icon" />
                <span className="company-name" style={{ fontSize: '18px', color: 'white' }}>Show All Invoices</span>
              </div>
              {/* Companies list */}
              {companies.map((company) => (
                <div 
                  key={company.id}
                  className={`company-item ${selectedCompany?.id === company.id && !showAllInvoices && !selectedAssignee ? 'active' : ''}`}
                  onClick={() => handleCompanySelect(company)}
                >
                  <img src={company.logo} alt={company.name} className="company-icon" />
                  <span className="company-name" style={{ fontSize: '18px', color: 'white' }}>{company.name}</span>
                </div>
              ))}
              {/* Clients section header */}
              <div className="section-title" style={{ 
                padding: '10px', 
                fontSize: '12px', 
                color: 'var(--light-text)', 
                fontWeight: 'bold',
                marginTop: '15px' 
              }}>
                CLIENTS
              </div>
              {/* Clients list */}
              {clients.map((client) => (
                <div 
                  key={client.id}
                  className={`company-item ${selectedClient?.id === client.id ? 'active' : ''}`}
                  onClick={() => handleClientSelect(client)}
                >
                  <FiUser className="company-icon" />
                  <span className="company-name" style={{ fontSize: '18px', color: 'white' }}>{client.name}</span>
                </div>
              ))}
              {clients.length === 0 && (
                <div style={{ padding: '5px 15px', fontSize: '14px', color: 'var(--light-text)', opacity: 0.7 }}>
                  No clients added yet
                </div>
              )}
              {/* Add New Client button */}
              <div 
                className="company-item"
                style={{ marginTop: '10px', color: 'var(--light-text)' }}
                onClick={() => navigate('/client')}
              >
                <FiPlus className="company-icon" />
                <span className="company-name" style={{ fontSize: '18px', color: 'white' }}>Add New Client</span>
              </div>
              {/* Add Descriptions button */}
              <div 
                className="company-item"
                style={{ marginTop: '10px', color: 'var(--light-text)' }}
                onClick={() => navigate('/description')}
              >
                <FiList className="company-icon" />
                <span className="company-name" style={{ fontSize: '18px', color: 'white' }}>Add Descriptions</span>
              </div>
              {/* Deleted Invoices Bin */}
              <div 
                className="company-item"
                style={{ marginTop: '20px', color: 'var(--light-text)' }}
                onClick={() => navigate('/bin')}
              >
                <FiArchive className="company-icon" />
                <span className="company-name" style={{ fontSize: '18px', color: 'white' }}>Recently Deleted</span>
              </div>
              {/* Invoicing Associates section header */}
              <div className="section-title" style={{ 
                padding: '10px', 
                fontSize: '12px', 
                color: 'var(--light-text)', 
                fontWeight: 'bold',
                marginTop: '20px' 
              }}>
                INVOICING ASSOCIATES
              </div>
              {/* All non-admin users */}
              {users
                .filter(user => user.role !== 'admin')
                .map((user) => (
                <div 
                  key={user.id}
                  className={`company-item ${selectedAssignee === user.id ? 'active' : ''}`}
                  onClick={() => handleAssigneeSelect(user.id)}
                >
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      style={{ 
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        marginRight: '10px'
                      }}
                    />
                  ) : (
                    <div className="avatar-small" style={{ 
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: user.id === currentUserId ? 'var(--primary-color)' : 'var(--secondary-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      marginRight: '10px'
                    }}>
                      {user.name[0].toUpperCase()}
                    </div>
                  )}
                  <span className="company-name" style={{ fontSize: '18px', color: 'white' }}>
                    {user.name} {user.id === currentUserId && '(You)'}
                  </span>
                </div>
              ))}
            </>
          ) : (
            // Sidebar for non-admin: Only current user tab above clients, no show all, no associates
            <>
              {/* Only current user tab */}
              <div 
                className={`company-item ${selectedAssignee === currentUserId ? 'active' : ''}`}
                style={{ marginBottom: '10px' }}
                onClick={() => handleAssigneeSelect(currentUserId)}
              >
                {currentUser?.avatar ? (
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    style={{ 
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginRight: '10px'
                    }}
                  />
                ) : (
                  <div className="avatar-small" style={{ 
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--dark-text)',
                    fontWeight: 'bold'
                  }}>
                    {currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className="company-name" style={{ fontSize: '18px', color: 'white' }}>
                  {currentUser?.name} (You)
                </span>
              </div>
              {/* Companies section header (if any companies) */}
              {filteredCompanies.length > 0 && (
                <div className="section-title" style={{
                  padding: '10px',
                  fontSize: '12px',
                  color: 'var(--light-text)',
                  fontWeight: 'bold',
                  marginTop: '0px'
                }}>
                  COMPANIES
                </div>
              )}
              {/* Companies list for this user */}
              {filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  className={`company-item ${selectedCompany?.id === company.id && !showAllInvoices && !selectedAssignee ? 'active' : ''}`}
                  onClick={() => handleCompanySelect(company)}
                >
                  <img src={company.logo} alt={company.name} className="company-icon" />
                  <span className="company-name" style={{ fontSize: '18px', color: 'white' }}>{company.name}</span>
                </div>
              ))}
              {/* Clients section header */}
              <div className="section-title" style={{
                padding: '10px',
                fontSize: '12px',
                color: 'var(--light-text)',
                fontWeight: 'bold',
                marginTop: filteredCompanies.length > 0 ? '10px' : '0px'
              }}>
                CLIENTS
              </div>
              {/* Clients list for this user */}
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className={`company-item ${selectedClient?.id === client.id ? 'active' : ''}`}
                  onClick={() => handleClientSelect(client)}
                >
                  <FiUser className="company-icon" />
                  <span className="company-name" style={{ fontSize: '18px', color: 'white' }}>{client.name}</span>
                </div>
              ))}
              {filteredClients.length === 0 && (
                <div style={{ padding: '5px 15px', fontSize: '14px', color: 'var(--light-text)', opacity: 0.7 }}>
                  No clients added yet
                </div>
              )}
              {/* Add New Client button */}
              <div
                className="company-item"
                style={{ marginTop: '10px', color: 'var(--light-text)' }}
                onClick={() => navigate('/client')}
              >
                <FiPlus className="company-icon" />
                <span className="company-name" style={{ fontSize: '18px', color: 'white' }}>Add New Client</span>
              </div>
              {/* Add Descriptions button */}
              <div
                className="company-item"
                style={{ marginTop: '10px', color: 'var(--light-text)' }}
                onClick={() => navigate('/description')}
              >
                <FiList className="company-icon" />
                <span className="company-name" style={{ fontSize: '18px', color: 'white' }}>Add Descriptions</span>
              </div>
              {/* Deleted Invoices Bin */}
              <div
                className="company-item"
                style={{ marginTop: '20px', color: 'var(--light-text)' }}
                onClick={() => navigate('/bin')}
              >
                <FiArchive className="company-icon" />
                <span className="company-name" style={{ fontSize: '18px', color: 'white' }}>Recently Deleted</span>
              </div>
            </>
          )}
        </div>
        
        <div className="sidebar-footer">
          <button onClick={onLogout} className="btn-logout" title="Logout">
            <FiLogOut style={{ marginRight: '5px' }} /> Logout
          </button>
        </div>
      </aside>
      
      {/* Top navigation bar */}
      <div className="dashboard-topbar" style={{
        gridArea: 'topbar',
        padding: '27.5px 25px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--card-bg)'
      }}>
        {/* Keep search bar at the start */}
        <div className="search-container" style={{ maxWidth: 350, flex: 1 }}>
          <FiSearch className="search-icon" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: darkMode ? '#bfc7d5' : '#888',
            pointerEvents: 'none',
            fontSize: '18px'
          }} />
          <input 
            type="text" 
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 32px 8px 36px',
              borderRadius: '20px',
              border: darkMode ? '1px solid #3a4252' : '1px solid var(--border-color)',
              background: darkMode ? '#232a36' : 'var(--input-bg, #f7f7f7)',
              color: darkMode ? '#f5f7fa' : 'var(--text-color)',
              fontSize: '15px',
              outline: 'none',
              boxShadow: darkMode ? '0 1px 4px 0 rgba(0,0,0,0.25)' : 'none',
              transition: 'border 0.2s, background 0.2s, color 0.2s',
              '::placeholder': {
                color: darkMode ? '#bfc7d5' : '#888',
                opacity: 1
              }
            }}
          />
        </div>
        {/* Spacer to push actions to the right */}
        <div style={{ flex: 1 }} />
        {/* Actions: Bell, theme switch, profile */}
        <div className="user-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <NotificationBell />
          <div className="theme-switch-wrapper">
            <label className="theme-switch">
              <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
              <span className="slider">
                <span className="sun-icon"><FiSun /></span>
                <span className="moon-icon"><FiMoon /></span>
              </span>
            </label>
          </div>
          <div className="user-profile" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            cursor: 'pointer'
          }} onClick={() => navigate('/profile')}>
            {userAvatar ? (
              <img 
                src={userAvatar} 
                alt="Profile" 
                className="header-avatar"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div className="avatar" style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--dark-text)',
                fontWeight: 'bold'
              }}>
                {(localStorage.getItem('userName') || 'U')[0].toUpperCase()}
              </div>
            )}
            <span>{currentUser?.name || (localStorage.getItem('userName') || 'User')}</span>
            {isAdmin && <span className="admin-badge" style={{
              fontSize: '10px',
              padding: '2px 5px',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              borderRadius: '10px',
              marginLeft: '5px'
            }}>Admin</span>}
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <main className="dashboard-main">
        <header className="dashboard-header">          <h2>
            {isInitialLoading 
              ? (isAdmin ? 'Invoice Tracker' : 'Your Invoices')
              : (selectedAssignee
                ? (isAdmin ? `Invoices Assigned to ${getAssigneeName(selectedAssignee)}` : 'Your Invoices')
                : (showAllInvoices 
                  ? (isAdmin ? 'Invoice Tracker' : 'Your Invoices')
                  : selectedCompany 
                    ? `${selectedCompany.name} Invoices` 
                    : selectedClient 
                      ? `${selectedClient.name} Invoices`
                      : 'Invoices'))}
          </h2>
          <div className="dashboard-controls">
            {/* Sort dropdown */}
            <div className="sort-container" style={{ position: 'relative' }}>
              <button 
                className="btn-sort" 
                onClick={toggleSortOptions}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '40px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: 'var(--text-color)'
                }}
              >
                {getSortLabel()} <FiChevronDown />
              </button>
              
              {showSortOptions && (
                <div 
                  className="sort-options" 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    width: '200px',
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    zIndex: 10,
                    marginTop: '5px'
                  }}
                >
                  <div className="sort-option-group" style={{ padding: '10px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Sort by:</div>
                    {['date', 'name', 'amount', 'status'].map(field => (
                      <div 
                        key={field}
                        className={`sort-option ${sortField === field ? 'active' : ''}`}
                        onClick={() => handleSortChange(field)}
                        style={{
                          padding: '8px 10px',
                          cursor: 'pointer',
                          backgroundColor: sortField === field ? 'var(--primary-color-light)' : 'transparent',
                          borderRadius: '4px',
                          margin: '2px 0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          color: 'var(--text-color)'
                        }}
                      >
                        <span>{field === 'date' ? 'Date' : 
                               field === 'name' ? 'Company Name' : 
                               field === 'amount' ? 'Amount' : 'Status'}</span>
                        {sortField === field && (
                          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="sort-direction-group" style={{ padding: '10px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Direction:</div>
                    <div 
                      className={`sort-option ${sortDirection === 'asc' ? 'active' : ''}`}
                      onClick={() => setSortDirection('asc')}
                      style={{
                        padding: '8px 10px',
                        cursor: 'pointer',
                        backgroundColor: sortDirection === 'asc' ? 'var(--primary-color-light)' : 'transparent',
                        borderRadius: '4px',
                        margin: '2px 0',
                        color: 'var(--text-color)'
                      }}
                    >
                      Ascending (A-Z, 0-9)
                    </div>
                    <div 
                      className={`sort-option ${sortDirection === 'desc' ? 'active' : ''}`}
                      onClick={() => setSortDirection('desc')}
                      style={{
                        padding: '8px 10px',
                        cursor: 'pointer',
                        backgroundColor: sortDirection === 'desc' ? 'var(--primary-color-light)' : 'transparent',
                        borderRadius: '4px',
                        margin: '2px 0',
                        color: 'var(--text-color)'
                      }}
                    >
                      Descending (Z-A, 9-0)
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button className="btn-create" onClick={handleCreateInvoice}>
              Create New Invoice
            </button>
            <button 
              className="btn-create" 
              onClick={() => setShowDownloadModal(true)}
              disabled={isDownloading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <FiDownload />
              {isDownloading ? `Downloading (${downloadProgress.current}/${downloadProgress.total})` : 'Download All'}
            </button>
          </div>
        </header>
        
        {/* Invoice List */}
        {/* Download progress indicator */}
        {isDownloading && (
          <div className="download-progress-container" style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: 'var(--card-bg)',
            borderRadius: '8px',
            boxShadow: 'var(--card-shadow)',
          }}>
            <h3 style={{ marginTop: '0', marginBottom: '10px' }}>Downloading Invoices...</h3>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              marginBottom: '10px' 
            }}>
              <div style={{ 
                width: '100%', 
                height: '10px', 
                backgroundColor: 'var(--border-color)', 
                borderRadius: '5px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${(downloadProgress.current / downloadProgress.total) * 100}%`, 
                  height: '100%', 
                  backgroundColor: 'var(--primary-color)',
                  borderRadius: '5px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <span style={{ marginLeft: '10px', whiteSpace: 'nowrap' }}>
                {downloadProgress.current}/{downloadProgress.total}
              </span>
            </div>
            <p style={{ margin: '0', fontSize: '14px' }}>{downloadStatus}</p>
          </div>
        )}
          <div className="invoice-list" style={{ width: '100%' }}>
          {isInitialLoading ? (
            // Loading skeleton
            <div className="loading-skeleton">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="invoice-card-skeleton" style={{
                  background: darkMode ? '#232a36' : '#f8f9fa',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '16px',
                  boxShadow: darkMode ? '0 1px 4px #10131a33' : '0 1px 4px #e0e7ef33',
                  border: darkMode ? '1px solid #3a4252' : '1px solid #e5e7eb',
                  animation: 'pulse 1.5s ease-in-out infinite alternate'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      height: '20px',
                      width: '120px',
                      background: darkMode ? '#3a4252' : '#e5e7eb',
                      borderRadius: '4px'
                    }} />
                    <div style={{
                      height: '24px',
                      width: '80px',
                      background: darkMode ? '#3a4252' : '#e5e7eb',
                      borderRadius: '12px'
                    }} />
                  </div>
                  <div style={{
                    height: '16px',
                    width: '200px',
                    background: darkMode ? '#3a4252' : '#e5e7eb',
                    borderRadius: '4px',
                    marginBottom: '8px'
                  }} />
                  <div style={{
                    height: '16px',
                    width: '100px',
                    background: darkMode ? '#3a4252' : '#e5e7eb',
                    borderRadius: '4px'
                  }} />
                </div>
              ))}
            </div>
          ) : savedInvoices.length > 0 ? (
            sortInvoices(savedInvoices)
              .filter(invoice => {
                // If a company is selected, only show invoices for that company
                if (!showAllInvoices && selectedCompany && !selectedAssignee && !selectedClient) {
                  // Check if the companyId is missing or doesn't match
                  if (!invoice.companyId || invoice.companyId !== selectedCompany.id) {
                    // As a fallback, also check if the company name matches
                    if (invoice.senderName !== selectedCompany.name) {
                      return false;
                    }
                  }
                }
                
                // If a client is selected, only show invoices for that client
                if (!showAllInvoices && selectedClient && !selectedAssignee && !selectedCompany) {
                  // Filter by client name
                  if (invoice.recipientName !== selectedClient.name) {
                    return false;
                  }
                }
                
                // If an assignee is selected, only show invoices assigned to them
                if (selectedAssignee) {
                  if (invoice.assigneeId !== selectedAssignee) {
                    return false;
                  }
                }
                
                // Filter by search term if provided
                if (searchTerm && 
                    !invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) &&
                    !invoice.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
                    !invoice.recipientName?.toLowerCase().includes(searchTerm.toLowerCase())) {
                  return false;
                }
                
                return true;
              })
              .map((invoice, index) => {
                // Find company info for this invoice
                const invoiceCompany = companies.find(c => c.id === invoice.companyId) || {
                  name: invoice.senderName,
                  logo: invoice.logoUrl || defaultLogo
                };
                
                // Format the invoice date for display
                const invoiceDate = new Date(invoice.invoiceDate);
                  // Get status for this invoice - prioritize the status stored in the invoice object itself
                // If not found, check invoiceStatuses, and finally default to 'Pending'
                const invoiceStatus = invoice.status || invoiceStatuses[invoice.id] || 'Pending';
                
                // Check if current user can access this invoice (admin or assigned user)
                const canAccessInvoice = isAdmin || invoice.assigneeId === currentUserId;
                
                return (
                  <div 
                    key={index} 
                    className={`invoice-card ${!canAccessInvoice ? 'disabled-invoice' : ''}`} 
                    onClick={() => {
                      if (canAccessInvoice) {
                        navigate(`/invoice/${invoice.id}`);
                      } else {
                        alert("You don't have permission to view this invoice. Only the assigned client can access it.");
                      }
                    }}
                    style={!canAccessInvoice ? { opacity: '0.7', cursor: 'not-allowed' } : {}}
                  >
                    <div className="invoice-card-header">
                      <img 
                        src={invoiceCompany.logo} 
                        alt={invoiceCompany.name} 
                        className="invoice-company-logo"
                      />
                      <div className="invoice-info">
                        <span className="invoice-number">{invoice.invoiceNumber}</span>
                        <span className="invoice-company">{invoiceCompany.name || 'No Company'}</span>
                        {!canAccessInvoice && (
                          <span className="access-restricted" style={{
                            fontSize: '11px',
                            color: 'var(--danger-color, #f44336)',
                            fontWeight: 'bold',
                            display: 'block',
                            marginTop: '3px'
                          }}>
                            Access Restricted
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="invoice-card-details">
                      <div className="invoice-amount">
                        <span className="amount">${invoice.totalUSD.toLocaleString()}</span>
                        <span className="currency">{invoice.currency}</span>
                      </div>
                      <div className="invoice-date">
                        <span className="label">Date:</span>
                        <span className="value">{invoiceDate.toLocaleDateString()}</span>
                      </div>
                      <div className="invoice-status">
                        <span 
                          className={`status ${!invoice.assigneeId ? 'draft' : invoiceStatus.toLowerCase()}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            // If invoice is not assigned, it should stay as draft and cannot be changed
                            if (!invoice.assigneeId) {
                              alert("This invoice needs to be assigned to a client before the status can be changed.");
                              return;
                            }
                            // Only the assigned client can change status
                            if (invoice.assigneeId === currentUserId) {
                              toggleInvoiceStatus(e, invoice.id);
                            } else {
                              // Show error message if user is not the assignee
                              alert(`Only ${getAssigneeName(invoice.assigneeId)} can change the status of this invoice.`);
                            }
                          }}
                          style={{ 
                            cursor: invoice.assigneeId === currentUserId ? 'pointer' : 'not-allowed', 
                            position: 'relative',
                            backgroundColor: !invoice.assigneeId ? 'var(--info-color, #2196f3)' :
                                            invoiceStatus === 'Paid' ? 'var(--success-color, #4caf50)' : 
                                            invoiceStatus === 'Pending' ? 'var(--warning-color, #ff9800)' :
                                            invoiceStatus === 'Draft' ? 'var(--info-color, #2196f3)' :
                                            invoiceStatus === 'Cancelled' ? 'var(--danger-color, #f44336)' : 'gray'
                          }}
                          title={!invoice.assigneeId ? 
                                 "Invoice must be assigned before status can be changed" : 
                                 invoice.assigneeId === currentUserId ? 
                                 "Click to change status" : 
                                 `Only ${getAssigneeName(invoice.assigneeId)} can change the status`}
                        >
                          {!invoice.assigneeId ? 'Draft' : invoiceStatus}
                        </span>
                      </div>
                    </div>
                    <div className="invoice-assignee-row">
                      <div className="assignee-label">Assigned to:</div>
                      <div className="assignee-select-container">
                        <select 
                          className="assignee-select"
                          value={invoice.assigneeId || ''}
                          onChange={(e) => assignInvoice(e, invoice.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={!isAdmin}
                          style={{
                            cursor: isAdmin ? 'pointer' : 'not-allowed',
                            opacity: isAdmin ? 1 : 0.7
                          }}
                          title={isAdmin ? "Assign to user" : "Only administrators can assign invoices"}
                        >
                          <option value="">Unassigned</option>
                          {users.filter(user => user.role !== 'admin').map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name} {user.id === currentUserId ? '(You)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="dashboard-empty-state" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              maxWidth: 600,
              minWidth: 340,
              minHeight: 420,
              height: 'calc(60vh - 40px)',
              background: darkMode
                ? 'linear-gradient(135deg, #232a36 0%, #181f2a 100%)'
                : 'linear-gradient(135deg, #e3eafc 0%, #f6f8fa 100%)',
              borderRadius: 24,
              boxShadow: darkMode ? '0 4px 24px #10131a33' : '0 4px 24px #e0e7ef33',
              margin: '48px auto',
              gap: 24,
              padding: '64px 40px',
              position: 'relative',
              // Center horizontally
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              {/* Modern minimal illustration (card, lines, dot) */}
              <div style={{
                width: 120,
                height: 60,
                background: darkMode ? '#232a36' : '#f6f8fa', // match the light card background
                borderRadius: 18,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
                position: 'relative',
                boxShadow: darkMode ? '0 2px 8px #10131a33' : '0 2px 8px #e0e7ef33',
              }}>
                <div style={{
                  width: 70,
                  height: 14,
                  background: '#3b82f6',
                  borderRadius: 7,
                  marginBottom: 10,
                  marginTop: 6,
                }} />
                <div style={{
                  width: 40,
                  height: 8,
                  background: darkMode ? '#374151' : '#bfc7d5', // lighter for light mode
                  borderRadius: 4,
                  marginBottom: 10,
                }} />
                <div style={{
                  width: 18,
                  height: 18,
                  background: '#3b82f6',
                  borderRadius: '50%',
                  position: 'absolute',
                  right: 14,
                  bottom: 10,
                  boxShadow: darkMode ? '0 1px 4px #10131a33' : '0 1px 4px #e0e7ef33',
                }} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 26, color: darkMode ? '#fff' : '#232a36', marginBottom: 6, textAlign: 'center' }}>No Invoices Found</div>
              <div style={{ color: darkMode ? '#bfc7d5' : '#6b7280', fontSize: 17, marginBottom: 18, textAlign: 'center', maxWidth: 420 }}>
                Try creating one with create new invoice button
              </div>
              <button className="btn" onClick={handleCreateInvoice} style={{ marginTop: '15px' }}>
                Create Your First Invoice
              </button>
            </div>
          )}
          
          {/* Show message if no invoices match the filter */}
          {savedInvoices.length > 0 && 
           sortInvoices(savedInvoices).filter(invoice => {
              if (selectedAssignee) {
                if (invoice.assigneeId !== selectedAssignee) {
                  return false;
                }
              } else if (!showAllInvoices && selectedCompany) {
                // Check if the companyId is missing or doesn't match
                if (!invoice.companyId || invoice.companyId !== selectedCompany.id) {
                  // As a fallback, also check if the company name matches
                  if (invoice.senderName !== selectedCompany.name) {
                    return false;
                  }
                }
              }
              if (searchTerm && 
                  !invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
                  !invoice.senderName.toLowerCase().includes(searchTerm.toLowerCase()) &&
                  !invoice.recipientName.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
              }
              return true;
            }).length === 0 && (
              <div className="dashboard-empty-state" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                maxWidth: 600,
                minWidth: 340,
                minHeight: 420,
                height: 'calc(60vh - 40px)',
                background: darkMode
                  ? 'linear-gradient(135deg, #232a36 0%, #181f2a 100%)'
                  : 'linear-gradient(135deg, #e3eafc 0%, #f6f8fa 100%)',
                borderRadius: 24,
                boxShadow: darkMode ? '0 4px 24px #10131a33' : '0 4px 24px #e0e7ef33',
                margin: '48px auto',
                gap: 24,
                padding: '64px 40px',
                position: 'relative',
                // Center horizontally
                marginLeft: 'auto',
                marginRight: 'auto',
              }}>
                {/* Modern minimal illustration (card, lines, dot) */}
                <div style={{
                  width: 120,
                  height: 60,
                  background: darkMode ? '#232a36' : '#f6f8fa', // match the light card background
                  borderRadius: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 32,
                  position: 'relative',
                  boxShadow: darkMode ? '0 2px 8px #10131a33' : '0 2px 8px #e0e7ef33',
                }}>
                  <div style={{
                    width: 70,
                    height: 14,
                    background: '#3b82f6',
                    borderRadius: 7,
                    marginBottom: 10,
                    marginTop: 6,
                  }} />
                  <div style={{
                    width: 40,
                    height: 8,
                    background: darkMode ? '#374151' : '#bfc7d5', // lighter for light mode
                    borderRadius: 4,
                    marginBottom: 10,
                  }} />
                  <div style={{
                    width: 18,
                    height: 18,
                    background: '#3b82f6',
                    borderRadius: '50%',
                    position: 'absolute',
                    right: 14,
                    bottom: 10,
                    boxShadow: darkMode ? '0 1px 4px #10131a33' : '0 1px 4px #e0e7ef33',
                  }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: 26, color: darkMode ? '#fff' : '#232a36', marginBottom: 6, textAlign: 'center' }}>No Invoices Found</div>
                <div style={{ color: darkMode ? '#bfc7d5' : '#6b7280', fontSize: 17, marginBottom: 18, textAlign: 'center', maxWidth: 420 }}>
                  Try creating one with create new invoice button
                </div>
                <button className="btn" onClick={handleCreateInvoice} style={{ marginTop: '15px' }}>
                  Create Your First Invoice
                </button>
              </div>
            )
          }
        </div>
        
        {/* Download Options Modal */}
        <Modal

         

          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          title="Download Invoices"
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setShowDownloadModal(false)}>Cancel</button>
              <button
                className="btn"
                onClick={() => {
                  setShowDownloadModal(false);
                  if (downloadOption === 'all') {
                    downloadAllInvoices();
                  } else {
                    downloadAllInvoices({ start: startDate, end: endDate });
                  }
                }}
                disabled={downloadOption === 'range' && (!startDate || !endDate)}
              >
                Download
              </button>
            </>
          }
        >
          <div style={{ marginBottom: '15px' }}>

            <label>
              <input
                type="radio"
                name="downloadOption"
                value="all"
                checked={downloadOption === 'all'}
                onChange={() => setDownloadOption('all')}
              />
              Download All Invoices
            </label>
            <br />
            <label>
              <input
                type="radio"
                name="downloadOption"
                value="range"
                checked={downloadOption === 'range'}
                onChange={() => setDownloadOption('range')}
              />
              Download by Date Range
            </label>
          </div>
          {downloadOption === 'range' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <label>
                Start Date:
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ marginLeft: '5px' }}
                />
              </label>
              <label>
                End Date:
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{ marginLeft: '5px' }}
                />
              </label>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
};

export default DashboardPage;
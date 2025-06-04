import React, { useState, useEffect, useRef } from 'react';
import InvoiceItemsTable from './InvoiceItemsTable';
import emailService from '../services/emailService';
import pdfService from '../services/pdfService';
import exchangeRateService from '../services/exchangeRateService';
import invoiceLogic from '../lib/invoiceLogic';
import { invoiceStore } from '../utils/invoiceStore';
import { useNotification } from '../context/NotificationContext';
import Modal from './Modal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { supabase } from '../config/supabaseClient';

const InvoiceForm = ({ 
  invoiceData, 
  setInvoiceData, 
  handleInputChange, 
  onPreview, 
  onReset,
  onSave,
  onDelete,
  isLoading,
  setIsLoading,
  id,
  isAuthorized = true // Default to true for backward compatibility
}) => {
  // Initialize state and hooks
  const [exchangeRate, setExchangeRate] = useState(82);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const { setNotification } = useNotification();
  const [clients, setClients] = useState([]);
  const isInitialMount = useRef(true); // Ref to track initial mount
  // Track selected clientId for dropdown (controlled component)
  const [selectedClientId, setSelectedClientId] = useState('');

  // Sync selectedClientId with invoiceData.recipientName (for edit mode or after autofill)
  useEffect(() => {
    if (!invoiceData.recipientName) {
      setSelectedClientId('');
      return;
    }
    const found = clients.find(c => c.name === invoiceData.recipientName);
    if (found) setSelectedClientId(found.id.toString());
  }, [invoiceData.recipientName, clients]);

  // Fetch exchange rate on component mount
  useEffect(() => {
    fetchExchangeRate();
  }, []);
  
  // Fetch clients from Supabase on mount
  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase.from('clients').select('*');
      if (!error) setClients(data || []);
    };
    fetchClients();
  }, []);
  
  // Add useEffect to update invoice number prefix when recipient name changes on an existing invoice
  useEffect(() => {
    // Skip this effect on the initial mount or if it's a new invoice
    if (isInitialMount.current || !id || id === 'new') {
      isInitialMount.current = false; // Set to false after first run
      return;
    }
    // Check if recipientName exists and is different from the prefix part of invoiceNumber
    if (invoiceData.recipientName && invoiceData.invoiceNumber) {
      const currentPrefix = invoiceData.invoiceNumber.split('-')[0];
      const newPrefix = invoiceData.recipientName.trim().substring(0, 4).toUpperCase();
      if (currentPrefix !== newPrefix) {
        const updatedInvoiceNumber = invoiceLogic.updateInvoiceNumberPrefix(
          invoiceData.invoiceNumber,
          invoiceData.recipientName
        );
        if (updatedInvoiceNumber !== invoiceData.invoiceNumber) {
          setInvoiceData(prevData => ({
            ...prevData,
            invoiceNumber: updatedInvoiceNumber
          }));
        }
      }
    }
  // Add invoiceData.recipientName and invoiceData.invoiceNumber to dependency array
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceData.recipientName, id, setInvoiceData]);

  // Handle client selection (autofill all fields from Supabase client)
  const handleClientSelect = (e) => {
    const clientId = e.target.value ? String(e.target.value) : null;
    setSelectedClientId(clientId || '');
    if (!clientId) {
      setInvoiceData(prevData => ({
        ...prevData,
        recipientName: '',
        recipientAddress: '',
        recipientPhone: '',
        recipientEmail: '',
        recipientWebsite: '',
        recipientGSTIN: '',
        recipientPAN: '',
        invoiceNumber: invoiceLogic.generateInvoiceNumber('CUST', true) // Reset to default if no client
      }));
      return;
    }
    const selectedClient = clients.find(client => String(client.id) === clientId);
    if (!selectedClient) {
      setNotification('Client not found. Please try again.', 'error');
      setInvoiceData(prevData => ({
        ...prevData,
        recipientName: '',
        recipientAddress: '',
        recipientPhone: '',
        recipientEmail: '',
        recipientWebsite: '',
        recipientGSTIN: '',
        recipientPAN: '',
        invoiceNumber: invoiceLogic.generateInvoiceNumber('CUST', true)
      }));
      return;
    }
    // Force update all fields, even if values are the same, and update invoice number
    setInvoiceData(prevData => ({
      ...prevData,
      recipientName: selectedClient.name || '',
      recipientAddress: selectedClient.address || '',
      recipientPhone: selectedClient.phone || '',
      recipientEmail: selectedClient.email || '',
      recipientWebsite: selectedClient.website || '',
      recipientGSTIN: selectedClient.gstin || '',
      recipientPAN: selectedClient.pan || '',
      invoiceNumber: invoiceLogic.generateInvoiceNumber(selectedClient.name || 'CUST', true)
    }));
  };
  // Generate invoice number with format CUST-YYYYMMDD-XXXX (now using recipientName)
  const generateInvoiceNumber = async () => {
    // Use invoiceStore utility to generate invoice number
    const customerName = invoiceData.recipientName || 'CUST';
    const invoiceNumber = await invoiceStore.generateInvoiceNumber(customerName);
    return invoiceNumber;
  };

  // Fetch current exchange rate using the exchangeRateService
  const fetchExchangeRate = async () => {
    try {
      const rate = await exchangeRateService.fetchExchangeRate();
      setExchangeRate(rate);
      // Recalculate with new exchange rate
      updateCalculationsWithRate(invoiceData.items, rate);
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      // Continue with default exchange rate if API fails
      const defaultRate = exchangeRateService.getCurrentRate();
      setExchangeRate(defaultRate);
    }
  };
  
  const updateCalculationsWithRate = (items, rate) => {
    // REMOVED: Conditional check that skipped recalculation for existing invoices
    // Now, always recalculate regardless of invoice state
    
    // Calculate subtotals with the provided exchange rate
    let subtotalUSD = 0;
    let subtotalINR = 0;
    
    // Create a deep copy of items to avoid reference issues
    const updatedItems = JSON.parse(JSON.stringify(items));
    
    updatedItems.forEach(item => {
      // For backward compatibility - if it's an old format item with direct amounts
      if (item.amountUSD !== undefined) {
        subtotalUSD += parseFloat(item.amountUSD) || 0;
        // Recalculate INR amounts based on new exchange rate
        if (item.amountUSD) {
          item.amountINR = parseFloat(item.amountUSD) * rate;
        }
        subtotalINR += parseFloat(item.amountINR) || 0;
      }
      
      // Add sub-services amounts (standardize on subServices property)
      if (item.subServices && item.subServices.length > 0) {
        item.subServices.forEach(subService => {
          subtotalUSD += parseFloat(subService.amountUSD) || 0;
          if (subService.amountUSD) {
            subService.amountINR = parseFloat(subService.amountUSD) * rate;
          }
          subtotalINR += parseFloat(subService.amountINR) || 0;
        });
      }
    });
    
    // Calculate tax amounts
    const taxRate = parseFloat(invoiceData.taxRate) || 0;
    const taxAmountUSD = (subtotalUSD * taxRate) / 100;
    const taxAmountINR = (subtotalINR * taxRate) / 100;
    
    // Calculate totals
    const totalUSD = subtotalUSD + taxAmountUSD;
    const totalINR = subtotalINR + taxAmountINR;
    
    // Update invoice data
    setInvoiceData(prevData => ({
      ...prevData,
      items: updatedItems,
      subtotalUSD,
      subtotalINR,
      taxAmountUSD,
      taxAmountINR,
      totalUSD,
      totalINR,
      exchangeRate: rate
    }));
  };
  
  // Calculate totals whenever items or tax rate changes
  useEffect(() => {
    // REMOVED: Conditional checks that skipped recalculation for existing invoices
    // Now, always recalculate when items or tax rate change
    updateCalculations(invoiceData.items);
  // Added JSON.stringify(invoiceData.items) to dependencies to correctly detect item changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceData.taxRate, JSON.stringify(invoiceData.items)]); // Ensure items trigger recalculation
  
  const updateCalculations = (newItems) => {
    // Don't skip calculation for existing invoices during editing
    // We need to recalculate when items change
    console.log('Calculating totals for invoice items:', newItems);

    // Calculate subtotals
    let subtotalUSD = 0;
    let subtotalINR = 0;
    
    newItems.forEach(item => {
      // For backward compatibility - if it's an old format item with direct amounts
      if (item.amountUSD !== undefined) {
        subtotalUSD += parseFloat(item.amountUSD) || 0;
        subtotalINR += parseFloat(item.amountINR) || 0;
      }
      
      // Add sub-services amounts (standardize on subServices property)
      if (item.subServices && item.subServices.length > 0) {
        item.subServices.forEach(subService => {
          subtotalUSD += parseFloat(subService.amountUSD) || 0;
          subtotalINR += parseFloat(subService.amountINR) || 0;
        });
      }
    });
    
    // Calculate tax amounts
    const taxRate = parseFloat(invoiceData.taxRate) || 0;
    const taxAmountUSD = (subtotalUSD * taxRate) / 100;
    const taxAmountINR = (subtotalINR * taxRate) / 100;
    
    // Calculate totals
    const totalUSD = subtotalUSD + taxAmountUSD;
    const totalINR = subtotalINR + taxAmountINR;
    
    console.log('Calculated new totals:', {
      subtotalUSD, subtotalINR, totalUSD, totalINR
    });
    
    // Update invoice data
    setInvoiceData(prevData => ({
      ...prevData,
      subtotalUSD,
      subtotalINR,
      taxAmountUSD,
      taxAmountINR,
      totalUSD,
      totalINR
    }));
  };
  
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setNotification('Please upload a valid image file (JPEG, PNG, SVG, or GIF)', 'error');
        return;
      }
      
      // Validate file size (max 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        setNotification('Image file is too large. Please upload an image smaller than 2MB.', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setInvoiceData(prevData => ({
          ...prevData,
          logoUrl: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleCurrencyToggle = (e) => {
    setInvoiceData(prevData => ({
      ...prevData,
      currency: e.target.value
    }));
  };
  
  // Handle exchange rate input change
  const handleExchangeRateChange = (e) => {
    const newRate = parseFloat(e.target.value) || 82;
    setExchangeRate(newRate);
    updateCalculationsWithRate(invoiceData.items, newRate);
  };
  
  // Update website field
  const handleWebsiteChange = (e) => {
    setInvoiceData(prevData => ({
      ...prevData,
      recipientWebsite: e.target.value
    }));
  };
    // Update bank details fields
  const updateBankDetails = (field, value) => {
    // Handle accountName field differently to avoid schema cache issues
    if (field === 'accountName') {
      // Use a nested structure to avoid direct access to accountName column
      setInvoiceData(prevData => {
        // Create a bankDetails object if it doesn't exist
        const bankDetails = prevData.bankDetails || {};
        
        return {
          ...prevData,
          // Store accountName in bankDetails JSON field
          bankDetails: {
            ...bankDetails,
            accountName: value
          },
          // Keep the direct field too for backward compatibility with UI
          [field]: value
        };
      });
    } else {
      // Handle other bank fields normally
      setInvoiceData(prevData => ({
        ...prevData,
        [field]: value
      }));
    }
  };
  
  // Add comprehensive form validation
  const validateForm = () => {
    // Required fields
    const requiredFields = {
      'Invoice Number': invoiceData.invoiceNumber,
      'Invoice Date': invoiceData.invoiceDate,
      'Company Name': invoiceData.senderName,
      'Client Name': invoiceData.recipientName
    };
    
    // Check required fields
    for (const [fieldName, value] of Object.entries(requiredFields)) {
      if (!value || value.trim() === '') {
        setNotification(`${fieldName} is required.`, 'error');
        return false;
      }
    }
    
    // Validate email if provided
    if (invoiceData.recipientEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(invoiceData.recipientEmail)) {
        setNotification('Please enter a valid email address.', 'error');
        return false;
      }
    }
    
    // Ensure there's at least one invoice item
    if (invoiceData.items.length === 0) {
      setNotification('Please add at least one item to the invoice.', 'error');
      return false;
    }
    
    // Check if any item has a description but no amount
    const invalidItems = invoiceData.items.filter(
      item => item.description && item.description.trim() !== '' && 
      ((!item.amountUSD || parseFloat(item.amountUSD) === 0) && 
       (!item.amountINR || parseFloat(item.amountINR) === 0))
    );
    
    if (invalidItems.length > 0) {
      setNotification('All items must have an amount in USD or INR.', 'error');
      return false;
    }
    
    return true;
  };
  
  const waitForElementToRender = async (elementId, maxAttempts = 10, interval = 300) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      
      const checkElement = () => {
        attempts++;
        const element = document.getElementById(elementId);
        
        if (element) {
          // Element found, wait a bit more for it to fully render
          setTimeout(() => resolve(element), 500);
        } else if (attempts < maxAttempts) {
          // Element not found yet, try again
          setTimeout(checkElement, interval);
        } else {
          // Max attempts reached, element not found
          reject(new Error(`Element with ID ${elementId} not found after ${maxAttempts} attempts`));
        }
      };
      
      checkElement();
    });
  };
  
  const sendInvoice = async () => {
    // Validate form before sending
    if (!validateForm()) {
      return;
    }
    
    // Additional validation for email which is required for sending
    if (!invoiceData.recipientEmail) {
      setNotification('Please enter the recipient\'s email address.', 'error');
      return;
    }
    
    // Show loading indicator
    setIsLoading(true);
    
    try {
      // First ensure we're in preview mode
      onPreview();
      
      try {
        // Wait for the preview element to be ready
        const previewElement = await waitForElementToRender('invoicePreviewContent');
        
        const canvas = await html2canvas(previewElement, {
          scale: 2,
          useCORS: true,
          scrollY: 0,
        });
        
        // Convert to base64 for email attachment
        const imgData = canvas.toDataURL('image/png');
        
        const emailParams = {
          to_email: invoiceData.recipientEmail,
          subject: `Invoice - ${invoiceData.invoiceNumber}`,
          message: `Please find attached the invoice ${invoiceData.invoiceNumber} from ${invoiceData.senderName || 'Your Company'}.`,
          attachment: imgData
        };
        
        // Use emailService instead of direct emailjs calls
        await emailService.sendInvoice(emailParams);
        
        setIsLoading(false);
        setNotification('Invoice sent successfully!', 'success');
      } catch (error) {
        console.error('Error sending email:', error);
        setIsLoading(false);
        setNotification('Failed to send the invoice: ' + error.message, 'error');
      }
    } catch (error) {
      console.error('Error preparing preview for email:', error);
      setIsLoading(false);
      setNotification('Failed to prepare the invoice for sending: ' + error.message, 'error');
    }
  };
  
  const downloadPDF = async () => {
    // Validate form before downloading
    if (!validateForm()) {
      return;
    }
    
    // Show loading indicator
    setIsLoading(true);
    
    try {
      // First ensure we're in preview mode
      onPreview();
      
      try {
        // Wait for the preview element to be ready
        const previewElement = await waitForElementToRender('invoicePreviewContent');
        
        // Use html2canvas to capture the invoice as an image
        const canvas = await html2canvas(previewElement, {
          scale: 2,
          useCORS: true,
          scrollY: 0,
          windowWidth: 794, // A4 width in px (about)
          windowHeight: 1123, // A4 height in px (about)
          logging: true, // Enable logging for debugging
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        
        // Convert canvas to image data
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        // Create new PDF document
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // Get PDF dimensions
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const ratio = canvas.width / canvas.height;
        const imgWidth = pdfWidth;
        const imgHeight = imgWidth / ratio;
        
        // Add the image to the PDF
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        
        // Save the PDF with the invoice number in the filename
        pdf.save(`Invoice_${invoiceData.invoiceNumber}.pdf`);
        
        setIsLoading(false);
        setNotification('PDF downloaded successfully!', 'success');
      } catch (error) {
        console.error('Failed to generate PDF:', error);
        setIsLoading(false);
        setNotification('Failed to generate PDF: ' + error.message, 'error');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsLoading(false);
      setNotification('Failed to generate PDF: ' + error.message, 'error');
    }
  };

  // Handle company name selection
  const handleCompanyNameChange = (e) => {
    const newCompanyName = e.target.value;
    // Update company name
    setInvoiceData(prevData => ({
      ...prevData,
      senderName: newCompanyName
      // The useEffect above will handle updating the invoice number
    }));
  };

  // Handle company address selection
  const handleCompanyAddressChange = (e) => {
    // Update company address
    setInvoiceData(prevData => ({
      ...prevData,
      senderAddress: e.target.value
    }));
  };

  return (
    <div className="invoice-form modern-invoice-form" style={{ maxWidth: 820, margin: '32px auto', background: 'var(--card-bg)', borderRadius: 18, boxShadow: '0 6px 32px rgba(59,130,246,0.08)', padding: '32px 28px', fontFamily: 'Poppins, Inter, Arial, sans-serif', border: '1px solid var(--border-color)' }}>
      {!isAuthorized && (
        <div className="authorization-warning" style={{
          backgroundColor: '#ffecec',
          color: '#d8000c',
          padding: '10px 15px',
          marginBottom: '20px',
          borderRadius: '8px',
          border: '1.5px solid #d8000c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 500
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '8px' }}>
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
          <span>You don't have permission to edit this invoice. Only the assigned client can make changes.</span>
        </div>
      )}
      {/* Top Header - Company Information */}
      <div className="form-section invoice-card-section" style={{ marginBottom: 32, background: 'var(--secondary-color)', borderRadius: 14, boxShadow: '0 2px 12px rgba(59,130,246,0.04)', padding: '24px 20px', border: '1px solid var(--border-color)' }}>
        <h2 className="section-title" style={{ fontSize: 22, color: 'var(--primary-color)', fontWeight: 700, letterSpacing: 1, marginBottom: 18, borderLeft: '4px solid var(--primary-color)', paddingLeft: 12 }}>Company Information</h2>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="companyLogo">Company Logo</label>
            <input 
              type="file" 
              id="companyLogo" 
              accept="image/*" 
              onChange={handleLogoUpload} 
              disabled={!isAuthorized}
            />
            {invoiceData.logoUrl && (
              <div style={{ marginTop: '10px' }}>
                <img 
                  src={invoiceData.logoUrl} 
                  alt="Company Logo" 
                  style={{ maxWidth: '200px', maxHeight: '100px' }} 
                />
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="senderName">Company Name *</label>
            <select 
              id="senderName" 
              name="senderName" 
              value={invoiceData.senderName} 
              onChange={handleCompanyNameChange} 
              required
              disabled={!isAuthorized}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">Select Company</option>
              <option value="BCDE Solutions LLP">BCDE Solutions LLP</option>
              <option value="ABC Solutions LLP">ABC Solutions LLP</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="senderAddress">Company Address</label>
            <select
              id="senderAddress"
              name="senderAddress"
              value={invoiceData.senderAddress}
              onChange={handleCompanyAddressChange}
              disabled={!isAuthorized}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">Select Address</option>
              <option value="K No 1117.88 SY No 022/1 Belathur Village Kadugodi Bangalore, Karnataka, India - 560067">K No 1117.88 SY No 022/1 Belathur Village Kadugodi Bangalore, Karnataka, India - 560067</option>
              <option value="3702 Sandy Vista Ln, Castle Rock, CO 80104">3702 Sandy Vista Ln, Castle Rock, CO 80104</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="senderGSTIN">Company GSTIN</label>
            <input 
              type="text" 
              id="senderGSTIN" 
              name="senderGSTIN" 
              value="29AEFFS0261N1ZN"
              onChange={(e) => {
                // Keep the value fixed even if user tries to change it
                e.target.value = "29AEFFS0261N1ZN";
              }}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="invoiceNumber">Invoice Number *</label>
            <input 
              type="text" 
              id="invoiceNumber" 
              name="invoiceNumber" 
              value={invoiceData.invoiceNumber} 
              onChange={handleInputChange} 
              required
              disabled={!isAuthorized}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="invoiceDate">Invoice Date *</label>
            <input 
              type="date" 
              id="invoiceDate" 
              name="invoiceDate" 
              value={invoiceData.invoiceDate} 
              onChange={handleInputChange} 
              required
              disabled={!isAuthorized}
            />
          </div>
        </div>
      </div>
      
      {/* Customer (Bill To) Information Section */}
      <div className="form-section invoice-card-section" style={{ marginBottom: 32, background: 'var(--secondary-color)', borderRadius: 14, boxShadow: '0 2px 12px rgba(59,130,246,0.04)', padding: '24px 20px', border: '1px solid var(--border-color)' }}>
        <h2 className="section-title" style={{ fontSize: 22, color: 'var(--primary-color)', fontWeight: 700, letterSpacing: 1, marginBottom: 18, borderLeft: '4px solid var(--primary-color)', paddingLeft: 12 }}>Bill To</h2>
        
        {/* Add client selection dropdown */}
        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="clientSelect">Select Saved Client</label>
            <select
              id="clientSelect"
              value={selectedClientId}
              onChange={handleClientSelect}
              disabled={!isAuthorized}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', marginBottom: '15px' }}
            >
              <option value="">Select a client to auto-fill details</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="recipientName">Customer Name *</label>
            <input 
              type="text" 
              id="recipientName" 
              name="recipientName" 
              value={invoiceData.recipientName} 
              onChange={handleInputChange} 
              placeholder="Client Name" 
              required
              disabled={!isAuthorized}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="recipientAddress">Customer Address</label>
            <textarea 
              id="recipientAddress" 
              name="recipientAddress" 
              value={invoiceData.recipientAddress} 
              onChange={handleInputChange} 
              placeholder="Client Address"
              disabled={!isAuthorized}
            ></textarea>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="recipientPhone">Phone Number</label>
            <input 
              type="text" 
              id="recipientPhone" 
              name="recipientPhone" 
              value={invoiceData.recipientPhone} 
              onChange={handleInputChange} 
              placeholder="Phone Number"
              disabled={!isAuthorized}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="recipientEmail">Email</label>
            <input 
              type="email" 
              id="recipientEmail" 
              name="recipientEmail" 
              value={invoiceData.recipientEmail} 
              onChange={handleInputChange} 
              placeholder="client@example.com"
              disabled={!isAuthorized}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="recipientWebsite">Website</label>
            <input 
              type="text" 
              id="recipientWebsite" 
              name="recipientWebsite" 
              value={invoiceData.recipientWebsite || ''} 
              onChange={handleWebsiteChange} 
              placeholder="www.client-website.com"
              disabled={!isAuthorized}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="recipientGSTIN">GSTIN</label>
            <input 
              type="text" 
              id="recipientGSTIN" 
              name="recipientGSTIN" 
              value={invoiceData.recipientGSTIN} 
              onChange={handleInputChange} 
              placeholder="GSTIN (if applicable)"
              disabled={!isAuthorized}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="recipientPAN">PAN</label>
            <input 
              type="text" 
              id="recipientPAN" 
              name="recipientPAN" 
              value={invoiceData.recipientPAN} 
              onChange={handleInputChange} 
              placeholder="PAN (if applicable)"
              disabled={!isAuthorized}
            />
          </div>
        </div>
      </div>
      
      {/* Invoice Summary Section */}
      <div className="form-section invoice-card-section" style={{ marginBottom: 32, background: 'var(--secondary-color)', borderRadius: 14, boxShadow: '0 2px 12px rgba(59,130,246,0.04)', padding: '24px 20px', border: '1px solid var(--border-color)' }}>
        <h2 className="section-title" style={{ fontSize: 22, color: 'var(--primary-color)', fontWeight: 700, letterSpacing: 1, marginBottom: 18, borderLeft: '4px solid var(--primary-color)', paddingLeft: 12 }}>Invoice Summary</h2>
        
        <div className="form-row rates-section">
          <div className="form-group">
            <label htmlFor="exchangeRate">USD to INR Rate</label>
            <input 
              type="number" 
              id="exchangeRate" 
              value={exchangeRate} 
              onChange={handleExchangeRateChange}
              step="0.01" 
              min="0"
              disabled={!isAuthorized}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="taxRate">GST Rate (%)</label>
            <input 
              type="number" 
              id="taxRate" 
              name="taxRate" 
              value={invoiceData.taxRate} 
              onChange={handleInputChange} 
              min="0" 
              max="100" 
              step="0.01"
              disabled={!isAuthorized}
            />
          </div>
          
          <div className="form-group">
            <label>Primary Currency</label>
            <div className="radio-group">
              <label>
                <input 
                  type="radio" 
                  name="currency" 
                  value="USD" 
                  checked={invoiceData.currency === 'USD'} 
                  onChange={handleCurrencyToggle}
                  disabled={!isAuthorized}
                /> USD
              </label>
              <label>
                <input 
                  type="radio" 
                  name="currency" 
                  value="INR" 
                  checked={invoiceData.currency === 'INR'} 
                  onChange={handleCurrencyToggle}
                  disabled={!isAuthorized}
                /> INR
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Service Items Table */}
      <div className="form-section invoice-card-section" style={{ marginBottom: 32, background: 'var(--secondary-color)', borderRadius: 14, boxShadow: '0 2px 12px rgba(59,130,246,0.04)', padding: '24px 20px', border: '1px solid var(--border-color)' }}>
        <h2 className="section-title" style={{ fontSize: 22, color: 'var(--primary-color)', fontWeight: 700, letterSpacing: 1, marginBottom: 18, borderLeft: '4px solid var(--primary-color)', paddingLeft: 12 }}>Service Items</h2>
        
        <InvoiceItemsTable 
          items={invoiceData.items}
          setItems={(newItems) => {
            if (!isAuthorized) return; // Prevent updates if not authorized
            
            // Update the invoice data with new items
            setInvoiceData({...invoiceData, items: newItems});
            // Calculate totals when items change
            updateCalculations(newItems);
          }}
          exchangeRate={exchangeRate}
          currency={invoiceData.currency}
          disabled={!isAuthorized}
        />
        
        <div className="totals">
          <table>
            <tbody>
              <tr>
                <td>Subtotal:</td>
                <td>
                  ${invoiceData.subtotalUSD.toFixed(2)} / 
                  ₹{invoiceData.subtotalINR.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td>GST ({invoiceData.taxRate}%):</td>
                <td>
                  ${invoiceData.taxAmountUSD.toFixed(2)} / 
                  ₹{invoiceData.taxAmountINR.toFixed(2)}
                </td>
              </tr>
              <tr className="grand-total">
                <td>Grand Total:</td>
                <td>
                  ${invoiceData.totalUSD.toFixed(2)} / 
                  ₹{invoiceData.totalINR.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Beneficiary Bank Details */}
      <div className="form-section invoice-card-section" style={{ marginBottom: 32, background: 'var(--secondary-color)', borderRadius: 14, boxShadow: '0 2px 12px rgba(59,130,246,0.04)', padding: '24px 20px', border: '1px solid var(--border-color)' }}>
        <h2 className="section-title" style={{ fontSize: 22, color: 'var(--primary-color)', fontWeight: 700, letterSpacing: 1, marginBottom: 18, borderLeft: '4px solid var(--primary-color)', paddingLeft: 12 }}>Beneficiary Account Details</h2>
        
        <div className="form-row">
          <div className="form-group full-width">            <label htmlFor="accountName">Account Name</label>
            <input 
              type="text" 
              id="accountName" 
              name="accountName" 
              value={(invoiceData.bankDetails?.accountName || invoiceData.accountName || '')} 
              onChange={(e) => updateBankDetails('accountName', e.target.value)} 
              placeholder="Account Name"
              disabled={!isAuthorized}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="bankName">Bank Name</label>
            <input 
              type="text" 
              id="bankName" 
              name="bankName" 
              value={invoiceData.bankName || ''} 
              onChange={(e) => updateBankDetails('bankName', e.target.value)} 
              placeholder="Bank Name"
              disabled={!isAuthorized}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="accountNumber">Account Number</label>
            <input 
              type="text" 
              id="accountNumber" 
              name="accountNumber" 
              value={invoiceData.accountNumber || ''} 
              onChange={(e) => updateBankDetails('accountNumber', e.target.value)} 
              placeholder="Account Number"
              disabled={!isAuthorized}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="ifscCode">IFSC Code</label>
            <input 
              type="text" 
              id="ifscCode" 
              name="ifscCode" 
              value={invoiceData.ifscCode || ''} 
              onChange={(e) => updateBankDetails('ifscCode', e.target.value)} 
              placeholder="IFSC Code"
              disabled={!isAuthorized}
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="notes">Additional Notes</label>
            <textarea 
              id="notes" 
              name="notes" 
              value={invoiceData.notes} 
              onChange={handleInputChange} 
              placeholder="Additional notes for the invoice"
              disabled={!isAuthorized}
            ></textarea>
          </div>
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="form-actions" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '16px', justifyContent: 'flex-start', alignItems: 'center', marginTop: '24px', background: 'transparent', border: 'none', boxShadow: 'none' }}>
        <div className="main-actions" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <button onClick={onPreview} className="btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
              <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
              <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
            </svg>
            Preview Invoice
          </button>
          <button onClick={downloadPDF} className="btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>
            Download PDF
          </button>
          <button onClick={() => setShowSendModal(true)} className="btn" disabled={!isAuthorized}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
              <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
            </svg>
            Send Invoice
          </button>
          <button onClick={() => setShowResetModal(true)} className="btn btn-secondary" disabled={!isAuthorized}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
              <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
            </svg>
            Reset Form
          </button>
          <button onClick={onSave} className="btn" disabled={!isAuthorized}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
              <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a2 2 0 0 1 2 2v7.293l3.05-3.05a.5.5 0 1 1 .707.707l-3.5 3.5a.5.5 0 0 1-.707 0l-3.5-3.5a.5.5 0 1 1 .707-.707L7.5 9.293V2a1 1 0 0 0-1-1H2z"/>
            </svg>
            Save Invoice
          </button>
        </div>
        {invoiceData.invoiceNumber && id && id !== 'new' && (
          <div className="delete-action" style={{ marginLeft: 'auto', display: 'flex' }}>
            <button onClick={onDelete} className="btn btn-danger" disabled={!isAuthorized}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
                <path fillRule="evenodd" d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
              </svg>
              Delete Invoice
            </button>
          </div>
        )}
      </div>
      
      {/* Custom Modals */}
      <Modal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        title="Send Invoice"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowSendModal(false)}>
              Cancel
            </button>
            <button 
              className="btn" 
              onClick={() => {
                setShowSendModal(false);
                sendInvoice();
              }}
              disabled={!isAuthorized}
            >
              Send
            </button>
          </>
        }
      >
        <p>Send invoice to {invoiceData.recipientEmail || 'recipient'}?</p>
        {!invoiceData.recipientEmail && (
          <p style={{ color: 'red' }}>Please enter a recipient email address first.</p>
        )}
        {!isAuthorized && (
          <p style={{ color: 'red' }}>You don't have permission to send this invoice.</p>
        )}
      </Modal>
      
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="New Invoice"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setShowResetModal(false)}>
              Cancel
            </button>
            <button 
              className="btn" 
              onClick={() => {
                setShowResetModal(false);
                onReset();
              }}
              disabled={!isAuthorized}
            >
              Create New
            </button>
          </>
        }
      >
        <p>Are you sure you want to create a new invoice? All current data will be lost.</p>
        {!isAuthorized && (
          <p style={{ color: 'red' }}>You don't have permission to create a new invoice.</p>
        )}
      </Modal>
    </div>
  );
};

export default InvoiceForm;
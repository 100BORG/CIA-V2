import { INVOICE_CONSTANTS } from '../constants';
import exchangeRateService from '../services/exchangeRateService';

/**
 * Invoice business logic
 */
const invoiceLogic = {
  /**
   * Generate a unique ID for an invoice
   * @returns {string} Unique ID
   */
  generateUniqueId: () => {
    return 'inv_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  },

  /**
   * Generate a new invoice number 
   * @param {string} recipientName - The customer name to use in the invoice number
   * @param {boolean} saveIncrement - Whether to save the incremented value to localStorage
   * @returns {string} Formatted invoice number
   */
  generateInvoiceNumber: (recipientName = 'CUST', saveIncrement = false) => {
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Get customer prefix (first 4 letters)
    const customerPrefix = recipientName ? recipientName.trim().substring(0, 4).toUpperCase() : 'CUST';
    
    // Get last invoice serial from localStorage using a customer-specific key
    const customerSerialKey = `invoiceSerial_${customerPrefix}`;
    
    // Get all existing invoices to find the highest invoice number
    const savedInvoices = JSON.parse(localStorage.getItem('savedInvoices')) || [];
    
    // Find the highest serial number for this customer prefix
    let highestSerial = 0;
    const storedLastSerial = parseInt(localStorage.getItem(customerSerialKey) || '0');
    highestSerial = storedLastSerial;
    savedInvoices.forEach(invoice => {
      if (invoice.invoiceNumber && invoice.invoiceNumber.startsWith(customerPrefix)) {
        const parts = invoice.invoiceNumber.split('-');
        if (parts.length === 3) {
          const serialPart = parseInt(parts[2]);
          if (!isNaN(serialPart) && serialPart > highestSerial) {
            highestSerial = serialPart;
          }
        }
      }
    });
    const nextSerial = highestSerial + 1;
    if (saveIncrement) {
      localStorage.setItem(customerSerialKey, nextSerial.toString());
      console.log(`Saved new invoice number: ${customerPrefix}-${dateStr}-${nextSerial.toString().padStart(4, '0')}`);
    } else {
      console.log(`Generated preview invoice number: ${customerPrefix}-${dateStr}-${nextSerial.toString().padStart(4, '0')} (not saved)`);
    }
    const serialFormatted = String(nextSerial).padStart(4, '0');
    return `${customerPrefix}-${dateStr}-${serialFormatted}`;
  },

  /**
   * Update the prefix of an existing invoice number based on a new customer name.
   * Preserves the date and serial number parts.
   * @param {string} currentInvoiceNumber - The existing invoice number (e.g., "CUST-20250505-0001")
   * @param {string} newRecipientName - The new customer name
   * @returns {string} The updated invoice number or the original if format is invalid.
   */
  updateInvoiceNumberPrefix: (currentInvoiceNumber, newRecipientName) => {
    if (!currentInvoiceNumber || !newRecipientName) {
      return currentInvoiceNumber;
    }
    const parts = currentInvoiceNumber.split('-');
    if (parts.length !== 3) {
      console.warn('Cannot update invoice number prefix: Invalid format', currentInvoiceNumber);
      return currentInvoiceNumber;
    }
    const datePart = parts[1];
    const serialPart = parts[2];
    const newCustomerPrefix = newRecipientName.trim().substring(0, 4).toUpperCase();
    const updatedInvoiceNumber = `${newCustomerPrefix}-${datePart}-${serialPart}`;
    console.log(`Updated invoice number prefix: ${currentInvoiceNumber} -> ${updatedInvoiceNumber}`);
    return updatedInvoiceNumber;
  },

  /**
   * Generate a new invoice number in the legacy format
   * @returns {string} Formatted legacy invoice number
   */
  generateLegacyInvoiceNumber: () => {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9000 + 1000);
    
    return `${INVOICE_CONSTANTS.NUMBER_PREFIX}${year}${month}-${random}`;
  },
  
  /**
   * Calculate invoice totals
   * @param {Array} items - Invoice items
   * @param {number} taxRate - Tax rate percentage
   * @returns {Object} Calculated totals
   */
  calculateTotals: (items, taxRate) => {
    // Calculate subtotals
    let subtotalUSD = 0;
    let subtotalINR = 0;
    
    items.forEach(item => {
      subtotalUSD += parseFloat(item.amountUSD) || 0;
      subtotalINR += parseFloat(item.amountINR) || 0;
    });
    
    // Calculate tax amounts
    const taxRateValue = parseFloat(taxRate) || 0;
    const taxAmountUSD = (subtotalUSD * taxRateValue) / 100;
    const taxAmountINR = (subtotalINR * taxRateValue) / 100;
    
    // Calculate totals
    const totalUSD = subtotalUSD + taxAmountUSD;
    const totalINR = subtotalINR + taxAmountINR;
    
    return {
      subtotalUSD,
      subtotalINR,
      taxAmountUSD,
      taxAmountINR,
      totalUSD,
      totalINR
    };
  },
  
  /**
   * Recalculate all values based on exchange rate
   * @param {Array} items - Invoice items
   * @param {number} taxRate - Tax rate percentage
   * @param {number} exchangeRate - USD to INR exchange rate
   * @returns {Object} Updated items and totals
   */
  recalculateWithExchangeRate: (items, taxRate, exchangeRate) => {
    // Update all item amounts based on exchange rate
    const updatedItems = items.map(item => {
      const newItem = { ...item };
      
      // If USD amount exists, calculate INR
      if (newItem.amountUSD) {
        newItem.amountINR = (parseFloat(newItem.amountUSD) * exchangeRate).toFixed(2);
      } 
      // If INR amount exists but USD doesn't, calculate USD
      else if (newItem.amountINR && !newItem.amountUSD) {
        newItem.amountUSD = (parseFloat(newItem.amountINR) / exchangeRate).toFixed(2);
      }
      
      return newItem;
    });
    
    // Calculate all totals with updated items
    const totals = invoiceLogic.calculateTotals(updatedItems, taxRate);
    
    return {
      items: updatedItems,
      ...totals
    };
  },
  
  /**
   * Create a default empty invoice data structure
   * @returns {Object} Default invoice data
   */
  createDefaultInvoice: () => {
    return {
      invoiceNumber: invoiceLogic.generateInvoiceNumber(),
      invoiceDate: new Date().toISOString().split('T')[0],
      taxRate: 5,
      currency: INVOICE_CONSTANTS.CURRENCY.USD,
      logoUrl: '',
      senderName: '',
      senderAddress: '',
      senderGSTIN: '',
      recipientName: '',
      recipientEmail: '',
      recipientAddress: '',
      recipientPhone: '',
      recipientGSTIN: '',
      recipientPAN: '',
      notes: 'Payment Terms: Due on receipt\nBank Details: [Your Bank Details Here]\nThank you for your business!',
      items: [],
      subtotalUSD: 0,
      subtotalINR: 0,
      taxAmountUSD: 0,
      taxAmountINR: 0,
      totalUSD: 0,
      totalINR: 0
    };
  }
};

export default invoiceLogic;
/**
 * Form validation utilities
 */

/**
 * Validate an email address
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(String(email).toLowerCase());
};

/**
 * Validate required field
 * @param {string} value - Field value
 * @returns {boolean} True if valid
 */
export const isRequiredFieldValid = (value) => {
  return value !== undefined && value !== null && String(value).trim() !== '';
};

/**
 * Validate a number field
 * @param {string|number} value - Number to validate
 * @param {Object} options - Validation options
 * @param {number} [options.min] - Minimum value
 * @param {number} [options.max] - Maximum value
 * @returns {boolean} True if valid
 */
export const isValidNumber = (value, options = {}) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return false;
  }
  
  const num = parseFloat(value);
  if (isNaN(num)) {
    return false;
  }
  
  if (options.min !== undefined && num < options.min) {
    return false;
  }
  
  if (options.max !== undefined && num > options.max) {
    return false;
  }
  
  return true;
};

/**
 * Validate invoice form data
 * @param {Object} invoiceData - The invoice data to validate
 * @returns {Object} Validation result with isValid and errors
 */
export const validateInvoiceForm = (invoiceData) => {
  const errors = {};
  
  // Required fields validation
  const requiredFields = {
    invoiceNumber: 'Invoice Number is required',
    invoiceDate: 'Invoice Date is required',
    senderName: 'Company Name is required',
    recipientName: 'Client Name is required',
  };
  
  Object.entries(requiredFields).forEach(([field, message]) => {
    if (!isRequiredFieldValid(invoiceData[field])) {
      errors[field] = message;
    }
  });
  
  // Email validation if provided
  if (invoiceData.recipientEmail && !isValidEmail(invoiceData.recipientEmail)) {
    errors.recipientEmail = 'Please enter a valid email address';
  }
  
  // Tax rate validation
  if (invoiceData.taxRate !== undefined && !isValidNumber(invoiceData.taxRate, { min: 0, max: 100 })) {
    errors.taxRate = 'Tax Rate must be a number between 0 and 100';
  }
  
  // Invoice items validation
  if (!invoiceData.items || invoiceData.items.length === 0) {
    errors.items = 'Please add at least one item to the invoice';
  } else {
    // Check if any item has a description but no amount
    const invalidItems = invoiceData.items.filter(
      item => item.description && item.description.trim() !== '' && 
      ((!item.amountUSD || parseFloat(item.amountUSD) === 0) && 
       (!item.amountINR || parseFloat(item.amountINR) === 0))
    );
    
    if (invalidItems.length > 0) {
      errors.items = 'All items must have an amount in USD or INR';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  isValidEmail,
  isRequiredFieldValid,
  isValidNumber,
  validateInvoiceForm
};
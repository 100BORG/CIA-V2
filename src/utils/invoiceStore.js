// Invoice data management utility with Supabase
import { supabase } from '../config/supabaseClient';

/**
 * Invoice data management utility - replaces localStorage for invoice-related data
 * All invoice-related data is stored in Supabase instead of localStorage
 */
export const invoiceStore = {
  /**
   * Generate a unique invoice number
   * @param {string} recipientName - The customer name to use in the invoice number
   * @returns {string} The generated invoice number
   */
  async generateInvoiceNumber(recipientName = 'CUST') {
    // Format: CUST-YYYYMMDD-XXXX
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Get customer prefix (first 4 letters)
    const customerPrefix = recipientName 
      ? recipientName.trim().substring(0, 4).toUpperCase() 
      : 'CUST';
    
    // Get next serial number from Supabase
    const { data, error } = await supabase.rpc('get_next_invoice_serial', {
      prefix: customerPrefix,
      date_key: dateStr
    });
    
    // If there was an error, fall back to a timestamp-based number
    const serialNumber = !error && data ? data : Math.floor(Math.random() * 9000) + 1000;
    const serialFormatted = String(serialNumber).padStart(4, '0');
    
    return `${customerPrefix}-${dateStr}-${serialFormatted}`;
  },
  
  /**
   * Update an invoice number's prefix
   * @param {string} currentInvoiceNumber - The current invoice number
   * @param {string} newRecipientName - The new recipient name
   * @returns {string} The updated invoice number
   */
  updateInvoiceNumberPrefix(currentInvoiceNumber, newRecipientName) {
    if (!currentInvoiceNumber || !newRecipientName) {
      return currentInvoiceNumber;
    }
    
    // Extract parts
    const parts = currentInvoiceNumber.split('-');
    if (parts.length !== 3) {
      return currentInvoiceNumber;
    }
    
    // Replace prefix with new one
    const newPrefix = newRecipientName.trim().substring(0, 4).toUpperCase();
    parts[0] = newPrefix;
    
    return parts.join('-');
  },
  
  /**
   * Get saved invoices for the current user
   * @returns {Array} The user's saved invoices
   */
  async getSavedInvoices() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .is('deletedAt', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching saved invoices:', error);
      return [];
    }
    
    return data || [];
  },
  
  /**
   * Get deleted invoices for the current user
   * @returns {Array} The user's deleted invoices
   */
  async getDeletedInvoices() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    // Fetch invoices where deletedAt is not null and deletedBy is current user
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('deletedBy', user.id)
      .not('deletedAt', 'is', null)
      .gte('deletedAt', thirtyDaysAgo)
      .order('deletedAt', { ascending: false });
      
    if (error) {
      console.error('Error fetching deleted invoices:', error);
      return [];
    }
    
    return data || [];
  }
};

export default invoiceStore;

import emailjs from '@emailjs/browser';
import { API_CONFIG } from '../config/appConfig';

/**
 * EmailJS service for sending emails
 */
const emailService = {
  /**
   * Initialize EmailJS with public key
   */
  init: () => {
    try {
      emailjs.init(API_CONFIG.emailJs.publicKey);
      return true;
    } catch (error) {
      console.error('Error initializing EmailJS:', error);
      return false;
    }
  },

  /**
   * Send an invoice via email
   * @param {Object} params - Email parameters
   * @param {string} params.to_email - Recipient email
   * @param {string} params.subject - Email subject
   * @param {string} params.message - Email message
   * @param {string} params.attachment - Base64 attachment
   * @returns {Promise} - EmailJS response
   */
  sendInvoice: async (params) => {
    // Make sure EmailJS is initialized before sending
    emailService.init();
    
    return emailjs.send(
      API_CONFIG.emailJs.serviceId,
      API_CONFIG.emailJs.templateId,
      params
    );
  }
};

// Initialize EmailJS when this module loads
emailService.init();

export default emailService;
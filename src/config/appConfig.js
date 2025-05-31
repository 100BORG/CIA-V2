/**
 * App-wide configuration settings
 */

// API configuration
export const API_CONFIG = {
  // Exchange rate API configuration
  exchangeRate: {
    apiUrl: 'https://open.er-api.com/v6/latest/USD',
    defaultRate: 82, // Fallback rate if API fails
    refreshInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  },
  
  // EmailJS configuration
  emailJs: {
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  }
};

// App configuration
export const APP_CONFIG = {
  // Authentication settings
  auth: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes in milliseconds
    storagePrefix: 'invoice_app_',
  },
  
  // File upload limits
  uploads: {
    maxLogoSizeMB: 2, // Maximum logo size in MB
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif'],
  },
  
  // PDF generation settings
  pdf: {
    format: 'a4',
    orientation: 'portrait',
    quality: 1.0,
    scale: 2,
  }
};
/**
 * Application constants
 */

// Authentication related constants
export const AUTH_CONSTANTS = {
  ROUTES: {
    LOGIN: '/login',
    HOME: '/',
    DEBUG: '/debug',
    DIAGNOSTIC: '/diagnostic',
    DEMO: '/demo',
  },
  STORAGE_KEYS: {
    IS_LOGGED_IN: 'isLoggedIn',
    USER_EMAIL: 'userEmail',
    LAST_LOGIN: 'lastLogin',
    LAST_ACTIVITY: 'lastActivity',
  },
};

// Invoice related constants
export const INVOICE_CONSTANTS = {
  CURRENCY: {
    USD: 'USD',
    INR: 'INR',
  },
  DATE_FORMAT: 'YYYY-MM-DD',
  NUMBER_PREFIX: 'INV-',
};

// UI related constants
export const UI_CONSTANTS = {
  THEME: {
    LIGHT: 'light',
    DARK: 'dark',
  },
  MODAL_TYPES: {
    CONFIRM: 'confirm',
    ALERT: 'alert',
    FORM: 'form',
  },
  ANIMATION_DURATION: 300, // milliseconds
};

export default {
  AUTH_CONSTANTS,
  INVOICE_CONSTANTS,
  UI_CONSTANTS,
};
import { APP_CONFIG } from '../config/appConfig';

const { storagePrefix } = APP_CONFIG.auth;

/**
 * Storage utility for handling localStorage with prefixed keys
 */
export const storage = {
  /**
   * Get an item from localStorage
   * @param {string} key - The key to retrieve
   * @param {any} defaultValue - Default value if key doesn't exist
   * @returns {any} The stored value or defaultValue
   */
  get: (key, defaultValue = null) => {
    const value = localStorage.getItem(`${storagePrefix}${key}`);
    if (value === null) return defaultValue;
    
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  },

  /**
   * Set an item in localStorage
   * @param {string} key - The key to set
   * @param {any} value - The value to store
   */
  set: (key, value) => {
    const valueToStore = typeof value === 'object' ? JSON.stringify(value) : value;
    localStorage.setItem(`${storagePrefix}${key}`, valueToStore);
  },

  /**
   * Remove an item from localStorage
   * @param {string} key - The key to remove
   */
  remove: (key) => {
    localStorage.removeItem(`${storagePrefix}${key}`);
  },

  /**
   * Clear all items from localStorage that match the prefix
   */
  clearAll: () => {
    Object.keys(localStorage)
      .filter(key => key.startsWith(storagePrefix))
      .forEach(key => localStorage.removeItem(key));
  },

  /**
   * Update the last activity timestamp
   */
  updateLastActivity: () => {
    storage.set('lastActivity', new Date().getTime());
  }
};

export default storage;